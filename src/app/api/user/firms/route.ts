import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/user/firms - Get user's accessible firms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userFirms = await db.userFirm.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        firm: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            themeColor: true
          }
        }
      }
    });

    const firms = userFirms.map((uf) => ({
      id: uf.firm.id,
      name: uf.firm.name,
      slug: uf.firm.slug,
      logo: uf.firm.logo,
      themeColor: uf.firm.themeColor,
      role: uf.role
    }));

    return NextResponse.json(firms);
  } catch (error) {
    console.error('Error fetching user firms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firms' },
      { status: 500 }
    );
  }
}
