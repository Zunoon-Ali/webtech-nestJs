import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*', // tightened at AppModule level in production
    credentials: true,
  },
  namespace: '/',
})
export class SkillForgeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SkillForgeGateway.name);

  /** userId → Set<socketId> map for unicast delivery */
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialised');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      }) as { sub: string };

      client.data.userId = payload.sub;

      // Register socket in user map
      if (!this.userSocketMap.has(payload.sub)) {
        this.userSocketMap.set(payload.sub, new Set());
      }
      this.userSocketMap.get(payload.sub)!.add(client.id);
      client.join(`user:${payload.sub}`);

      this.logger.log(`Client connected: userId=${payload.sub}, socketId=${client.id}`);
    } catch {
      this.logger.warn(`Rejected unauthenticated socket: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSocketMap.has(userId)) {
      const sockets = this.userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSocketMap.delete(userId);
        }
      }
    }
    this.logger.log(`Client disconnected: socketId=${client.id}`);
  }

  // ---- Server-to-client pushers ----

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitBroadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  // ---- Event listeners that bridge EventEmitter → WebSocket ----

  @OnEvent('quiz.liveScore')
  handleLiveScore(payload: { attemptId: string; answeredCount: number; totalQuestions: number; runningScorePercent: number }) {
    // Broadcast to all sockets in the attempt room (if joined)
    this.server.to(`attempt:${payload.attemptId}`).emit('quiz:live_score', payload);
  }

  @OnEvent('notification.certificate_issued')
  handleCertificateNotif(payload: { userId: string; certificateId: string; courseTitle: string; pdfUrl: string }) {
    this.emitToUser(payload.userId, 'notification:certificate_issued', payload);
  }

  @OnEvent('notification.deadline_reminder')
  handleDeadlineReminder(payload: { userId: string; courseTitle: string; dueDate: string; daysLeft: number }) {
    this.emitToUser(payload.userId, 'notification:deadline_approaching', payload);
  }

  @OnEvent('enrollment.completed')
  handleEnrollmentCompleted(payload: { managerId: string; employeeName: string; courseTitle: string; completedAt: string }) {
    this.emitToUser(payload.managerId, 'notification:employee_course_completed', payload);
  }

  // ---- Client-to-server ----

  @SubscribeMessage('quiz:join_attempt')
  handleJoinAttempt(@MessageBody() data: { attemptId: string }, @ConnectedSocket() client: Socket) {
    client.join(`attempt:${data.attemptId}`);
    return { status: 'ok', room: `attempt:${data.attemptId}` };
  }
}
