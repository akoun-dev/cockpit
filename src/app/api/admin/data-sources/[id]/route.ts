import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/data-sources/:id — single data source
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const source = await db.dataSource.findUnique({ where: { id } })
    if (!source) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }
    return NextResponse.json({ data: source })
  } catch (error) {
    console.error('[GET /api/admin/data-sources/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch data source' }, { status: 500 })
  }
}

// PUT /api/admin/data-sources/:id — update a data source
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.dataSource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    const { module: mod, name, type, host, port, endpoint, database, username, password, description, status, refreshFreq } = body

    const updated = await db.dataSource.update({
      where: { id },
      data: {
        ...(mod !== undefined ? { module: mod } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(host !== undefined ? { host } : {}),
        ...(port !== undefined ? { port } : {}),
        ...(endpoint !== undefined ? { endpoint } : {}),
        ...(database !== undefined ? { database } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(password !== undefined ? { password } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(refreshFreq !== undefined ? { refreshFreq } : {}),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_DATASOURCE',
        category: 'data',
        details: `Updated data source "${updated.name}" (${updated.module})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PUT /api/admin/data-sources/:id]', error)
    return NextResponse.json({ error: 'Failed to update data source' }, { status: 500 })
  }
}

// DELETE /api/admin/data-sources/:id — delete a data source
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const existing = await db.dataSource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    await db.dataSource.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_DATASOURCE',
        category: 'data',
        details: `Deleted data source "${existing.name}" (${existing.module})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/data-sources/:id]', error)
    return NextResponse.json({ error: 'Failed to delete data source' }, { status: 500 })
  }
}
