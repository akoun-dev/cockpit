import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/require-auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (session instanceof Response) return session

    const body = await request.json()
    const { name, email, fonction, matricule, avatar } = body

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (fonction !== undefined) updateData.fonction = fonction
    if (matricule !== undefined) updateData.matricule = matricule
    if (avatar !== undefined) updateData.avatar = avatar

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        fonction: true,
        matricule: true,
        avatar: true,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        category: 'user',
        userId: session.user.id,
        details: `Updated profile: ${Object.keys(updateData).join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error: unknown) {
    console.error('[PUT /api/user/profile]', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 })
  }
}
