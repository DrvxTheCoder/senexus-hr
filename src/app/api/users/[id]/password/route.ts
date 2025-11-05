import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { passwordChangeSchema } from '@/lib/validations/user';
import * as bcrypt from 'bcryptjs';

// PATCH /api/users/[id]/password - Change user password
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
    const validatedData = passwordChangeSchema.parse(body);

    // Hash new password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    const user = await db.user.update({
      where: { id },
      data: { passwordHash },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        metadata: {
          action: 'password_change',
          name: user.name,
          email: user.email
        }
      }
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
