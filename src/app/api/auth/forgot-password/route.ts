import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Ne pas révéler si l'email existe ou pas (sécurité)
    if (!user) {
      return NextResponse.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 heure

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires },
    });

    // En environnement de dev, retourner le token directement
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        category: 'auth',
        details: `Demande de réinitialisation de mot de passe pour ${email}`,
      },
    });

    return NextResponse.json({
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      ...(process.env.NODE_ENV === 'development' ? { resetUrl, token } : {}),
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
