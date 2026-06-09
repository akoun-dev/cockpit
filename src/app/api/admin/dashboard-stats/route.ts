import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/dashboard-stats — aggregated stats for admin dashboard
export async function GET() {
  try {
    const [totalUsers, activeUsers, totalRoles, configuredModules, auditLogCount] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { status: 'active' } }),
        db.role.count(),
        db.permission.groupBy({ by: ['module'] }).then((m) => m.length),
        db.auditLog.count(),
      ])

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalRoles,
      configuredModules,
      auditLogCount,
    })
  } catch (error) {
    console.error('[GET /api/admin/dashboard-stats]', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 },
    )
  }
}
