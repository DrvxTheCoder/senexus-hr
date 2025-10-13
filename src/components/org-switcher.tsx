'use client';

import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
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

export function OrgSwitcher({
  tenants,
  defaultTenant,
  onTenantSwitch
}: {
  tenants: Tenant[];
  defaultTenant: Tenant;
  onTenantSwitch?: (tenantId: string) => void;
}) {
  const router = useRouter();
  const [selectedTenant, setSelectedTenant] = React.useState<
    Tenant | undefined
  >(defaultTenant || (tenants.length > 0 ? tenants[0] : undefined));
  const [pendingTenant, setPendingTenant] = React.useState<Tenant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Apply theme color on mount if available
  React.useEffect(() => {
    if (selectedTenant?.themeColor) {
      document.documentElement.style.setProperty(
        '--primary',
        selectedTenant.themeColor
      );
    }
  }, [selectedTenant?.themeColor]);

  const handleTenantClick = (tenant: Tenant) => {
    if (tenant.id === selectedTenant?.id) return;
    setPendingTenant(tenant);
    setIsDialogOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!pendingTenant) return;

    setIsDialogOpen(false);

    // Apply theme color if available and store in cookie
    if (pendingTenant.themeColor) {
      document.documentElement.style.setProperty(
        '--primary',
        pendingTenant.themeColor
      );
      // Store theme color in cookie for persistence
      document.cookie = `firm_theme_color=${pendingTenant.themeColor}; path=/; max-age=31536000; SameSite=Lax`;
    }

    // Determine navigation path
    const isAdmin =
      pendingTenant.role === 'ADMIN' || pendingTenant.role === 'OWNER';
    const basePath = isAdmin ? '/admin' : `/${pendingTenant.slug}`;

    if (onTenantSwitch) {
      onTenantSwitch(pendingTenant.id);
    }

    setSelectedTenant(pendingTenant);
    // Navigate to the new firm
    router.push(`${basePath}/dashboard/overview`);
  };

  const handleCancelSwitch = () => {
    setIsDialogOpen(false);
    setPendingTenant(null);
  };

  if (!selectedTenant) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border'
              >
                <div
                  className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg'
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
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <GalleryVerticalEnd className='size-4' />
                  )}
                </div>
                <div className='flex flex-col gap-0.5 leading-none'>
                  <span className='font-semibold'>Senexus</span>
                  <span className=''>{selectedTenant.name}</span>
                </div>
                <ChevronsUpDown className='ml-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-[--radix-dropdown-menu-trigger-width]'
              align='start'
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
                          className='h-full w-full object-cover'
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
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer d&apos;entreprise</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de basculer vers{' '}
              <span className='font-semibold'>{pendingTenant?.name}</span>.
              Voulez-vous continuer ?
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
