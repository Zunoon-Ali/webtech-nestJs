import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../../database/entities';
import { UserRole } from '../../shared-types';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { ValidationPipe } from '../../common/pipes/validation.pipe';

const mockUser: Partial<User> = {
  id: 'test-user-uuid',
  email: 'jane.doe@nexara.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: UserRole.EMPLOYEE,
  isActive: true,
  companyId: 'company-uuid',
  teamId: null,
};

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'jwt.accessSecret': 'access-secret',
      'jwt.accessExpiry': '15m',
      'jwt.refreshSecret': 'refresh-secret',
      'jwt.refreshExpiry': '7d',
    };
    return map[key];
  }),
};

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: 'ConfigService', useValue: mockConfigService },
        {
          provide: 'Reflector',
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(null) },
        },
      ],
    })
      .overrideProvider('ConfigService')
      .useValue(mockConfigService)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 on successful registration', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...mockUser, passwordHash: 'hash', refreshTokenHash: null });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, passwordHash: 'hash', refreshTokenHash: null });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'jane.doe@nexara.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Doe',
          role: UserRole.EMPLOYEE,
          companyId: 'company-uuid',
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'bad' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('should return 409 when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'jane.doe@nexara.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Doe',
          role: UserRole.EMPLOYEE,
          companyId: 'company-uuid',
        });

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpass' });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
