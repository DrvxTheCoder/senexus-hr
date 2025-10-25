/**
 * Module System Types
 *
 * This file defines the core types and interfaces for the modular architecture.
 * Modules are self-contained functional units that can be enabled/disabled per firm.
 */

import { FirmRole } from '@prisma/client';
import { LucideIcon } from 'lucide-react';

/**
 * Route configuration for a module page/section
 */
export interface ModuleRoute {
  /** URL path segment (e.g., 'employees', 'reports') */
  path: string;
  /** Display name for navigation */
  name: string;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Component path or element */
  component?: string;
  /** Roles required to access this route */
  requiredRole?: FirmRole[];
  /** Whether this is a nested route */
  children?: ModuleRoute[];
}

/**
 * Module navigation item for sidebar
 */
export interface ModuleNavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: ModuleNavItem[];
  requiredRole?: FirmRole[];
}

/**
 * Module configuration
 *
 * Each module must export a config object that implements this interface.
 */
export interface ModuleConfig {
  /** Unique identifier for the module */
  id: string;

  /** URL-safe slug (must match database) */
  slug: string;

  /** Display name */
  name: string;

  /** Short description */
  description?: string;

  /** Semantic version (e.g., '1.0.0') */
  version: string;

  /** Icon name or component */
  icon?: string | LucideIcon;

  /** Base path for module routes (e.g., '/hr', '/crm') */
  basePath: string;

  /** Minimum role required to access this module */
  permissions: FirmRole[];

  /** Health check endpoint path (relative to basePath) */
  healthCheck?: string;

  /** Routes/pages within this module */
  routes: ModuleRoute[];

  /** Other modules this module depends on (slugs) */
  dependencies?: string[];

  /** Whether this is a system module (cannot be uninstalled) */
  isSystem?: boolean;

  /** Metadata for module configuration */
  metadata?: Record<string, any>;

  /** Hook called when module is installed for a firm */
  onInstall?: (firmId: string) => Promise<void>;

  /** Hook called when module is uninstalled from a firm */
  onUninstall?: (firmId: string) => Promise<void>;

  /** Hook called when module is enabled for a firm */
  onEnable?: (firmId: string) => Promise<void>;

  /** Hook called when module is disabled for a firm */
  onDisable?: (firmId: string) => Promise<void>;
}

/**
 * Module health status
 */
export interface ModuleHealthStatus {
  moduleSlug: string;
  isHealthy: boolean;
  message?: string;
  lastChecked: Date;
  responseTime?: number;
}

/**
 * Module installation status for a firm
 */
export interface FirmModuleStatus {
  moduleSlug: string;
  isInstalled: boolean;
  isEnabled: boolean;
  installedAt?: Date;
  settings?: Record<string, any>;
}

/**
 * Type for module manifest (exported from module index)
 */
export interface ModuleManifest {
  config: ModuleConfig;
  Component?: React.ComponentType<any>;
  getNavItems?: (basePath: string) => ModuleNavItem[];
}
