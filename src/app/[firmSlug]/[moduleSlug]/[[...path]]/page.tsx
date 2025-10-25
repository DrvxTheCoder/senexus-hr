import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { getModuleRegistry } from '@/core/module-registry';

interface ModulePageProps {
  params: Promise<{
    firmSlug: string;
    moduleSlug: string;
    path?: string[];
  }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { firmSlug, moduleSlug, path } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get firm by slug
  const firm = await db.firm.findUnique({
    where: { slug: firmSlug },
    include: {
      userFirms: {
        where: { userId: session.user.id },
        select: { role: true }
      }
    }
  });

  if (!firm || firm.userFirms.length === 0) {
    notFound();
  }

  const userRole = firm.userFirms[0].role;

  // Check if firm has the module installed and enabled
  const firmModule = await db.firmModule.findFirst({
    where: {
      firmId: firm.id,
      module: { slug: moduleSlug },
      isEnabled: true
    },
    include: {
      module: true
    }
  });

  if (!firmModule) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='mb-4 text-3xl font-bold'>Module non disponible</h1>
          <p className='text-muted-foreground mb-6'>
            Le module &quot;{moduleSlug}&quot; n&apos;est pas installé ou activé
            pour cette entreprise.
          </p>
          <a
            href={`/${firmSlug}/dashboard/overview`}
            className='text-primary hover:underline'
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  // Initialize module registry
  const registry = getModuleRegistry();
  await registry.initialize();

  // Get module config
  const moduleConfig = registry.getModuleBySlug(moduleSlug);

  if (!moduleConfig) {
    notFound();
  }

  // Check user permissions for this module
  if (
    moduleConfig.permissions &&
    !moduleConfig.permissions.includes(userRole)
  ) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='mb-4 text-3xl font-bold'>Accès refusé</h1>
          <p className='text-muted-foreground mb-6'>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à ce
            module.
          </p>
          <a
            href={`/${firmSlug}/dashboard/overview`}
            className='text-primary hover:underline'
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  // Build the current path
  const currentPath = path ? path.join('/') : '';

  // Find the matching route in module config
  const matchingRoute = moduleConfig.routes.find((route) => {
    const routePath = route.path || '';
    return routePath === currentPath;
  });

  if (!matchingRoute) {
    // If no matching route, try to redirect to module root
    if (currentPath !== '') {
      redirect(`/${firmSlug}/${moduleSlug}`);
    }
    notFound();
  }

  // Check route-specific permissions
  if (
    matchingRoute.requiredRole &&
    !matchingRoute.requiredRole.includes(userRole)
  ) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='mb-4 text-3xl font-bold'>Accès refusé</h1>
          <p className='text-muted-foreground mb-6'>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à
            cette page.
          </p>
          <a
            href={`/${firmSlug}/${moduleSlug}`}
            className='text-primary hover:underline'
          >
            Retour au module
          </a>
        </div>
      </div>
    );
  }

  // Dynamically import and render the component
  try {
    // Convert component path to actual module path
    // e.g., './pages/index' -> 'hr/pages/index'
    const componentPath = matchingRoute.component.replace('./', '');
    const modulePath = `${moduleSlug}/${componentPath}`;

    // Map of available module components
    // This approach is used because Next.js requires static imports for proper bundling
    const componentMap: Record<string, React.ComponentType> = {
      'hr/pages/index': (await import('@/modules/hr/pages/index')).default,
      'hr/pages/employees': (await import('@/modules/hr/pages/employees'))
        .default,
      'hr/pages/departments': (await import('@/modules/hr/pages/departments'))
        .default,
      'hr/pages/leaves': (await import('@/modules/hr/pages/leaves')).default,
      'hr/pages/missions': (await import('@/modules/hr/pages/missions')).default
    };

    const Component = componentMap[modulePath];

    if (!Component) {
      return (
        <div className='flex min-h-screen items-center justify-center'>
          <div className='text-center'>
            <h1 className='mb-4 text-3xl font-bold'>Page non implémentée</h1>
            <p className='text-muted-foreground mb-6'>
              La page &quot;{matchingRoute.name}&quot; n&apos;a pas encore été
              implémentée.
            </p>
            <p className='text-muted-foreground mb-6 font-mono text-sm'>
              Chemin attendu: src/modules/{modulePath}.tsx
            </p>
            <a
              href={`/${firmSlug}/${moduleSlug}`}
              className='text-primary hover:underline'
            >
              Retour au module
            </a>
          </div>
        </div>
      );
    }

    return <Component />;
  } catch (error) {
    console.error('Error loading module component:', error);
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h1 className='mb-4 text-3xl font-bold'>Erreur de chargement</h1>
          <p className='text-muted-foreground mb-6'>
            Une erreur s&apos;est produite lors du chargement du module.
          </p>
          <a
            href={`/${firmSlug}/dashboard/overview`}
            className='text-primary hover:underline'
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }
}
