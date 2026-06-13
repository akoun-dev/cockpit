import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PUT /api/admin/notifications/:id — update config
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

    const existing = await db.notificationConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Configuration introuvable' },
        { status: 404 },
      )
    }

    const { enabled, channel, recipients, smtpHost, smtpPort, smtpEncryption, smtpUser, smtpPassword } = body

    const updateData: Record<string, unknown> = {}
    if (enabled !== undefined) updateData.enabled = enabled
    if (channel !== undefined) updateData.channel = channel
    if (recipients !== undefined) updateData.recipients = typeof recipients === 'string' ? recipients : JSON.stringify(recipients)
    if (smtpHost !== undefined) updateData.smtpHost = smtpHost
    if (smtpPort !== undefined) updateData.smtpPort = smtpPort
    if (smtpEncryption !== undefined) updateData.smtpEncryption = smtpEncryption
    if (smtpUser !== undefined) updateData.smtpUser = smtpUser
    if (smtpPassword !== undefined) updateData.smtpPassword = smtpPassword

    const config = await db.notificationConfig.update({
      where: { id },
      data: updateData,
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_NOTIFICATION_CONFIG',
        category: 'notification',
        details: `Mise à jour configuration notification "${config.channel}" (${config.enabled ? 'activé' : 'désactivé'})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('[PUT /api/admin/notifications/:id]', error)
    return NextResponse.json(
      { error: 'Échec de la mise à jour de la configuration' },
      { status: 500 },
    )
  }
}
