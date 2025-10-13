import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { FirmSelectionClient } from '@/components/firm-selection-client';

export default async function SelectFirmPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign-in');
  }

  // Fetch user's firms
  const userFirms = await db.userFirm.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      firm: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          themeColor: true
        }
      }
    }
  });

  if (userFirms.length === 0) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Aucune entreprise assignée</h1>
          <p className='text-muted-foreground mt-2'>
            Veuillez contacter votre administrateur pour obtenir l&apos;accès à
            une entreprise.
          </p>
        </div>
      </div>
    );
  }

  // If user has only one firm, redirect directly
  if (userFirms.length === 1) {
    const firm = userFirms[0].firm;
    // Check if user is admin/owner
    const isAdmin =
      userFirms[0].role === 'ADMIN' || userFirms[0].role === 'OWNER';
    const basePath = isAdmin ? '/admin' : `/${firm.slug}`;
    redirect(`${basePath}/dashboard/overview`);
  }

  return (
    <FirmSelectionClient
      firms={userFirms.map((uf) => ({
        id: uf.firm.id,
        name: uf.firm.name,
        slug: uf.firm.slug,
        logo: uf.firm.logo,
        themeColor: uf.firm.themeColor,
        role: uf.role
      }))}
    />
  );
}
