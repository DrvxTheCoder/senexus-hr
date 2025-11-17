import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/firms/:id/contracts/:id - Get single contract
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, contractId } = await params;
    const id = contractId;

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

    // Fetch contract
    const contract = await db.contract.findFirst({
      where: {
        id,
        firmId
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
        client: {
          select: {
            id: true,
            name: true,
            contactName: true,
            contactEmail: true
          }
        },
        clientFirm: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        renewedFrom: {
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        renewals: {
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Convert Decimal fields to strings for JSON serialization
    const serialized = {
      ...contract,
      salary: contract.salary?.toString() || null
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// PUT /api/firms/:id/contracts/:id - Update contract
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, contractId } = await params;
    const id = contractId;
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

    // Verify contract exists and belongs to firm
    const existingContract = await db.contract.findFirst({
      where: {
        id,
        firmId
      }
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Update contract
    const contract = await db.contract.update({
      where: { id },
      data: {
        clientId: body.clientId !== undefined ? body.clientId : undefined,
        clientFirmId:
          body.clientFirmId !== undefined ? body.clientFirmId : undefined,
        type: body.type,
        endDate: body.endDate ? new Date(body.endDate) : null,
        position: body.position,
        salary: body.salary,
        workingHours: body.workingHours,
        trialPeriodEnd: body.trialPeriodEnd
          ? new Date(body.trialPeriodEnd)
          : null,
        notes: body.notes,
        alertThreshold: body.alertThreshold
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
        client: {
          select: {
            id: true,
            name: true
          }
        },
        clientFirm: {
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
        entity: 'CONTRACT',
        entityId: contract.id,
        metadata: {
          changes: body
        }
      }
    });

    // Convert Decimal fields to strings for JSON serialization
    const serialized = {
      ...contract,
      salary: contract.salary?.toString() || null
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

// DELETE /api/firms/:id/contracts/:id - Delete contract
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, contractId } = await params;
    const id = contractId;

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

    // Verify contract exists and belongs to firm
    const existingContract = await db.contract.findFirst({
      where: {
        id,
        firmId
      }
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Delete contract
    await db.contract.delete({
      where: { id }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'CONTRACT',
        entityId: id,
        metadata: {
          deletedContract: existingContract
        }
      }
    });

    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
