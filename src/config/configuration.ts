export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'skillforge',
    password: process.env.DB_PASS || 'changeme',
    database: process.env.DB_NAME || 'skillforge',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'changeme',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'changeme',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
  },
  mail: {
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '2525', 10),
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
});