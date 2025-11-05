import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET /api/modules - List all available modules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = await db.module.findMany({
      orderBy: { name: 'asc' },
      include: {
        firmModules: {
          select: {
            firmId: true,
            isEnabled: true
          }
        },
        _count: {
          select: {
            firmModules: true
          }
        }
      }
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

// POST /api/modules - Register a new module (admin only)
const createModuleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  icon: z.string().optional(),
  basePath: z.string().min(1),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/owner
    const userFirms = await db.userFirm.findMany({
      where: { userId: session.user.id }
    });

    const isAdmin = userFirms.some(
      (uf) => uf.role === 'ADMIN' || uf.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createModuleSchema.parse(body);

    // Check if module already exists
    const existing = await db.module.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Module with this slug already exists' },
        { status: 409 }
      );
    }

    const moduleRecord = await db.module.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        version: data.version,
        icon: data.icon,
        basePath: data.basePath,
        isSystem: data.isSystem,
        isActive: data.isActive,
        metadata: data.metadata || {}
      }
    });

    return NextResponse.json(moduleRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
