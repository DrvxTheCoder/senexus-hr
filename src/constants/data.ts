import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.

/**
 * CORE NAVIGATION - Static items always visible
 * These are non-module items that are always present
 * @param firmSlug - The slug of the current firm
 * @returns Core navigation items with firm slug prefixed
 */
export function getCoreNavItems(firmSlug: string): NavItem[] {
  return [
    {
      title: 'Tableau de bord',
      url: `/${firmSlug}/dashboard/overview`,
      icon: 'dashboard',
      isActive: false,
      shortcut: ['d', 'd'],
      items: []
    },
    {
      title: 'Compte',
      url: '#',
      icon: 'billing',
      isActive: false,
      items: [
        {
          title: 'Profil',
          url: `/${firmSlug}/dashboard/profile`,
          icon: 'userPen',
          shortcut: ['p', 'p']
        }
      ]
    }
  ];
}

/**
 * FALLBACK MODULE NAVIGATION - Used when API fails
 * This provides a fallback when dynamic module loading fails
 * @param firmSlug - The slug of the current firm
 * @returns Fallback module navigation items
 */
export function getFallbackModuleNavItems(firmSlug: string): NavItem[] {
  return [
    {
      title: 'Ressources Humaines',
      url: `/${firmSlug}/hr`,
      icon: 'users',
      isActive: false,
      items: [
        {
          title: 'Tableau de bord',
          url: `/${firmSlug}/hr`,
          icon: 'dashboard'
        },
        {
          title: 'Employés',
          url: `/${firmSlug}/hr/employees`,
          icon: 'user',
          shortcut: ['e', 'e']
        },
        {
          title: 'Départements',
          url: `/${firmSlug}/hr/departments`,
          icon: 'building',
          shortcut: ['d', 'p']
        },
        {
          title: 'Congés',
          url: `/${firmSlug}/hr/leaves`,
          icon: 'calendar'
        },
        {
          title: 'Missions',
          url: `/${firmSlug}/hr/missions`,
          icon: 'plane'
        }
      ]
    }
  ];
}

/**
 * COMPLETE NAVIGATION - Core + Fallback Modules
 * This is the complete fallback navigation when API is unavailable
 * @param firmSlug - The slug of the current firm
 * @returns Complete navigation items
 */
export function getNavItems(firmSlug: string): NavItem[] {
  return [...getCoreNavItems(firmSlug), ...getFallbackModuleNavItems(firmSlug)];
}

// Legacy export for backward compatibility (uses placeholder)
export const navItems: NavItem[] = getNavItems('[firmSlug]');

// For admin navigation (ADMIN/OWNER users)
export const adminNavItems: NavItem[] = [
  {
    title: "Vue d'ensemble",
    url: '/admin/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Administration',
    url: '#',
    icon: 'settings',
    isActive: false,
    items: [
      {
        title: 'Entreprises',
        url: '/admin/dashboard/firms',
        icon: 'building',
        shortcut: ['f', 'f']
      },
      {
        title: 'Utilisateurs',
        url: '/admin/dashboard/users',
        icon: 'users',
        shortcut: ['u', 'u']
      },
      {
        title: 'Modules',
        url: '/admin/dashboard/modules',
        icon: 'package',
        shortcut: ['m', 'd']
      }
    ]
  },
  {
    title: 'Compte',
    url: '#',
    icon: 'billing',
    isActive: true,
    items: [
      {
        title: 'Profil',
        url: '/admin/dashboard/profile',
        icon: 'userPen',
        shortcut: ['p', 'p']
      }
    ]
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
