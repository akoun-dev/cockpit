import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/notifications — list all configs
export async function GET() {
  try {
    const configs = await db.notificationConfig.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: configs })
  } catch (error) {
    console.error('[GET /api/admin/notifications]', error)
    return NextResponse.json(
      { error: 'Échec du chargement des configurations' },
      { status: 500 },
    )
  }
}

// PUT /api/admin/notifications/:id — update config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('[PUT /api/admin/notifications/:id]', error)
    return NextResponse.json(
      { error: 'Échec de la mise à jour de la configuration' },
      { status: 500 },
    )
  }
}