import 'dotenv/config';

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  expiresIn: '1h',
} as const;