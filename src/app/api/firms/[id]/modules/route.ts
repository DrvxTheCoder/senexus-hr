import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/firms/[id]/modules - Get firm's installed modules
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: firmId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this firm
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

    const firmModules = await db.firmModule.findMany({
      where: { firmId },
      include: {
        module: true
      },
      orderBy: {
        module: { name: 'asc' }
      }
    });

    return NextResponse.json(firmModules);
  } catch (error) {
    console.error('Error fetching firm modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firm modules' },
      { status: 500 }
    );
  }
}

// POST /api/firms/[id]/modules - Install a module for a firm
const installModuleSchema = z.object({
  moduleId: z.string(),
  isEnabled: z.boolean().default(true),
  settings: z.record(z.any()).optional()
});

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: firmId } = await params;
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
    const data = installModuleSchema.parse(body);

    // Check if module exists
    const module = await db.module.findUnique({
      where: { id: data.moduleId }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check if already installed
    const existing = await db.firmModule.findUnique({
      where: {
        firmId_moduleId: {
          firmId,
          moduleId: data.moduleId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Module already installed for this firm' },
        { status: 409 }
      );
    }

    const firmModule = await db.firmModule.create({
      data: {
        firmId,
        moduleId: data.moduleId,
        isEnabled: data.isEnabled,
        settings: data.settings || {},
        installedBy: session.user.id
      },
      include: {
        module: true
      }
    });

    return NextResponse.json(firmModule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error installing module:', error);
    return NextResponse.json(
      { error: 'Failed to install module' },
      { status: 500 }
    );
  }
}
