/**
 * Module Registry
 *
 * Central registry for discovering, loading, and managing modules.
 * Provides a caching layer and runtime module resolution.
 */

import {
  ModuleConfig,
  ModuleHealthStatus,
  FirmModuleStatus
} from '@/modules/types';
import { db } from '@/lib/db';
import { FirmRole } from '@prisma/client';

/**
 * In-memory cache for module configs
 */
class ModuleRegistry {
  private modules: Map<string, ModuleConfig> = new Map();
  private healthCache: Map<string, ModuleHealthStatus> = new Map();
  private isInitialized = false;

  /**
   * Initialize the registry by loading all available modules
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Import all modules from the modules index
      const { ALL_MODULES } = await import('@/modules');

      // Register all modules
      this.modules.clear();
      ALL_MODULES.forEach((config) => {
        this.registerModule(config);
      });

      console.log(
        `Initialized module registry with ${this.modules.size} modules`
      );
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize module registry:', error);
      throw error;
    }
  }

  /**
   * Register a module manually
   */
  registerModule(config: ModuleConfig) {
    this.modules.set(config.slug, config);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleConfig[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get a specific module by slug
   */
  getModuleBySlug(slug: string): ModuleConfig | undefined {
    return this.modules.get(slug);
  }

  /**
   * Get modules enabled for a specific firm
   */
  async getActiveModulesForFirm(firmId: string): Promise<ModuleConfig[]> {
    try {
      const firmModules = await db.firmModule.findMany({
        where: {
          firmId,
          isEnabled: true
        },
        include: {
          module: true
        }
      });

      return firmModules
        .map((fm) => this.modules.get(fm.module.slug))
        .filter((m): m is ModuleConfig => m !== undefined);
    } catch (error) {
      console.error(`Failed to get active modules for firm ${firmId}:`, error);
      return [];
    }
  }

  /**
   * Check if a firm has access to a module
   */
  async firmHasModule(firmId: string, moduleSlug: string): Promise<boolean> {
    try {
      const module = await db.module.findUnique({
        where: { slug: moduleSlug }
      });

      if (!module) return false;

      const firmModule = await db.firmModule.findUnique({
        where: {
          firmId_moduleId: {
            firmId,
            moduleId: module.id
          }
        }
      });

      return firmModule?.isEnabled ?? false;
    } catch (error) {
      console.error(`Failed to check firm module access:`, error);
      return false;
    }
  }

  /**
   * Get module installation status for a firm
   */
  async getFirmModuleStatus(
    firmId: string,
    moduleSlug: string
  ): Promise<FirmModuleStatus | null> {
    try {
      const module = await db.module.findUnique({
        where: { slug: moduleSlug }
      });

      if (!module) return null;

      const firmModule = await db.firmModule.findUnique({
        where: {
          firmId_moduleId: {
            firmId,
            moduleId: module.id
          }
        }
      });

      if (!firmModule) {
        return {
          moduleSlug,
          isInstalled: false,
          isEnabled: false
        };
      }

      return {
        moduleSlug,
        isInstalled: true,
        isEnabled: firmModule.isEnabled,
        installedAt: firmModule.installedAt,
        settings: firmModule.settings as Record<string, any> | undefined
      };
    } catch (error) {
      console.error(`Failed to get firm module status:`, error);
      return null;
    }
  }

  /**
   * Check module health
   */
  async checkModuleHealth(moduleSlug: string): Promise<ModuleHealthStatus> {
    const cached = this.healthCache.get(moduleSlug);
    const cacheAge = cached
      ? Date.now() - cached.lastChecked.getTime()
      : Infinity;

    // Return cached if less than 1 minute old
    if (cached && cacheAge < 60000) {
      return cached;
    }

    const module = this.modules.get(moduleSlug);
    if (!module) {
      return {
        moduleSlug,
        isHealthy: false,
        message: 'Module not found',
        lastChecked: new Date()
      };
    }

    // If no health check endpoint, assume healthy
    if (!module.healthCheck) {
      const status: ModuleHealthStatus = {
        moduleSlug,
        isHealthy: true,
        message: 'No health check configured',
        lastChecked: new Date()
      };
      this.healthCache.set(moduleSlug, status);
      return status;
    }

    // Perform health check
    const startTime = Date.now();
    try {
      const response = await fetch(`${module.basePath}${module.healthCheck}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      const status: ModuleHealthStatus = {
        moduleSlug,
        isHealthy,
        message: isHealthy ? 'OK' : `HTTP ${response.status}`,
        lastChecked: new Date(),
        responseTime
      };

      this.healthCache.set(moduleSlug, status);
      return status;
    } catch (error) {
      const status: ModuleHealthStatus = {
        moduleSlug,
        isHealthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date()
      };

      this.healthCache.set(moduleSlug, status);
      return status;
    }
  }

  /**
   * Check if user has permission to access a module
   */
  canUserAccessModule(userRole: FirmRole, module: ModuleConfig): boolean {
    if (module.permissions.length === 0) return true;

    const roleHierarchy: Record<FirmRole, number> = {
      OWNER: 5,
      ADMIN: 4,
      MANAGER: 3,
      STAFF: 2,
      VIEWER: 1
    };

    const userLevel = roleHierarchy[userRole];
    const minLevel = Math.min(
      ...module.permissions.map((r) => roleHierarchy[r])
    );

    return userLevel >= minLevel;
  }

  /**
   * Clear the module cache
   */
  clearCache() {
    this.modules.clear();
    this.healthCache.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
let instance: ModuleRegistry | null = null;

/**
 * Get the singleton instance of ModuleRegistry
 */
export function getModuleRegistry(): ModuleRegistry {
  if (!instance) {
    instance = new ModuleRegistry();
  }
  return instance;
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();

// Also export the class for type usage
export { ModuleRegistry };
