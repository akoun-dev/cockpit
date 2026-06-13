import NextAuth from 'next-auth';
import { buildAuthOptions } from '@/lib/auth';

let cached: ReturnType<typeof NextAuth> | null = null;

async function getHandler() {
  if (!cached) {
    const authOptions = await buildAuthOptions();
    cached = NextAuth(authOptions);
  }
  return cached;
}

export async function GET(req: Request, ctx: unknown) {
  const handler = await getHandler();
  return handler(req, ctx);
}

export async function POST(req: Request, ctx: unknown) {
  const handler = await getHandler();
  return handler(req, ctx);
}
