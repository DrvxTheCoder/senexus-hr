import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/clients?firmId=xxx - Get all clients for a firm
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const firmId = searchParams.get('firmId');

    if (!firmId) {
      return NextResponse.json(
        { error: 'firmId is required' },
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
      }
    });

    if (!userFirm) {
      return NextResponse.json(
        { error: 'Access denied to this firm' },
        { status: 403 }
      );
    }

    const clients = await db.client.findMany({
      where: {
        firmId,
        status: { not: 'ARCHIVED' }
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedEmployees: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
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
