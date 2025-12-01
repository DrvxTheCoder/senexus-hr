import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// POST /api/firms/:id/transfers/:id/reject - Reject transfer request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, transferId } = await params;
    const id = transferId;
    const body = await req.json();

    // Verify user has access to destination firm and proper role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['OWNER', 'ADMIN', 'MANAGER'].includes(userFirm.role)) {
      return NextResponse.json(
        {
          error:
            'Only owners, admins, and managers of the destination firm can reject transfers'
        },
        { status: 403 }
      );
    }

    // Verify transfer exists and is for this firm as destination
    const existingTransfer = await db.employeeTransfer.findFirst({
      where: {
        id,
        toFirmId: firmId
      }
    });

    if (!existingTransfer) {
      return NextResponse.json(
        {
          error: 'Transfer not found or you do not have permission to reject it'
        },
        { status: 404 }
      );
    }

    // Can only reject PENDING transfers
    if (existingTransfer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only reject pending transfers' },
        { status: 400 }
      );
    }

    // Require rejection reason
    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Reject the transfer
    const transfer = await db.employeeTransfer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: body.reason
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true
          }
        },
        fromFirm: {
          select: {
            id: true,
            name: true
          }
        },
        toFirm: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'REJECT',
        entity: 'EMPLOYEE_TRANSFER',
        entityId: transfer.id,
        metadata: {
          employeeId: transfer.employeeId,
          fromFirmId: transfer.fromFirmId,
          toFirmId: transfer.toFirmId,
          rejectionReason: body.reason
        }
      }
    });

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    return NextResponse.json(
      { error: 'Failed to reject transfer' },
      { status: 500 }
    );
  }
}
