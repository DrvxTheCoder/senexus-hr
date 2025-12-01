import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// POST /api/firms/:id/transfers/:id/complete - Complete the transfer (move employee)
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
      return NextResponse.json(
        {
          error: 'Only owners, admins, and managers can complete transfers'
        },
        { status: 403 }
      );
    }

    // Verify transfer exists and is approved
    const existingTransfer = await db.employeeTransfer.findFirst({
      where: {
        id,
        OR: [{ fromFirmId: firmId }, { toFirmId: firmId }]
      },
      include: {
        employee: true
      }
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Can only complete APPROVED transfers
    if (existingTransfer.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only complete approved transfers' },
        { status: 400 }
      );
    }

    // Check if effective date has been reached
    if (new Date(existingTransfer.effectiveDate) > new Date()) {
      return NextResponse.json(
        { error: 'Cannot complete transfer before effective date' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Terminate all active contracts in source firm
      await tx.contract.updateMany({
        where: {
          employeeId: existingTransfer.employeeId,
          firmId: existingTransfer.fromFirmId,
          status: 'ACTIVE'
        },
        data: {
          status: 'TERMINATED',
          isActive: false,
          terminationDate: new Date(),
          terminationReason: `Employee transferred to another firm (Transfer #${id})`
        }
      });

      // Update employee's firm
      await tx.employee.update({
        where: { id: existingTransfer.employeeId },
        data: {
          firmId: existingTransfer.toFirmId,
          assignedClientId: existingTransfer.clientId
        }
      });

      // Mark transfer as completed
      const transfer = await tx.employeeTransfer.update({
        where: { id },
        data: {
          status: 'COMPLETED'
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
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return transfer;
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'COMPLETE',
        entity: 'EMPLOYEE_TRANSFER',
        entityId: result.id,
        metadata: {
          employeeId: result.employeeId,
          fromFirmId: result.fromFirmId,
          toFirmId: result.toFirmId,
          completedAt: new Date()
        }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error completing transfer:', error);
    return NextResponse.json(
      { error: 'Failed to complete transfer' },
      { status: 500 }
    );
  }
}
