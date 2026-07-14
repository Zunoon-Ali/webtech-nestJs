import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiRequestLog } from '../../database/entities';
import { AiFeature } from '../../shared-types';

/**
 * AiProxyService — the ONLY module that makes LLM calls.
 *
 * Supports:
 *  - Google Gemini (default, free tier) — set AI_PROVIDER=gemini, GEMINI_API_KEY=<key>
 *  - OpenAI GPT-4o-mini (free $5 credit) — set AI_PROVIDER=openai, OPENAI_API_KEY=<key>
 *
 * Idempotency: each requestId is cached in-memory; duplicate calls return the cached result
 * without re-billing the LLM. AiRequestLog stores token-count metadata only (no raw prompts).
 */
@Injectable()
export class AiProxyService {
  private readonly logger = new Logger(AiProxyService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly model: string;

  /** In-memory idempotency cache: requestId → result */
  private readonly cache = new Map<string, any>();

  constructor(
    @InjectRepository(AiRequestLog) private readonly aiLogRepo: Repository<AiRequestLog>,
    private readonly configService: ConfigService,
  ) {
    this.provider = this.configService.get<string>('ai.provider') || 'gemini';
    this.apiKey   = this.configService.get<string>('ai.apiKey')   || '';
    this.model    = this.configService.get<string>('ai.model')    || 'gemini-2.0-flash';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public entry point
  // ─────────────────────────────────────────────────────────────────────────────

  async call(
    feature: AiFeature,
    requestId: string,
    payload: Record<string, any>,
    userId: string,
  ) {
    // 1. Idempotency: return cached result if same requestId was already processed
    if (this.cache.has(requestId)) {
      this.logger.log(`[AI Proxy] Cache hit: requestId=${requestId}`);
      return { fromCache: true, result: this.cache.get(requestId) };
    }

    let result: any;
    let status: 'success' | 'failed' | 'fallback_used' = 'success';
    let errorMessage: string | undefined;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      if (!this.apiKey) {
        this.logger.warn(`[AI Proxy] No API key configured — using fallback for feature=${feature}`);
        result = this.localFallback(feature, payload);
        status = 'fallback_used';
      } else {
        const prompt = this.buildPrompt(feature, payload);
        const response = await this.callLLM(prompt);
        result = response.parsed;
        promptTokens = response.promptTokens;
        completionTokens = response.completionTokens;
      }
    } catch (err: any) {
      this.logger.error(`[AI Proxy] LLM call failed: ${err.message}`);
      result = this.localFallback(feature, payload);
      status = 'fallback_used';
      errorMessage = err.message;
    }

    // 2. Store in idempotency cache
    this.cache.set(requestId, result);

    // 3. Persist audit log — token-count metadata only, never raw content (data-privacy)
    try {
      await this.aiLogRepo.save(
        this.aiLogRepo.create({
          userId,
          feature,
          requestId,
          promptTokens,
          completionTokens,
          status,
        }),
      );
    } catch (logErr: any) {
      this.logger.error(`[AI Proxy] Audit log write failed: ${logErr.message}`);
    }

    return { fromCache: false, result, error: errorMessage };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LLM dispatch
  // ─────────────────────────────────────────────────────────────────────────────

  private async callLLM(prompt: string): Promise<{ parsed: any; promptTokens: number; completionTokens: number }> {
    if (this.provider === 'openai') {
      return this.callOpenAI(prompt);
    }
    return this.callGemini(prompt);
  }

  /**
   * Google Gemini REST API (free tier: gemini-2.0-flash)
   * Docs: https://ai.google.dev/api/generate-content
   */
  private async callGemini(prompt: string): Promise<{ parsed: any; promptTokens: number; completionTokens: number }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    };

    const res = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = this.safeParseJson(text);

    return {
      parsed,
      promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  /**
   * OpenAI API (gpt-4o-mini — cheapest/free-credit option)
   * Docs: https://platform.openai.com/docs/api-reference/chat
   */
  private async callOpenAI(prompt: string): Promise<{ parsed: any; promptTokens: number; completionTokens: number }> {
    const res = await this.fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text: string = data?.choices?.[0]?.message?.content ?? '{}';
    const parsed = this.safeParseJson(text);

    return {
      parsed,
      promptTokens: data?.usage?.prompt_tokens ?? 0,
      completionTokens: data?.usage?.completion_tokens ?? 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Prompt builder — matches templates in 07-AI-INTEGRATION.md
  // ─────────────────────────────────────────────────────────────────────────────

  private buildPrompt(feature: AiFeature, payload: Record<string, any>): string {
    switch (feature) {
      case AiFeature.LEARNING_PATH:
        return `You are a corporate training advisor. Respond ONLY with valid JSON matching this schema exactly:
{"items":[{"courseId":string,"title":string,"rationale":string,"estimatedMinutes":number}],"totalEstimatedMinutes":number}
Only recommend courses from the provided catalogue. Recommend 5–8 courses in logical learning order.

Employee role: ${payload.currentRole}
Department: ${payload.department}
Career goal: ${payload.careerGoal}
Completed courses: ${payload.completionHistorySummary ?? 'none'}
Available catalogue: ${JSON.stringify(payload.catalogueJson ?? [])}`;

      case AiFeature.QUIZ_GEN:
        return `You are an instructional designer. Respond ONLY with valid JSON:
{"questions":[{"type":"mcq"|"short_answer","text":string,"options":string[]|null,"correctAnswer":string,"explanation":string}]}
For MCQ provide exactly 4 options. Base every question strictly on the source text — do not invent facts.

Source text: ${payload.extractedText}
Question count: ${payload.questionCount ?? 10}
Difficulty: ${payload.difficulty ?? 'medium'}`;

      case AiFeature.GAP_ANALYSIS:
        return `You are a compliance analyst. Respond ONLY with valid JSON:
{"items":[{"userId":string,"covered":string[],"partiallyCovered":string[],"missing":string[],"priorityScore":number}]}
priorityScore must weight regulatory deadline urgency higher than elective gaps.

Team roster with completion records: ${JSON.stringify(payload.teamCompletionTable ?? [])}
Target competency framework: ${JSON.stringify(payload.frameworkJson ?? {})}`;

      case AiFeature.RISK_ALERT:
        return `You are drafting a professional compliance reminder email. Respond ONLY with valid JSON:
{"subject":string,"body":string}
Mention exact course names and deadlines. Include placeholder {{enrollmentLink}} in the body.

Employee: ${payload.firstName} ${payload.lastName}, Role: ${payload.role}
Incomplete mandatory courses: ${payload.courseListWithDeadlines ?? 'None specified'}
Days until nearest deadline: ${payload.daysRemaining ?? 0}`;

      default:
        return JSON.stringify(payload);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Static fallbacks — per 07-AI-INTEGRATION.md §6
  // ─────────────────────────────────────────────────────────────────────────────

  private localFallback(feature: AiFeature, _payload: Record<string, any>): any {
    switch (feature) {
      case AiFeature.LEARNING_PATH:
        return {
          items: [
            { courseId: 'fallback-001', title: 'Introduction to Risk & Compliance', rationale: 'Mandatory onboarding for all employees.', estimatedMinutes: 60 },
            { courseId: 'fallback-002', title: 'Data Protection Essentials', rationale: 'GDPR awareness required by regulation.', estimatedMinutes: 45 },
            { courseId: 'fallback-003', title: 'Anti-Money Laundering Basics', rationale: 'AML certification required for financial roles.', estimatedMinutes: 90 },
          ],
          totalEstimatedMinutes: 195,
          usedFallback: true,
        };

      case AiFeature.QUIZ_GEN:
        return {
          questions: [
            {
              type: 'mcq',
              text: 'What is the primary objective of regulatory compliance?',
              options: ['Follow applicable laws and regulations', 'Maximise company profit', 'Reduce headcount', 'Improve brand marketing'],
              correctAnswer: 'Follow applicable laws and regulations',
              explanation: 'Compliance ensures the organisation adheres to external laws and internal guidelines.',
            },
          ],
          usedFallback: true,
        };

      case AiFeature.GAP_ANALYSIS:
        return {
          items: [],
          message: 'AI unavailable — please review the compliance report directly for gap identification.',
          usedFallback: true,
        };

      case AiFeature.RISK_ALERT:
        return {
          subject: 'ACTION REQUIRED: Mandatory Training Overdue',
          body: 'Dear employee, you have overdue mandatory training. Please complete it at {{enrollmentLink}} before the deadline to remain compliant.',
          usedFallback: true,
        };

      default:
        return { error: 'Unknown feature', usedFallback: true };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Wraps native fetch with an 8-second timeout (per spec: >8s → fallback).
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Strip markdown code fences then JSON.parse — per 07-AI-INTEGRATION.md §3.
   */
  private safeParseJson(text: string): any {
    // Strip ```json ... ``` or ``` ... ```
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(stripped);
    } catch {
      this.logger.warn(`[AI Proxy] JSON parse failed on response: ${stripped.slice(0, 200)}`);
      return { raw: stripped, parseError: true };
    }
  }
}
