import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/require-auth'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/admin/users/[id] — single user with role, department, permissions
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      include: {
        role: {
          include: { permissions: true },
        },
        department: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('[GET /api/admin/users/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 },
    )
  }
}

// PUT /api/admin/users/[id] — update user fields
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin()
    if (session instanceof Response) return session
    const { id } = await params
    const body = await request.json()
    const { name, email, isActive, roleId, departmentId, resetPassword } = body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Handle password reset with crypto-generated password
    if (resetPassword) {
      const temporaryPassword = randomBytes(4).toString('hex') // 8 chars hex
      const hashedPassword = await hash(temporaryPassword, 12)
      await db.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
        },
      })
      await db.auditLog.create({
        data: {
          action: 'RESET_PASSWORD',
          category: 'user',
          userId: session.user.id,
          details: `Mot de passe réinitialisé pour "${existing.name}"`,
          ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
        },
      })
      return NextResponse.json({ temporaryPassword })
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
        ...(roleId !== undefined && { roleId: roleId ?? null }),
        ...(departmentId !== undefined && { departmentId: departmentId ?? null }),
      },
      include: { role: true, department: true },
    })

    // Audit log
    const changes: string[] = []
    if (name !== undefined && name !== existing.name) changes.push(`name: "${existing.name}" → "${name}"`)
    if (email !== undefined && email !== existing.email) changes.push(`email: "${existing.email}" → "${email}"`)
    if (isActive !== undefined && isActive !== existing.isActive) changes.push(`isActive: ${existing.isActive} → ${isActive}`)

    await db.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        category: 'user',
        userId: session.user.id,
        details: `Updated user "${existing.name}" (target: ${id}) — ${changes.join(', ') || 'no field changes'}`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    console.error('[PUT /api/admin/users/[id]]', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    )
  }
}

// DELETE /api/admin/users/[id] — delete user (unless isSystem role)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdmin()
    if (session instanceof Response) return session
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      include: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role?.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete a user with a system role' },
        { status: 403 },
      )
    }

    await db.user.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_USER',
        category: 'user',
        userId: session.user.id,
        details: `Deleted user "${user.name}" (${user.email})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('[DELETE /api/admin/users/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    )
  }
}
