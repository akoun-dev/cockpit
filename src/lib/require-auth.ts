import { getServerSession } from 'next-auth'
import { buildAuthOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

type AuthResult = Session | NextResponse

function isErrorResponse(result: AuthResult): result is NextResponse {
  return result instanceof NextResponse;
}

export async function requireAuth(): Promise<AuthResult> {
  const authOptions = await buildAuthOptions()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  return session
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (isErrorResponse(result)) return result
  const role = result.user.role as { level: number } | null
  const roleLevel = role?.level ?? 0
  if (roleLevel < 100) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }
  return result
}

/**
 * Helper to extract session from requireAuth/requireAdmin results.
 * Returns null if the result is an error response.
 */
export function getSessionFromResult(result: AuthResult): Session | null {
  if (isErrorResponse(result)) return null
  return result
}
