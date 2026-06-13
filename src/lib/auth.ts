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

// ─── Auth options builder (used by [...nextauth]/route.ts) ──────────────
export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const maxAge = await getSessionMaxAge();

  return {
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
              console.log('[auth] Missing credentials');
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
              console.log('[auth] User not found');
              return null;
            }

            if (!user.isActive) {
              console.log('[auth] User inactive');
              return null;
            }

            if (user.isLocked) {
              console.log('[auth] User locked');
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

              console.log('[auth] Invalid password');
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
          } catch (error) {
            console.error('[auth] authorize error:', error);
            return null;
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.department = user.department;
          token.permissions = (user as unknown as { permissions: Record<string, string> }).permissions;
        }

        // Enforce dynamic session timeout from DB settings
        if (token.iat) {
          const maxAge = await getSessionMaxAge();
          const expiresAt = (token.iat as number) + maxAge;
          if (Date.now() / 1000 > expiresAt) {
            return {} as typeof token;
          }
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user && 'id' in token) {
          (session.user as Record<string, unknown>).id = token.id;
          (session.user as Record<string, unknown>).role = token.role;
          (session.user as Record<string, unknown>).department = token.department;
          (session.user as Record<string, unknown>).permissions = token.permissions;
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
}

// Static fallback for legacy imports (routes that don't need dynamic timeout)
export const authOptions: NextAuthOptions = {
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
            console.log('[auth] Missing credentials');
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
            console.log('[auth] User not found');
            return null;
          }

          if (!user.isActive) {
            console.log('[auth] User inactive');
            return null;
          }

          if (user.isLocked) {
            console.log('[auth] User locked');
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

            console.log('[auth] Invalid password');
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
        } catch (error) {
          console.error('[auth] authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.permissions = (user as unknown as { permissions: Record<string, string> }).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).department = token.department;
        (session.user as Record<string, unknown>).permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: {
        id: string;
        name: string;
        label: string;
        level: number;
        color: string;
        isSystem: boolean;
      } | null;
      department: {
        id: string;
        name: string;
        code: string | null;
      } | null;
      permissions: Record<string, string>;
    } & DefaultSession['user'];
  }

  interface User {
    role?: {
      id: string;
      name: string;
      label: string;
      level: number;
      color: string;
      isSystem: boolean;
    } | null;
    department?: {
      id: string;
      name: string;
      code: string | null;
    } | null;
    permissions?: Record<string, string>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: {
      id: string;
      name: string;
      label: string;
      level: number;
      color: string;
      isSystem: boolean;
    } | null;
    department?: {
      id: string;
      name: string;
      code: string | null;
    } | null;
    permissions?: Record<string, string>;
  }
}