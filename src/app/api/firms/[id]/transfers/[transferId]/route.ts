import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/firms/:id/transfers/:id - Get single transfer
export async function GET(
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

    // Fetch transfer
    const transfer = await db.employeeTransfer.findFirst({
      where: {
        id,
        OR: [{ fromFirmId: firmId }, { toFirmId: firmId }]
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            photoUrl: true,
            email: true,
            phone: true
          }
        },
        fromFirm: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        toFirm: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            contactName: true,
            contactEmail: true
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer' },
      { status: 500 }
    );
  }
}

// PUT /api/firms/:id/transfers/:id - Update transfer
export async function PUT(
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

    // Verify user has access and proper role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['OWNER', 'ADMIN', 'MANAGER'].includes(userFirm.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify transfer exists and user's firm is the source
    const existingTransfer = await db.employeeTransfer.findFirst({
      where: {
        id,
        fromFirmId: firmId
      }
    });

    if (!existingTransfer) {
      return NextResponse.json(
        {
          error: 'Transfer not found or you do not have permission to update it'
        },
        { status: 404 }
      );
    }

    // Can only update PENDING transfers
    if (existingTransfer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only update pending transfers' },
        { status: 400 }
      );
    }

    // Update transfer
    const transfer = await db.employeeTransfer.update({
      where: { id },
      data: {
        transferDate: body.transferDate
          ? new Date(body.transferDate)
          : undefined,
        effectiveDate: body.effectiveDate
          ? new Date(body.effectiveDate)
          : undefined,
        reason: body.reason,
        notes: body.notes,
        clientId: body.clientId !== undefined ? body.clientId : undefined
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
        action: 'UPDATE',
        entity: 'EMPLOYEE_TRANSFER',
        entityId: transfer.id,
        metadata: {
          changes: body
        }
      }
    });

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Error updating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to update transfer' },
      { status: 500 }
    );
  }
}

// DELETE /api/firms/:id/transfers/:id - Cancel transfer
export async function DELETE(
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

    // Verify user has access and proper role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['OWNER', 'ADMIN'].includes(userFirm.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify transfer exists
    const existingTransfer = await db.employeeTransfer.findFirst({
      where: {
        id,
        fromFirmId: firmId
      }
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Can only cancel PENDING or REJECTED transfers
    if (!['PENDING', 'REJECTED'].includes(existingTransfer.status)) {
      return NextResponse.json(
        { error: 'Can only cancel pending or rejected transfers' },
        { status: 400 }
      );
    }

    // Update status to CANCELLED instead of deleting
    await db.employeeTransfer.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CANCEL',
        entity: 'EMPLOYEE_TRANSFER',
        entityId: id,
        metadata: {
          previousStatus: existingTransfer.status
        }
      }
    });

    return NextResponse.json({ message: 'Transfer cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling transfer:', error);
    return NextResponse.json(
      { error: 'Failed to cancel transfer' },
      { status: 500 }
    );
  }
}
