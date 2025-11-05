import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
    moduleId: string;
  }>;
}

// PATCH /api/firms/[id]/modules/[moduleId] - Enable/disable or update module settings
const updateModuleSchema = z.object({
  isEnabled: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional()
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: firmId, moduleId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin/owner of this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || (userFirm.role !== 'ADMIN' && userFirm.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateModuleSchema.parse(body);

    const firmModule = await db.firmModule.update({
      where: {
        firmId_moduleId: {
          firmId,
          moduleId
        }
      },
      data,
      include: {
        module: true
      }
    });

    return NextResponse.json(firmModule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating firm module:', error);
    return NextResponse.json(
      { error: 'Failed to update firm module' },
      { status: 500 }
    );
  }
}

// DELETE /api/firms/[id]/modules/[moduleId] - Uninstall module
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: firmId, moduleId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin/owner of this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || (userFirm.role !== 'ADMIN' && userFirm.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.firmModule.delete({
      where: {
        firmId_moduleId: {
          firmId,
          moduleId
        }
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error uninstalling module:', error);
    return NextResponse.json(
      { error: 'Failed to uninstall module' },
      { status: 500 }
    );
  }
}
