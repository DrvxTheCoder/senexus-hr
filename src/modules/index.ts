/**
 * Module Index
 *
 * Central export point for all modules.
 * Import and register all available modules here.
 */

import { ModuleConfig } from './types';
import { hrModuleConfig } from './hr/config';

/**
 * All available modules
 * Add new modules to this array as they're created
 */
export const ALL_MODULES: ModuleConfig[] = [
  hrModuleConfig
  // Add more modules here:
  // crmModuleConfig,
  // ipmModuleConfig,
  // accountingModuleConfig,
];

/**
 * Get module by slug
 */
export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

/**
 * Get all system modules (cannot be uninstalled)
 */
export function getSystemModules(): ModuleConfig[] {
  return ALL_MODULES.filter((m) => m.isSystem);
}

/**
 * Get all optional modules (can be installed/uninstalled)
 */
export function getOptionalModules(): ModuleConfig[] {
  return ALL_MODULES.filter((m) => !m.isSystem);
}
