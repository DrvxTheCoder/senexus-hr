import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/firms/:id/contracts - List all contracts (paginated)
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
    const type = searchParams.get('type');
    const employeeId = searchParams.get('employeeId');
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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
    const where: Prisma.ContractWhereInput = {
      firmId
    };

    if (status) {
      where.status = status as any;
    }

    if (type) {
      where.type = type as any;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Fetch contracts with pagination
    const [contracts, total] = await Promise.all([
      db.contract.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          position: true,
          salary: true,
          isActive: true,
          renewedFromId: true,
          employeeId: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricule: true,
              photoUrl: true
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
          },
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.contract.count({ where })
    ]);

    // Convert Decimal fields to strings for JSON serialization
    const serializedContracts = contracts.map((contract) => ({
      ...contract,
      salary: contract.salary?.toString() || null
    }));

    return NextResponse.json({
      contracts: serializedContracts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST /api/firms/:id/contracts - Create a new contract
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
    if (!body.employeeId || !body.type || !body.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, type, startDate' },
        { status: 400 }
      );
    }

    // Check if employee belongs to firm
    const employee = await db.employee.findFirst({
      where: {
        id: body.employeeId,
        firmId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or does not belong to this firm' },
        { status: 404 }
      );
    }

    // Check for overlapping active contracts
    const overlappingContract = await db.contract.findFirst({
      where: {
        employeeId: body.employeeId,
        status: 'ACTIVE',
        id: { not: body.id } // Exclude current contract if updating
      }
    });

    if (overlappingContract) {
      return NextResponse.json(
        { error: 'Employee already has an active contract' },
        { status: 400 }
      );
    }

    // Create contract
    const contract = await db.contract.create({
      data: {
        firmId,
        employeeId: body.employeeId,
        clientId: body.clientId || null,
        clientFirmId: body.clientFirmId || null,
        type: body.type,
        status: 'ACTIVE',
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        position: body.position,
        salary: body.salary,
        workingHours: body.workingHours,
        trialPeriodEnd: body.trialPeriodEnd
          ? new Date(body.trialPeriodEnd)
          : null,
        notes: body.notes,
        alertThreshold: body.alertThreshold || 30
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
        action: 'CREATE',
        entity: 'CONTRACT',
        entityId: contract.id,
        metadata: {
          employeeId: body.employeeId,
          type: contract.type,
          startDate: contract.startDate
        }
      }
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
