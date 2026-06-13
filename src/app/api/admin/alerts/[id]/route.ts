import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  return session
}

// GET /api/admin/alerts/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await checkAdmin()
    if (session instanceof Response) return session

    const { id } = await params
    const alert = await db.alert.findUnique({ where: { id } })
    if (!alert) {
      return NextResponse.json(
        { error: 'Alerte introuvable' },
        { status: 404 },
      )
    }
    return NextResponse.json({ data: alert })
  } catch (error) {
    console.error('[GET /api/admin/alerts/:id]', error)
    return NextResponse.json(
      { error: 'Échec du chargement de l\'alerte' },
      { status: 500 },
    )
  }
}

// PUT /api/admin/alerts/:id — mark as read, resolve, etc.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await checkAdmin()
    if (session instanceof Response) return session

    const { id } = await params
    const body = await request.json()
    const { isRead, isResolved } = body

    const existing = await db.alert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Alerte introuvable' },
        { status: 404 },
      )
    }

    const updateData: Record<string, unknown> = {}
    if (isRead !== undefined) updateData.isRead = isRead
    if (isResolved !== undefined) {
      updateData.isResolved = isResolved
      if (isResolved) {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = session.user.id
      } else {
        updateData.resolvedAt = null
        updateData.resolvedBy = null
      }
    }

    const alert = await db.alert.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: isResolved ? 'RESOLVE_ALERT' : isRead ? 'READ_ALERT' : 'UPDATE_ALERT',
        category: 'alert',
        userId: session.user.id,
        details: `Mise à jour de l'alerte "${existing.message?.substring(0, 50) || id}" (${isResolved ? 'résolue' : isRead ? 'lue' : 'modifiée'})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: alert })
  } catch (error) {
    console.error('[PUT /api/admin/alerts/:id]', error)
    return NextResponse.json(
      { error: 'Échec de la mise à jour de l\'alerte' },
      { status: 500 },
    )
  }
}

// DELETE /api/admin/alerts/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await checkAdmin()
    if (session instanceof Response) return session

    const { id } = await params
    const existing = await db.alert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Alerte introuvable' },
        { status: 404 },
      )
    }

    await db.alert.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_ALERT',
        category: 'alert',
        userId: session.user.id,
        details: `Suppression de l'alerte "${existing.message?.substring(0, 50) || id}"`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/alerts/:id]', error)
    return NextResponse.json(
      { error: 'Échec de la suppression de l\'alerte' },
      { status: 500 },
    )
  }
}