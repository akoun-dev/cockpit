import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/indicators/:id — single indicator
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const indicator = await db.indicator.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    })
    if (!indicator) {
      return NextResponse.json({ error: 'Indicateur non trouvé' }, { status: 404 })
    }
    return NextResponse.json({ data: indicator })
  } catch (error) {
    console.error('[GET /api/admin/indicators/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch indicator' }, { status: 500 })
  }
}

// PUT /api/admin/indicators/:id — update indicator
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    const existing = await db.indicator.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Indicateur non trouvé' }, { status: 404 })
    }

    const {
      name,
      code,
      description,
      domain,
      subDomain,
      unit,
      targetValue,
      alertValue,
      criticalValue,
      formula,
      frequency,
      sourceSystem,
      departmentId,
      isActive,
      isPriority,
      order,
    } = body

    // If code is being changed, check uniqueness
    if (code && code !== existing.code) {
      const codeConflict = await db.indicator.findUnique({ where: { code: code.trim().toUpperCase() } })
      if (codeConflict) {
        return NextResponse.json(
          { error: `Un indicateur avec le code "${code}" existe déjà` },
          { status: 409 },
        )
      }
    }

    const updated = await db.indicator.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(domain !== undefined ? { domain } : {}),
        ...(subDomain !== undefined ? { subDomain: subDomain || null } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(targetValue !== undefined ? { targetValue: targetValue !== null ? parseFloat(targetValue) : null } : {}),
        ...(alertValue !== undefined ? { alertValue: alertValue !== null ? parseFloat(alertValue) : null } : {}),
        ...(criticalValue !== undefined ? { criticalValue: criticalValue !== null ? parseFloat(criticalValue) : null } : {}),
        ...(formula !== undefined ? { formula: formula || null } : {}),
        ...(frequency !== undefined ? { frequency } : {}),
        ...(sourceSystem !== undefined ? { sourceSystem } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(isPriority !== undefined ? { isPriority } : {}),
        ...(order !== undefined ? { order } : {}),
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_INDICATOR',
        category: 'indicator',
        userId: session.user.id,
        details: `Modifié l'indicateur "${updated.name}" (${updated.code})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PUT /api/admin/indicators/:id]', error)
    return NextResponse.json({ error: 'Failed to update indicator' }, { status: 500 })
  }
}

// DELETE /api/admin/indicators/:id — delete indicator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { id } = await params
    const existing = await db.indicator.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Indicateur non trouvé' }, { status: 404 })
    }

    await db.indicator.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_INDICATOR',
        category: 'indicator',
        userId: session.user.id,
        details: `Supprimé l'indicateur "${existing.name}" (${existing.code}) du domaine "${existing.domain}"`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/indicators/:id]', error)
    return NextResponse.json({ error: 'Failed to delete indicator' }, { status: 500 })
  }
}
