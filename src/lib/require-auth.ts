import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session instanceof Response) return session
  const roleLevel = (session.user as Record<string, unknown>).role
    ? ((session.user as Record<string, unknown>).role as Record<string, unknown>)?.level as number
    : 0
  if (roleLevel < 100) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }
  return session
}
