import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { userWithPasswordSchema } from '@/lib/validations/user';
import * as bcrypt from 'bcryptjs';

// GET /api/users - List all users
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        userFirms: {
          select: {
            firmId: true,
            role: true,
            firm: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = userWithPasswordSchema.parse(body);

    // Check if email is unique
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user with firm assignments in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          image: validatedData.image || null,
          passwordHash,
          emailVerified: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Create UserFirm relationships
      if (validatedData.firmIds && validatedData.firmIds.length > 0) {
        await tx.userFirm.createMany({
          data: validatedData.firmIds.map((firmId) => ({
            userId: newUser.id,
            firmId,
            role: validatedData.role
          }))
        });
      }

      // Link to employee if provided
      if (validatedData.employeeId) {
        await tx.employee.update({
          where: { id: validatedData.employeeId },
          data: { userId: newUser.id }
        });
      }

      return newUser;
    });

    // Log the action
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        metadata: {
          name: user.name,
          email: user.email,
          role: validatedData.role,
          firmIds: validatedData.firmIds
        }
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
