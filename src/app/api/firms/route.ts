import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { firmSchema } from '@/lib/validations/firm';

// GET /api/firms - List all firms
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const holdingId = searchParams.get('holdingId');
    const slug = searchParams.get('slug');

    const firms = await db.firm.findMany({
      where: holdingId ? { holdingId } : slug ? { slug } : undefined,
      include: {
        holding: {
          select: {
            id: true,
            name: true
          }
        },
        userFirms: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            employees: true,
            departments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(firms);
  } catch (error) {
    console.error('Error fetching firms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firms' },
      { status: 500 }
    );
  }
}

// POST /api/firms - Create a new firm
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = firmSchema.parse(body);

    // Check if slug is unique
    const existingFirm = await db.firm.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existingFirm) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const firm = await db.firm.create({
      data: validatedData,
      include: {
        holding: true,
        userFirms: true
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId: firm.id,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'FIRM',
        entityId: firm.id,
        metadata: { name: firm.name, slug: firm.slug }
      }
    });

    return NextResponse.json(firm, { status: 201 });
  } catch (error) {
    console.error('Error creating firm:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create firm' },
      { status: 500 }
    );
  }
}
