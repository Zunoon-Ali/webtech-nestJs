import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'skillforge',
  password: process.env.DB_PASS || 'changeme',
  database: process.env.DB_NAME || 'skillforge',
  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // Synchronize in dev only, use migrations for production
  logging: process.env.NODE_ENV === 'development',
}));