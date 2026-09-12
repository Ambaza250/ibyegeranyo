import { NextRequest, NextResponse } from 'next/server';
import { getDb, collections } from '@/lib/firebase';
import { sendWhatsAppText } from '@/lib/whatsapp';

// Protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-here';

export async function GET(request: NextRequest) {
  // Simple security so random people can't trigger it
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = new Date();
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);

    // Start and end of the 3-days-from-now day
    const startOfDay = new Date(in3Days);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(in3Days);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection(collections.users)
      .where('subscriptionStatus', '==', 'active')
      .where('expiresAt', '>=', startOfDay.toISOString())
      .where('expiresAt', '<=', endOfDay.toISOString())
      .get();

    let sent = 0;

    for (const doc of snapshot.docs) {
      const user = doc.data();
      const expiresAt = new Date(user.expiresAt).toLocaleDateString('rw-RW');

      const message =
        `Muraho ${user.fullName || ''}! ⏰\n\n` +
        `Uburyo bwawe bwo kureba ibyegeranyo buzarangira mu minsi 3 (` +
        `${expiresAt}).\n\n` +
        `Komeza uburyo bwawe hano:\n` +
        `https://ibyegeranyo.vercel.app/pricing\n\n` +
        `Murakoze gukomeza! 🎬`;

      try {
        await sendWhatsAppText({
          to: user.phone,
          body: message,
        });
        sent++;
      } catch (err) {
        console.error(`Failed to remind user ${user.phone}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      reminded: sent,
      totalFound: snapshot.size,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
