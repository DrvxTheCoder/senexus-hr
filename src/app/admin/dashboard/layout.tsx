import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import AppShell from '@/components/layout/app-shell';

export default async function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign-in');
  }

  // Check if user is admin or owner
  const userFirms = await db.userFirm.findMany({
    where: {
      userId: session.user.id,
      role: {
        in: ['ADMIN', 'OWNER']
      }
    }
  });

  if (userFirms.length === 0) {
    redirect('/select-firm');
  }

  return <AppShell>{children}</AppShell>;
}
