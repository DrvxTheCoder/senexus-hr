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
// For firm-specific navigation (regular users)
export const navItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Ressources Humaines',
    url: '#',
    icon: 'users',
    isActive: false,
    items: [
      {
        title: 'Employés',
        url: '/dashboard/employees',
        icon: 'user',
        shortcut: ['e', 'e']
      },
      {
        title: 'Départements',
        url: '/dashboard/departments',
        icon: 'building',
        shortcut: ['d', 'p']
      },
      {
        title: 'Congés',
        url: '/dashboard/leaves',
        icon: 'calendar'
      },
      {
        title: 'Missions',
        url: '/dashboard/missions',
        icon: 'plane'
      }
    ]
  },
  {
    title: 'CRM',
    url: '#',
    icon: 'product',
    isActive: false,
    items: [
      {
        title: 'Clients',
        url: '/dashboard/clients',
        icon: 'briefcase',
        shortcut: ['c', 'c']
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
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      }
    ]
  }
];

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
