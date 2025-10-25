import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { userSchema } from '@/lib/validations/user';
import * as bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get a single user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        userFirms: {
          include: {
            firm: {
              select: {
                id: true,
                name: true,
                slug: true,
                themeColor: true
              }
            }
          }
        },
        employees: {
          include: {
            firm: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = userSchema.parse(body);

    // Check if email is unique (excluding current user)
    if (validatedData.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: params.id }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update user with firm assignments in a transaction
    const user = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: params.id },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          image: validatedData.image || null
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

      // Update UserFirm relationships
      if (validatedData.firmIds) {
        // Delete existing firm assignments
        await tx.userFirm.deleteMany({
          where: { userId: params.id }
        });

        // Create new firm assignments
        if (validatedData.firmIds.length > 0) {
          await tx.userFirm.createMany({
            data: validatedData.firmIds.map((firmId) => ({
              userId: params.id,
              firmId,
              role: validatedData.role
            }))
          });
        }
      }

      // Update employee link if provided
      if (validatedData.employeeId !== undefined) {
        // Remove previous employee link
        await tx.employee.updateMany({
          where: { userId: params.id },
          data: { userId: null }
        });

        // Add new employee link if not null
        if (validatedData.employeeId) {
          await tx.employee.update({
            where: { id: validatedData.employeeId },
            data: { userId: params.id }
          });
        }
      }

      return updatedUser;
    });

    // Log the action
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'UPDATE',
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await db.user.delete({
      where: { id: params.id }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'USER',
        entityId: user.id,
        metadata: { name: user.name, email: user.email }
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
