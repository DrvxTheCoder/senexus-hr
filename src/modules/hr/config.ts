/**
 * HR Module Configuration
 *
 * Enhanced module for interim staffing agencies in Senegal
 * Handles complete employee lifecycle with compliance for 2-year interim law
 */

import { ModuleConfig } from '@/modules/types';
import {
  Users,
  Building2,
  Calendar,
  Briefcase,
  FileText,
  ArrowRightLeft,
  UserX,
  DollarSign,
  FolderOpen
} from 'lucide-react';
import { FirmRole } from '@prisma/client';

export const hrModuleConfig: ModuleConfig = {
  id: 'hr-module',
  slug: 'hr',
  name: 'Ressources Humaines',
  description: 'Gestion complète des employés intérimaires et RH',
  version: '2.0.0',
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
      path: 'contracts',
      name: 'Contrats',
      icon: FileText,
      component: './pages/contracts',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'transfers',
      name: 'Transferts',
      icon: ArrowRightLeft,
      component: './pages/transfers',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'leaves',
      name: 'Congés',
      icon: Calendar,
      component: './pages/leaves',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'absences',
      name: 'Absences',
      icon: UserX,
      component: './pages/absences',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'missions',
      name: 'Missions',
      icon: Briefcase,
      component: './pages/missions',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'documents',
      name: 'Documents',
      icon: FolderOpen,
      component: './pages/documents',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER]
    },
    {
      path: 'payroll',
      name: 'Paie',
      icon: DollarSign,
      component: './pages/payroll',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN]
    },
    {
      path: 'departments',
      name: 'Départements',
      icon: Building2,
      component: './pages/departments',
      requiredRole: [FirmRole.OWNER, FirmRole.ADMIN]
    }
  ],
  metadata: {
    color: '#3b82f6',
    category: 'Operations',
    compliance: {
      country: 'Senegal',
      interimLawCompliant: true,
      maxInterimDuration: 730,
      annualLeaveDays: 20
    }
  }
};
