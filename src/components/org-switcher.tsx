'use client';

import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
import * as React from 'react';
import { useThemeConfig } from '@/components/active-theme';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Tenant {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  themeColor?: string | null;
  role?: string;
}

// Special admin tenant
const ADMIN_TENANT: Tenant = {
  id: 'admin',
  name: 'Administration',
  slug: 'admin',
  logo: '/assets/img/logos/senexus-mini.png',
  themeColor: null
};

export function OrgSwitcher({
  tenants,
  defaultTenant,
  onTenantSwitch
}: {
  tenants: Tenant[];
  defaultTenant: Tenant;
  onTenantSwitch?: (tenantId: string) => void;
}) {
  const { setActiveTheme } = useThemeConfig();
  const { state, isMobile, openMobile } = useSidebar();
  const [selectedTenant, setSelectedTenant] = React.useState<
    Tenant | undefined
  >(defaultTenant || (tenants.length > 0 ? tenants[0] : undefined));
  const [pendingTenant, setPendingTenant] = React.useState<Tenant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Check if user has admin or owner role in any firm
  const hasAdminAccess = tenants.some(
    (tenant) => tenant.role === 'ADMIN' || tenant.role === 'OWNER'
  );

  // Update selected tenant when defaultTenant changes (e.g., route change)
  React.useEffect(() => {
    if (defaultTenant && defaultTenant.id !== selectedTenant?.id) {
      setSelectedTenant(defaultTenant);
    }
  }, [defaultTenant]);

  // Apply theme on mount if available
  React.useEffect(() => {
    if (selectedTenant?.themeColor) {
      setActiveTheme(selectedTenant.themeColor);
    }
  }, [selectedTenant?.themeColor, setActiveTheme]);

  const handleTenantClick = (tenant: Tenant) => {
    if (tenant.id === selectedTenant?.id) return;
    setPendingTenant(tenant);
    setIsDialogOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!pendingTenant) return;

    setIsDialogOpen(false);

    // Handle admin navigation
    if (pendingTenant.id === 'admin') {
      setActiveTheme('default');
      window.location.href = '/admin/dashboard/overview';
      return;
    }

    // Apply theme if available
    if (pendingTenant.themeColor) {
      setActiveTheme(pendingTenant.themeColor);
    }

    // Store selected firm ID in cookie for session persistence
    document.cookie = `selected_firm_id=${pendingTenant.id}; path=/; max-age=31536000; SameSite=Lax`;

    setSelectedTenant(pendingTenant);

    if (onTenantSwitch) {
      onTenantSwitch(pendingTenant.id);
    }

    // Navigate to the firm context
    const targetPath = `/${pendingTenant.slug}/dashboard/overview`;
    window.location.href = targetPath;
  };

  const handleCancelSwitch = () => {
    setIsDialogOpen(false);
    setPendingTenant(null);
  };

  if (!selectedTenant) {
    return null;
  }

  const isCollapsed = state === 'collapsed';
  // On mobile, always show full content when sidebar is open
  const showFullContent = isMobile ? openMobile : !isCollapsed;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
                tooltip={!showFullContent ? selectedTenant.name : undefined}
              >
                <div
                  className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg p-0'
                  style={{
                    backgroundColor: selectedTenant.logo
                      ? 'transparent'
                      : selectedTenant.themeColor || 'hsl(var(--primary))'
                  }}
                >
                  {selectedTenant.logo ? (
                    <img
                      src={selectedTenant.logo}
                      alt={selectedTenant.name}
                      className='h-full w-full'
                    />
                  ) : (
                    <GalleryVerticalEnd className='size-4' />
                  )}
                </div>
                {showFullContent && (
                  <>
                    <div className='flex flex-col gap-0.5 leading-none'>
                      <span className='font-semibold'>
                        {selectedTenant.name}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        Senexus Group
                      </span>
                    </div>
                    <ChevronsUpDown className='text-muted-foreground ml-auto' />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-[--radix-dropdown-menu-trigger-width]'
              align='start'
              side={'bottom'}
            >
              {tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onSelect={() => handleTenantClick(tenant)}
                >
                  <div className='flex flex-1 items-center gap-2'>
                    <div
                      className='flex h-6 w-6 items-center justify-center overflow-hidden rounded'
                      style={{
                        backgroundColor: tenant.logo
                          ? 'transparent'
                          : tenant.themeColor || 'hsl(var(--primary))'
                      }}
                    >
                      {tenant.logo ? (
                        <img
                          src={tenant.logo}
                          alt={tenant.name}
                          className='h-full w-full rounded-sm border object-cover'
                        />
                      ) : (
                        <GalleryVerticalEnd className='h-3 w-3 text-white' />
                      )}
                    </div>
                    <span>{tenant.name}</span>
                  </div>
                  {tenant.id === selectedTenant.id && (
                    <Check className='ml-auto h-4 w-4' />
                  )}
                </DropdownMenuItem>
              ))}

              {hasAdminAccess && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleTenantClick(ADMIN_TENANT)}
                  >
                    <div className='flex flex-1 items-center gap-2'>
                      <div className='flex h-6 w-6 items-center justify-center overflow-hidden rounded bg-transparent'>
                        <img
                          src={ADMIN_TENANT.logo!}
                          alt={ADMIN_TENANT.name}
                          className='h-full w-full object-contain'
                        />
                      </div>
                      <span>{ADMIN_TENANT.name}</span>
                    </div>
                    {selectedTenant?.id === 'admin' && (
                      <Check className='ml-auto h-4 w-4' />
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingTenant?.id === 'admin'
                ? "Accéder à l'administration"
                : "Changer d'entreprise"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTenant?.id === 'admin' ? (
                <>
                  Vous êtes sur le point d&apos;accéder au{' '}
                  <span className='font-semibold'>
                    panneau d&apos;administration
                  </span>
                  . Voulez-vous continuer ?
                </>
              ) : (
                <>
                  Vous êtes sur le point de basculer vers{' '}
                  <span className='font-semibold'>{pendingTenant?.name}</span>.
                  Voulez-vous continuer ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSwitch}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
