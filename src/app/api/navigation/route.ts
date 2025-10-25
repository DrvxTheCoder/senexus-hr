import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { getNavigationForFirm } from '@/lib/navigation-helpers';
import { getNavItems } from '@/constants/data';

/**
 * GET /api/navigation?firmId=xxx
 * Get dynamic navigation for a specific firm
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get firmId from query params
    const { searchParams } = new URL(request.url);
    const firmId = searchParams.get('firmId');

    if (!firmId) {
      return NextResponse.json(
        { error: 'firmId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      },
      include: {
        firm: {
          select: {
            slug: true
          }
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get dynamic navigation
    const navigation = await getNavigationForFirm(
      firmId,
      userFirm.firm.slug,
      userFirm.role
    );

    return NextResponse.json({
      navigation,
      firmSlug: userFirm.firm.slug,
      userRole: userFirm.role
    });
  } catch (error) {
    console.error('Error fetching navigation:', error);

    // Graceful fallback: return static navigation
    try {
      const { searchParams } = new URL(request.url);
      const firmId = searchParams.get('firmId');

      if (firmId) {
        const firm = await db.firm.findUnique({
          where: { id: firmId },
          select: { slug: true }
        });

        if (firm) {
          return NextResponse.json({
            navigation: getNavItems(firm.slug),
            firmSlug: firm.slug,
            fallback: true
          });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch navigation',
        navigation: getNavItems('[firmSlug]'), // Ultimate fallback
        fallback: true
      },
      { status: 500 }
    );
  }
}
