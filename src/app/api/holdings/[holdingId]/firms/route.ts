import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/holdings/:holdingId/firms?module=hr - Get firms with specific module
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ holdingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { holdingId } = await params;
    const { searchParams } = new URL(req.url);
    const moduleSlug = searchParams.get('module');

    // Verify user has access to at least one firm in the holding
    const userFirms = await db.userFirm.findMany({
      where: {
        userId: session.user.id,
        firm: {
          holdingId
        }
      }
    });

    if (userFirms.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    const where: any = {
      holdingId
    };

    // If module filter is specified, only return firms with that module installed
    if (moduleSlug) {
      where.firmModules = {
        some: {
          isEnabled: true,
          module: {
            slug: moduleSlug
          }
        }
      };
    }

    // Fetch firms
    const firms = await db.firm.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        firmModules: {
          select: {
            module: {
              select: {
                slug: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(firms);
  } catch (error) {
    console.error('Error fetching firms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firms' },
      { status: 500 }
    );
  }
}
