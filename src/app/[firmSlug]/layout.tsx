import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import AppShell from '@/components/layout/app-shell';

export default async function FirmDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ firmSlug: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign-in');
  }

  const { firmSlug } = await params;

  // Find the firm by slug
  const firm = await db.firm.findUnique({
    where: { slug: firmSlug }
  });

  if (!firm) {
    notFound();
  }

  // Check if user has access to this firm
  const userFirm = await db.userFirm.findUnique({
    where: {
      userId_firmId: {
        userId: session.user.id,
        firmId: firm.id
      }
    }
  });

  if (!userFirm) {
    redirect('/select-firm');
  }

  return (
    <AppShell
      firmSlug={firmSlug}
      firm={{
        id: firm.id,
        name: firm.name,
        logo: firm.logo,
        themeColor: firm.themeColor
      }}
    >
      {children}
    </AppShell>
  );
}
