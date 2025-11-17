import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/firms/:id/transfers - List all transfers for a firm
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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const direction = searchParams.get('direction'); // 'in' or 'out'

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
    const where: Prisma.EmployeeTransferWhereInput = {};

    if (direction === 'out') {
      where.fromFirmId = firmId;
    } else if (direction === 'in') {
      where.toFirmId = firmId;
    } else {
      // Default: show both incoming and outgoing
      where.OR = [{ fromFirmId: firmId }, { toFirmId: firmId }];
    }

    if (status) {
      where.status = status as any;
    }

    // Fetch transfers with pagination
    const [transfers, total] = await Promise.all([
      db.employeeTransfer.findMany({
        where,
        select: {
          id: true,
          transferDate: true,
          effectiveDate: true,
          reason: true,
          status: true,
          notes: true,
          rejectionReason: true,
          approvedAt: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,
              photoUrl: true
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
              name: true
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.employeeTransfer.count({ where })
    ]);

    return NextResponse.json({
      transfers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}

// POST /api/firms/:id/transfers - Create a new transfer request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId } = await params;
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

    // Validation
    if (
      !body.employeeId ||
      !body.fromFirmId ||
      !body.toFirmId ||
      !body.transferDate ||
      !body.effectiveDate ||
      !body.reason
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employeeId, fromFirmId, toFirmId, transferDate, effectiveDate, reason'
        },
        { status: 400 }
      );
    }

    // Verify employee exists and belongs to from firm
    const employee = await db.employee.findFirst({
      where: {
        id: body.employeeId,
        firmId: body.fromFirmId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or does not belong to the source firm' },
        { status: 404 }
      );
    }

    // Verify both firms exist and belong to same holding
    const [fromFirm, toFirm] = await Promise.all([
      db.firm.findUnique({ where: { id: body.fromFirmId } }),
      db.firm.findUnique({ where: { id: body.toFirmId } })
    ]);

    if (!fromFirm || !toFirm) {
      return NextResponse.json(
        { error: 'Source or destination firm not found' },
        { status: 404 }
      );
    }

    if (fromFirm.holdingId !== toFirm.holdingId) {
      return NextResponse.json(
        { error: 'Transfers can only occur between firms in the same holding' },
        { status: 400 }
      );
    }

    // Check for existing pending transfers
    const existingTransfer = await db.employeeTransfer.findFirst({
      where: {
        employeeId: body.employeeId,
        status: 'PENDING'
      }
    });

    if (existingTransfer) {
      return NextResponse.json(
        { error: 'Employee already has a pending transfer request' },
        { status: 400 }
      );
    }

    // Create transfer
    const transfer = await db.employeeTransfer.create({
      data: {
        employeeId: body.employeeId,
        fromFirmId: body.fromFirmId,
        toFirmId: body.toFirmId,
        clientId: body.clientId || null,
        transferDate: new Date(body.transferDate),
        effectiveDate: new Date(body.effectiveDate),
        reason: body.reason,
        status: 'PENDING',
        requestedBy: session.user.id,
        notes: body.notes || null
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

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'EMPLOYEE_TRANSFER',
        entityId: transfer.id,
        metadata: {
          employeeId: body.employeeId,
          fromFirmId: body.fromFirmId,
          toFirmId: body.toFirmId,
          reason: body.reason
        }
      }
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    );
  }
}
