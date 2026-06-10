import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/alerts/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
    const { id } = await params
    const body = await request.json()
    const { isRead, isResolved, resolvedBy } = body

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
        updateData.resolvedBy = resolvedBy ?? 'admin'
      } else {
        updateData.resolvedAt = null
        updateData.resolvedBy = null
      }
    }

    const alert = await db.alert.update({
      where: { id },
      data: updateData,
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const existing = await db.alert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Alerte introuvable' },
        { status: 404 },
      )
    }

    await db.alert.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/alerts/:id]', error)
    return NextResponse.json(
      { error: 'Échec de la suppression de l\'alerte' },
      { status: 500 },
    )
  }
}