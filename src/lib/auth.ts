import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'votre.email@ansut.ci' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
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

        if (!user.isActive) {
          return null;
        }

        if (user.isLocked) {
          return null;
        }

        // Compare password — support both plain text (legacy) and hashed
        const isPasswordValid =
          user.password.startsWith('$2') ||
          user.password.startsWith('$2a') ||
          user.password.startsWith('$2b')
            ? await compare(credentials.password, user.password)
            : credentials.password === user.password;

        if (!isPasswordValid) {
          // Increment failed attempts
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

        // Reset failed attempts on successful login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lastLogin: new Date(),
          },
        });

        // Build the session user object with role and permissions
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
    maxAge: 8 * 60 * 60, // 8 hours
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