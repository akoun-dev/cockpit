import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/roles/[id] — role with all permissions
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const role = await db.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ data: role })
  } catch (error) {
    console.error('[GET /api/admin/roles/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 },
    )
  }
}

// PUT /api/admin/roles/[id] — update role fields
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const { label, description, level, color } = body

    const existing = await db.role.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const updated = await db.role.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(color !== undefined && { color }),
      },
      include: { permissions: true },
    })

    // Audit log
    const changes: string[] = []
    if (label !== undefined && label !== existing.label) changes.push(`label: "${existing.label}" → "${label}"`)
    if (description !== undefined && description !== existing.description) changes.push('description changed')
    if (level !== undefined && level !== existing.level) changes.push(`level: ${existing.level} → ${level}`)

    await db.auditLog.create({
      data: {
        action: 'UPDATE_ROLE',
        category: 'role',
        userId: session.user.id,
        details: `Updated role "${existing.label}" (${existing.name}) — ${changes.join(', ') || 'no field changes'}`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PUT /api/admin/roles/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 },
    )
  }
}

// DELETE /api/admin/roles/[id] — delete role (unless isSystem=true)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { id } = await params

    const role = await db.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete a system role' },
        { status: 403 },
      )
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete role "${role.label}" because it has ${role._count.users} assigned user(s). Reassign them first.` },
        { status: 409 },
      )
    }

    await db.role.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_ROLE',
        category: 'role',
        userId: session.user.id,
        details: `Deleted role "${role.label}" (${role.name})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('[DELETE /api/admin/roles/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 },
    )
  }
}
