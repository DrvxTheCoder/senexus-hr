import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/firms/:id/clients - Get all clients for a firm
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Verify user has access to firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      firmId
    };

    if (status) {
      where.status = status;
    }

    // Fetch clients
    const clients = await db.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        photoUrl: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        industry: true,
        tags: true,
        contractStartDate: true,
        contractEndDate: true,
        _count: {
          select: {
            assignedEmployees: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
