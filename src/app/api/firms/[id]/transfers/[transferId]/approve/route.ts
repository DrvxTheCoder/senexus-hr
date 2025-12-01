import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// POST /api/firms/:id/transfers/:id/approve - Approve transfer request
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

    // Parse body if provided (optional contract creation data)
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // No body or invalid JSON - that's okay, body is optional
    }

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
            'Only owners, admins, and managers of the destination firm can approve transfers'
        },
        { status: 403 }
      );
    }

    // Verify transfer exists and is for this firm as destination
    const existingTransfer = await db.employeeTransfer.findFirst({
      where: {
        id,
        toFirmId: firmId
      },
      include: {
        employee: true,
        fromFirm: true,
        toFirm: true
      }
    });

    if (!existingTransfer) {
      return NextResponse.json(
        {
          error:
            'Transfer not found or you do not have permission to approve it'
        },
        { status: 404 }
      );
    }

    // Can only approve PENDING transfers
    if (existingTransfer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only approve pending transfers' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Approve the transfer
      const transfer = await tx.employeeTransfer.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: session.user.id,
          approvedAt: new Date()
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

      // If createNewContract option is set, create a new contract in destination firm
      if (body.createNewContract && body.contractData) {
        const contractData = body.contractData;

        await tx.contract.create({
          data: {
            firmId: transfer.toFirmId,
            employeeId: transfer.employeeId,
            clientId: transfer.clientId || null,
            type: contractData.type || 'CDD',
            status: 'ACTIVE',
            startDate: new Date(contractData.startDate),
            endDate: contractData.endDate
              ? new Date(contractData.endDate)
              : null,
            position: contractData.position || null,
            salary: contractData.salary || null,
            workingHours: contractData.workingHours || null,
            notes: `Contract created from transfer ${transfer.id}`
          }
        });
      }

      return transfer;
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'APPROVE',
        entity: 'EMPLOYEE_TRANSFER',
        entityId: result.id,
        metadata: {
          employeeId: result.employeeId,
          fromFirmId: result.fromFirmId,
          toFirmId: result.toFirmId
        }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error approving transfer:', error);
    return NextResponse.json(
      { error: 'Failed to approve transfer' },
      { status: 500 }
    );
  }
}
