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

export async function requireAdmin(): Promise<NonNullable<Awaited<ReturnType<typeof requireAuth>>>> {
  const session = await requireAuth()
  if (session instanceof Response) return session as never
  const role = session.user.role as { level: number } | null
  const roleLevel = role?.level ?? 0
  if (roleLevel < 100) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 }) as never
  }
  return session
}
