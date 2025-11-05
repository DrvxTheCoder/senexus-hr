/**
 * Navigation Helpers - Dynamic Module Navigation System
 *
 * This module provides utilities for generating dynamic navigation
 * based on installed modules with graceful fallbacks.
 */

import { NavItem } from '@/types';
import { db } from '@/lib/db';
import { FirmRole } from '@prisma/client';
import { getModuleRegistry } from '@/core/module-registry';
import { getCoreNavItems, getFallbackModuleNavItems } from '@/constants/data';
import { Icons } from '@/components/icons';

/**
 * Get navigation items for a specific firm with dynamic module loading
 * @param firmId - The firm's database ID
 * @param firmSlug - The firm's slug for URL generation
 * @param userRole - The user's role in the firm
 * @returns Promise<NavItem[]> - Complete navigation with core + modules
 */
export async function getNavigationForFirm(
  firmId: string,
  firmSlug: string,
  userRole: FirmRole
): Promise<NavItem[]> {
  try {
    // Start with core navigation
    const coreNavItems = getCoreNavItems(firmSlug);

    // Fetch module navigation
    const moduleNavItems = await getModuleNavItems(firmId, firmSlug, userRole);

    // Merge: Core items first, then modules, then account at the end
    const accountItem = coreNavItems.find((item) => item.title === 'Compte');
    const otherCoreItems = coreNavItems.filter(
      (item) => item.title !== 'Compte'
    );

    return [
      ...otherCoreItems,
      ...moduleNavItems,
      ...(accountItem ? [accountItem] : [])
    ];
  } catch (error) {
    console.error('Error fetching navigation, using fallback:', error);
    // Graceful fallback: return static navigation
    return getCoreNavItems(firmSlug).concat(
      getFallbackModuleNavItems(firmSlug)
    );
  }
}

/**
 * Get dynamic module navigation items from database
 * @param firmId - The firm's database ID
 * @param firmSlug - The firm's slug for URL generation
 * @param userRole - The user's role in the firm
 * @returns Promise<NavItem[]> - Module navigation items
 */
export async function getModuleNavItems(
  firmId: string,
  firmSlug: string,
  userRole: FirmRole
): Promise<NavItem[]> {
  try {
    // Initialize module registry
    const registry = getModuleRegistry();
    await registry.initialize();

    // Fetch enabled modules for this firm
    const firmModules = await db.firmModule.findMany({
      where: {
        firmId,
        isEnabled: true
      },
      include: {
        module: true
      },
      orderBy: {
        module: { name: 'asc' }
      }
    });

    if (firmModules.length === 0) {
      return [];
    }

    const moduleNavItems: NavItem[] = [];

    for (const firmModule of firmModules) {
      try {
        // Get module configuration
        const moduleConfig = registry.getModuleBySlug(firmModule.module.slug);

        if (!moduleConfig) {
          console.warn(
            `Module config not found for slug: ${firmModule.module.slug}`
          );
          continue;
        }

        // Check if user has permission to access this module
        if (moduleConfig.permissions.length > 0) {
          if (!moduleConfig.permissions.includes(userRole)) {
            continue; // Skip this module
          }
        }

        // Build navigation items from module routes
        const moduleNavItem: NavItem = {
          title: moduleConfig.name,
          url: `/${firmSlug}/${moduleConfig.slug}`,
          icon: getIconName(moduleConfig.icon),
          isActive: false,
          items: []
        };

        // Add sub-items for each route
        for (const route of moduleConfig.routes) {
          // Check route-specific permissions
          if (route.requiredRole && route.requiredRole.length > 0) {
            if (!route.requiredRole.includes(userRole)) {
              continue; // Skip this route
            }
          }

          const routePath = route.path
            ? `/${firmSlug}/${moduleConfig.slug}/${route.path}`
            : `/${firmSlug}/${moduleConfig.slug}`;

          moduleNavItem.items!.push({
            title: route.name,
            url: routePath,
            icon: getIconName(route.icon)
          });
        }

        moduleNavItems.push(moduleNavItem);
      } catch (error) {
        console.error(
          `Error processing module ${firmModule.module.slug}:`,
          error
        );
        // Continue with other modules
        continue;
      }
    }

    return moduleNavItems;
  } catch (error) {
    console.error('Error fetching module navigation:', error);
    return []; // Return empty array on error
  }
}

/**
 * Convert Lucide icon component to string name for NavItem
 * @param icon - Icon component or string
 * @returns Icon name string
 */
function getIconName(icon: any): keyof typeof Icons | undefined {
  if (typeof icon === 'string') {
    return icon as keyof typeof Icons;
  }

  // Map common icons
  const iconMap: Record<string, keyof typeof Icons> = {
    Users: 'users',
    Building2: 'building',
    Calendar: 'calendar',
    Briefcase: 'briefcase',
    Package: 'package',
    FileText: 'post',
    BarChart: 'dashboard',
    Heart: 'check'
  };

  const iconName = icon?.displayName || icon?.name || 'package';
  return iconMap[iconName] || (iconName.toLowerCase() as keyof typeof Icons);
}

/**
 * Merge core and module navigation items
 * @param coreItems - Core navigation items
 * @param moduleItems - Module navigation items
 * @returns Merged navigation array
 */
export function mergeNavigation(
  coreItems: NavItem[],
  moduleItems: NavItem[]
): NavItem[] {
  // Find account/profile item to put at end
  const accountItem = coreItems.find(
    (item) =>
      item.title.toLowerCase().includes('compte') ||
      item.title.toLowerCase().includes('account')
  );

  const otherCoreItems = coreItems.filter((item) => item !== accountItem);

  return [
    ...otherCoreItems,
    ...moduleItems,
    ...(accountItem ? [accountItem] : [])
  ];
}

/**
 * Validate navigation items (remove invalid entries)
 * @param items - Navigation items to validate
 * @returns Validated navigation items
 */
export function validateNavigation(items: NavItem[]): NavItem[] {
  return items.filter((item) => {
    // Must have title and url
    if (!item.title || !item.url) {
      return false;
    }

    // If has sub-items, validate them too
    if (item.items && item.items.length > 0) {
      item.items = validateNavigation(item.items as NavItem[]);
    }

    return true;
  });
}
