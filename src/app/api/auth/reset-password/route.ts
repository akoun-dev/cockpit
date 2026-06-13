import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe invalide (min. 8 caractères)' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        mustChangePassword: false,
        failedAttempts: 0,
        isLocked: false,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETE',
        category: 'auth',
        details: 'Réinitialisation de mot de passe effectuée',
      },
    });

    return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
