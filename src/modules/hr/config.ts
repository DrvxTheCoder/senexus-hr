/**
 * HR Module Configuration
 *
 * This module handles:
 * - Employee management
 * - Department management
 * - Leave requests
 * - Missions/assignments
 */

import { ModuleConfig } from '@/modules/types';
import { Users, Building2, Calendar, Briefcase } from 'lucide-react';
import { FirmRole } from '@prisma/client';

export const hrModuleConfig: ModuleConfig = {
  id: 'hr-module',
  slug: 'hr',
  name: 'Ressources Humaines',
  description: 'Gestion des employés, départements, congés et missions',
  version: '1.0.0',
  icon: Users,
  basePath: '/hr',
  permissions: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER],
  healthCheck: '/api/health',
  isSystem: true,
  routes: [
    {
      path: '',
      name: 'Tableau de bord',
      icon: Users,
      component: './pages/index'
    },
    {
      path: 'employees',
      name: 'Employés',
      icon: Users,
      component: './pages/employees',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'departments',
      name: 'Départements',
      icon: Building2,
      component: './pages/departments',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN]
    },
    {
      path: 'leaves',
      name: 'Congés',
      icon: Calendar,
      component: './pages/leaves'
    },
    {
      path: 'missions',
      name: 'Missions',
      icon: Briefcase,
      component: './pages/missions'
    }
  ],
  metadata: {
    color: '#3b82f6',
    category: 'Operations'
  }
};
