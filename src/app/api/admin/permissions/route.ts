import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/admin/permissions — update permissions for a role
// Body: { roleId, permissions: [{ module, access }] }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { roleId, permissions } = body

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'roleId and permissions array are required' },
        { status: 400 },
      )
    }

    const validAccess = ['none', 'read', 'write', 'admin']
    for (const p of permissions) {
      if (!p.module || typeof p.module !== 'string') {
        return NextResponse.json(
          { error: 'Each permission must have a valid module string' },
          { status: 400 },
        )
      }
      if (!p.access || !validAccess.includes(p.access)) {
        return NextResponse.json(
          { error: `Invalid access "${p.access}". Must be one of: ${validAccess.join(', ')}` },
          { status: 400 },
        )
      }
    }

    // Verify role exists
    const role = await db.role.findUnique({ where: { id: roleId } })
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Upsert each permission
    const results = await db.$transaction(
      permissions.map((p: { module: string; access: string }) =>
        db.permission.upsert({
          where: {
            roleId_module: {
              roleId,
              module: p.module,
            },
          },
          update: { access: p.access },
          create: {
            roleId,
            module: p.module,
            access: p.access,
          },
        }),
      ),
    )

    // Audit log
    const moduleList = permissions.map((p: { module: string; access: string }) => `${p.module}=${p.access}`).join(', ')
    await db.auditLog.create({
      data: {
        action: 'UPDATE_PERMISSION',
        category: 'permission',
        details: `Updated permissions for role "${role.label}" (${role.name}): ${moduleList}`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('[PUT /api/admin/permissions]', error)
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 },
    )
  }
}
