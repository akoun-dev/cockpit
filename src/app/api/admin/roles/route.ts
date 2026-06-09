import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/roles — list all roles with user count and permissions
export async function GET() {
  try {
    const roles = await db.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { level: 'desc' },
    })

    return NextResponse.json({ data: roles })
  } catch (error) {
    console.error('[GET /api/admin/roles]', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 },
    )
  }
}

// POST /api/admin/roles — create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, label, description, level, color } = body

    if (!name || !label) {
      return NextResponse.json(
        { error: 'name and label are required' },
        { status: 400 },
      )
    }

    const role = await db.role.create({
      data: {
        name,
        label,
        description: description ?? null,
        level: level ?? 0,
        color: color ?? '#1c55a3',
      },
      include: { permissions: true },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_ROLE',
        category: 'role',
        details: `Created role "${role.label}" (${role.name})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: role }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/admin/roles]', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 },
    )
  }
}
