/**
 * CRM Module Configuration
 *
 * Customer Relationship Management module for managing clients
 */

import { ModuleConfig } from '@/modules/types';
import { Building2, Users, FileText, BarChart3 } from 'lucide-react';
import { FirmRole } from '@prisma/client';

export const crmModuleConfig: ModuleConfig = {
  id: 'crm-module',
  slug: 'crm',
  name: 'CRM',
  description: 'Gestion des clients et relations commerciales',
  version: '1.0.0',
  icon: Building2,
  basePath: '/crm',
  permissions: [
    FirmRole.OWNER,
    FirmRole.ADMIN,
    FirmRole.MANAGER,
    FirmRole.STAFF
  ],
  healthCheck: '/api/health',
  isSystem: false,
  routes: [
    {
      path: '',
      name: 'Tableau de bord',
      icon: BarChart3,
      component: './pages/index'
    },
    {
      path: 'clients',
      name: 'Clients',
      icon: Building2,
      component: './pages/clients',
      requiredRole: [
        FirmRole.OWNER,
        FirmRole.ADMIN,
        FirmRole.MANAGER,
        FirmRole.STAFF
      ]
    },
    {
      path: 'reports',
      name: 'Rapports',
      icon: FileText,
      component: './pages/reports',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN]
    }
  ],
  metadata: {
    color: '#8b5cf6',
    category: 'Sales'
  }
};
