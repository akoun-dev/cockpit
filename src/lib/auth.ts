import type { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

// ─── Session max-age cache ─────────────────────────────────────────────
let _cachedMaxAge: number | null = null;
let _maxAgeCacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

function parseSessionExpiration(value: string): number {
  const map: Record<string, number> = {
    '30min': 30 * 60,
    '1h': 60 * 60,
    '4h': 4 * 60 * 60,
    '8h': 8 * 60 * 60,
    '24h': 24 * 60 * 60,
  };
  return map[value] ?? 8 * 60 * 60;
}

export async function getSessionMaxAge(): Promise<number> {
  const now = Date.now();
  if (_cachedMaxAge !== null && now - _maxAgeCacheTime < CACHE_TTL) {
    return _cachedMaxAge;
  }
  try {
    const setting = await db.systemSetting.findUnique({ where: { key: 'sessionExpiration' } });
    if (setting) {
      _cachedMaxAge = parseSessionExpiration(JSON.parse(setting.value));
    } else {
      _cachedMaxAge = 8 * 60 * 60;
    }
  } catch {
    _cachedMaxAge = 8 * 60 * 60;
  }
  _maxAgeCacheTime = now;
  return _cachedMaxAge;
}

// ─── Cached auth options (avoids recreating CredentialsProvider per request) ──────
let _cachedAuthOptions: NextAuthOptions | null = null;
let _authOptionsCacheTime = 0;
const AUTH_OPTIONS_CACHE_TTL = 60_000; // 1 minute

export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const now = Date.now();
  if (_cachedAuthOptions !== null && now - _authOptionsCacheTime < AUTH_OPTIONS_CACHE_TTL) {
    return _cachedAuthOptions;
  }

  const maxAge = await getSessionMaxAge();

  const options: NextAuthOptions = {
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'votre.email@ansut.ci' },
          password: { label: 'Mot de passe', type: 'password' },
        },
        async authorize(credentials) {
          try {
            if (!credentials?.email || !credentials?.password) {
              return null;
            }

            const user = await db.user.findUnique({
              where: { email: credentials.email.toLowerCase().trim() },
              include: {
                role: {
                  include: { permissions: true },
                },
                department: true,
              },
            });

            if (!user) {
              return null;
            }

            if (!user.isActive || user.isLocked) {
              return null;
            }

            const isPasswordValid = await compare(credentials.password, user.password);
            if (!isPasswordValid) {
              const newFailedAttempts = user.failedAttempts + 1;
              const shouldLock = newFailedAttempts >= 5;

              await db.user.update({
                where: { id: user.id },
                data: {
                  failedAttempts: newFailedAttempts,
                  isLocked: shouldLock,
                },
              });

              return null;
            }

            await db.user.update({
              where: { id: user.id },
              data: {
                failedAttempts: 0,
                lastLogin: new Date(),
              },
            });

            const permissionsMap: Record<string, string> = {};
            if (user.role?.permissions) {
              for (const perm of user.role.permissions) {
                permissionsMap[perm.module] = perm.access;
              }
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatar,
              fonction: user.fonction,
              matricule: user.matricule,
              role: user.role
                ? {
                    id: user.role.id,
                    name: user.role.name,
                    label: user.role.label,
                    level: user.role.level,
                    color: user.role.color,
                    isSystem: user.role.isSystem,
                  }
                : null,
              department: user.department
                ? {
                    id: user.department.id,
                    name: user.department.name,
                    code: user.department.code,
                  }
                : null,
              permissions: permissionsMap,
            };
          } catch {
            return null;
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = (user as { role?: AuthRole }).role ?? null;
          token.department = (user as { department?: AuthDepartment }).department ?? null;
          token.permissions = (user as { permissions?: Record<string, string> }).permissions ?? {};
          token.fonction = (user as { fonction?: string | null }).fonction ?? null;
          token.matricule = (user as { matricule?: string | null }).matricule ?? null;
        }

        // Enforce dynamic session timeout from DB settings
        if (token.iat && typeof token.iat === 'number') {
          const currentMaxAge = await getSessionMaxAge();
          const expiresAt = token.iat + currentMaxAge;
          if (Date.now() / 1000 > expiresAt) {
            return {} as typeof token;
          }
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as AuthSessionUser).id = token.id;
          (session.user as AuthSessionUser).role = token.role ?? null;
          (session.user as AuthSessionUser).department = token.department ?? null;
          (session.user as AuthSessionUser).permissions = token.permissions ?? {};
          (session.user as AuthSessionUser).fonction = token.fonction ?? null;
          (session.user as AuthSessionUser).matricule = token.matricule ?? null;
        }
        return session;
      },
    },
    pages: {
      signIn: '/',
    },
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60, // Max possible — enforcement is done in jwt callback
    },
    secret: process.env.NEXTAUTH_SECRET,
  };

  _cachedAuthOptions = options;
  _authOptionsCacheTime = now;
  return options;
}

// ─── Types for NextAuth augmentation ─────────────────────────────────────

interface AuthRole {
  id: string;
  name: string;
  label: string;
  level: number;
  color: string;
  isSystem: boolean;
}

interface AuthDepartment {
  id: string;
  name: string;
  code: string | null;
}

interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  fonction?: string | null;
  matricule?: string | null;
  role: AuthRole | null;
  department: AuthDepartment | null;
  permissions: Record<string, string>;
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: AuthSessionUser & DefaultSession['user'];
  }

  interface User {
    role?: AuthRole | null;
    department?: AuthDepartment | null;
    permissions?: Record<string, string>;
    fonction?: string | null;
    matricule?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: AuthRole | null;
    department?: AuthDepartment | null;
    permissions?: Record<string, string>;
    fonction?: string | null;
    matricule?: string | null;
  }
}
