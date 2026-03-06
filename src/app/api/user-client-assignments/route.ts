import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';

// GET /api/user-client-assignments?userId=xxx&firmId=xxx
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const firmId = searchParams.get('firmId');

    if (!userId || !firmId) {
      return NextResponse.json(
        { error: 'userId et firmId sont requis' },
        { status: 400 }
      );
    }

    const assignments = await db.userClientAssignment.findMany({
      where: { userId, firmId },
      include: {
        client: {
          select: { id: true, name: true, status: true, photoUrl: true }
        }
      },
      orderBy: { client: { name: 'asc' } }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching user-client assignments:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/user-client-assignments
// Body: { userId, clientId, firmId }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, clientId, firmId } = body;

    if (!userId || !clientId || !firmId) {
      return NextResponse.json(
        { error: 'userId, clientId et firmId sont requis' },
        { status: 400 }
      );
    }

    // Verify the requester has OWNER/ADMIN/MANAGER role in this firm
    const requesterFirm = await db.userFirm.findUnique({
      where: { userId_firmId: { userId: session.user.id, firmId } }
    });

    if (
      !requesterFirm ||
      !['OWNER', 'ADMIN', 'MANAGER'].includes(requesterFirm.role)
    ) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const assignment = await db.userClientAssignment.upsert({
      where: { userId_clientId_firmId: { userId, clientId, firmId } },
      create: { userId, clientId, firmId },
      update: {},
      include: {
        client: {
          select: { id: true, name: true, status: true, photoUrl: true }
        }
      }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating user-client assignment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/user-client-assignments
// Body: { userId, clientId, firmId }
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, clientId, firmId } = body;

    if (!userId || !clientId || !firmId) {
      return NextResponse.json(
        { error: 'userId, clientId et firmId sont requis' },
        { status: 400 }
      );
    }

    // Verify the requester has OWNER/ADMIN/MANAGER role in this firm
    const requesterFirm = await db.userFirm.findUnique({
      where: { userId_firmId: { userId: session.user.id, firmId } }
    });

    if (
      !requesterFirm ||
      !['OWNER', 'ADMIN', 'MANAGER'].includes(requesterFirm.role)
    ) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    await db.userClientAssignment.delete({
      where: { userId_clientId_firmId: { userId, clientId, firmId } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user-client assignment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
