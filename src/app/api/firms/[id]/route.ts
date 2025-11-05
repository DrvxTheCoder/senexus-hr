import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { firmSchema } from '@/lib/validations/firm';

// GET /api/firms/[id] - Get a single firm
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const firm = await db.firm.findUnique({
      where: { id },
      include: {
        holding: true,
        userFirms: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        departments: true,
        _count: {
          select: {
            employees: true,
            clients: true,
            partners: true
          }
        }
      }
    });

    if (!firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    return NextResponse.json(firm);
  } catch (error) {
    console.error('Error fetching firm:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firm' },
      { status: 500 }
    );
  }
}

// PATCH /api/firms/[id] - Update a firm
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = firmSchema.parse(body);

    // Check if slug is unique (excluding current firm)
    const existingFirm = await db.firm.findFirst({
      where: {
        slug: validatedData.slug,
        NOT: { id }
      }
    });

    if (existingFirm) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const firm = await db.firm.update({
      where: { id },
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
        action: 'UPDATE',
        entity: 'FIRM',
        entityId: firm.id,
        metadata: { name: firm.name, slug: firm.slug }
      }
    });

    return NextResponse.json(firm);
  } catch (error) {
    console.error('Error updating firm:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update firm' },
      { status: 500 }
    );
  }
}

// DELETE /api/firms/[id] - Delete a firm
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const firm = await db.firm.delete({
      where: { id }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'FIRM',
        entityId: firm.id,
        metadata: { name: firm.name, slug: firm.slug }
      }
    });

    return NextResponse.json({ message: 'Firm deleted successfully' });
  } catch (error) {
    console.error('Error deleting firm:', error);
    return NextResponse.json(
      { error: 'Failed to delete firm' },
      { status: 500 }
    );
  }
}
