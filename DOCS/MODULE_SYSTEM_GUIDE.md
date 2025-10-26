# Module System Implementation Guide

## Overview
This guide explains the modular architecture implemented in Senexus Multi and how to complete the remaining implementation tasks.

## ✅ Completed Components

### 1. Database Schema
- `Module` table for module definitions
- `FirmModule` table for firm-specific module installations
- `ModuleDependency` table for module dependencies
- Migration applied: `20251019204112_add_module_system`

### 2. Core Infrastructure
- **Theme Context** (`src/contexts/theme-context.tsx`): Manages firm theme colors
- **Module Types** (`src/modules/types.ts`): TypeScript interfaces for modules
- **Module Registry** (`src/core/module-registry.ts`): Central module management

### 3. UI Improvements
- **OrgSwitcher**: Now properly applies theme colors and handles routing
- **Firm Selection**: Added admin mode option with dual-mode selection dialog

## 📋 Remaining Implementation Tasks

### Task 1: Create Example HR Module

Create the file structure:
```
src/modules/hr/
├── config.ts           # Module configuration
├── index.tsx           # Module export
├── api/
│   └── health/
│       └── route.ts    # Health check endpoint
├── components/
│   ├── employees-list.tsx
│   └── index.tsx
└── pages/
    ├── index.tsx       # HR Dashboard
    └── employees.tsx   # Employees page
```

**config.ts example:**
```typescript
import { ModuleConfig } from '@/modules/types';
import { Users } from 'lucide-react';
import { FirmRole } from '@prisma/client';

export const hrModuleConfig: ModuleConfig = {
  id: 'hr-module',
  slug: 'hr',
  name: 'Human Resources',
  description: 'Manage employees, departments, leaves, and missions',
  version: '1.0.0',
  icon: Users,
  basePath: '/hr',
  permissions: [FirmRole.OWNER, FirmRole.ADMIN, FirmRole.MANAGER],
  healthCheck: '/api/health',
  isSystem: true,
  routes: [
    {
      path: '',
      name: 'Dashboard',
      component: './pages/index',
    },
    {
      path: 'employees',
      name: 'Employees',
      component: './pages/employees',
    },
  ],
};
```

### Task 2: Dynamic Module Routing

Create `src/app/[firmSlug]/[moduleSlug]/[...path]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { moduleRegistry } from '@/core/module-registry';
import { db } from '@/lib/db';

export default async function ModulePage({
  params,
}: {
  params: { firmSlug: string; moduleSlug: string; path?: string[] };
}) {
  // Get firm
  const firm = await db.firm.findUnique({
    where: { slug: params.firmSlug },
  });

  if (!firm) return notFound();

  // Check if firm has module access
  const hasAccess = await moduleRegistry.firmHasModule(
    firm.id,
    params.moduleSlug
  );

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Module Not Installed</h1>
          <p className="text-muted-foreground">
            This module is not available for {firm.name}.
          </p>
        </div>
      </div>
    );
  }

  // Get module config
  const module = moduleRegistry.getModuleBySlug(params.moduleSlug);
  if (!module) return notFound();

  // Render module component
  // TODO: Dynamic import and render based on path
  return <div>Module: {module.name}</div>;
}
```

### Task 3: Module Discovery and Registration

Update `src/core/module-registry.ts` initialize method:

```typescript
async initialize() {
  if (this.isInitialized) return;

  try {
    // Import and register all modules
    const modules = await Promise.all([
      import('@/modules/hr/config').then(m => m.hrModuleConfig),
      // Add more modules as they're created
    ]);

    modules.forEach(config => this.registerModule(config));

    this.isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize module registry:', error);
  }
}
```

### Task 4: Dynamic Sidebar Navigation

Update `src/components/layout/app-sidebar.tsx` to generate navigation from modules:

```typescript
// Fetch enabled modules for firm
const modules = await moduleRegistry.getActiveModulesForFirm(firm.id);

// Generate navigation items
const moduleNavItems = modules.map(module => ({
  title: module.name,
  url: `/${firm.slug}/${module.slug}`,
  icon: module.icon,
  items: module.routes.map(route => ({
    title: route.name,
    url: `/${firm.slug}/${module.slug}/${route.path}`,
  })),
}));
```

### Task 5: Module Management API

Create `src/app/api/modules/route.ts`:

```typescript
// GET /api/modules - List all modules
// POST /api/modules - Create new module (from CLI)
```

Create `src/app/api/firms/[firmId]/modules/route.ts`:

```typescript
// GET /api/firms/[firmId]/modules - Get firm's modules
// POST /api/firms/[firmId]/modules - Install module for firm
```

Create `src/app/api/firms/[firmId]/modules/[moduleId]/route.ts`:

```typescript
// PATCH /api/firms/[firmId]/modules/[moduleId] - Enable/disable module
// DELETE /api/firms/[firmId]/modules/[moduleId] - Uninstall module
```

### Task 6: Admin Module Management UI

Update `src/app/admin/dashboard/modules/page.tsx`:

```typescript
// List all available modules
// Show which firms have each module
// Toggle module activation per firm
// Show module health status
// Display dependencies
```

### Task 7: Module Seeding Script

Create `prisma/seeds/modules.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedModules() {
  // Create core modules
  const hrModule = await prisma.module.create({
    data: {
      slug: 'hr',
      name: 'Human Resources',
      description: 'Employee and HR management',
      version: '1.0.0',
      basePath: '/hr',
      isSystem: true,
      isActive: true,
    },
  });

  const crmModule = await prisma.module.create({
    data: {
      slug: 'crm',
      name: 'CRM',
      description: 'Customer relationship management',
      version: '1.0.0',
      basePath: '/crm',
      isSystem: false,
      isActive: true,
    },
  });

  // Install HR module for all firms
  const firms = await prisma.firm.findMany();
  for (const firm of firms) {
    await prisma.firmModule.create({
      data: {
        firmId: firm.id,
        moduleId: hrModule.id,
        isEnabled: true,
      },
    });
  }
}
```

### Task 8: CLI Module Scaffolding Tool

Create `scripts/create-module.ts`:

```typescript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Command } from 'commander';

const program = new Command();

program
  .name('create-module')
  .description('Scaffold a new module')
  .requiredOption('--name <name>', 'Module display name')
  .requiredOption('--slug <slug>', 'Module slug (URL-safe)')
  .option('--description <desc>', 'Module description')
  .parse();

const options = program.opts();

// Generate module structure
const modulePath = path.join(__dirname, '..', 'src', 'modules', options.slug);

// Create directories
fs.mkdirSync(path.join(modulePath, 'api', 'health'), { recursive: true });
fs.mkdirSync(path.join(modulePath, 'components'), { recursive: true });
fs.mkdirSync(path.join(modulePath, 'pages'), { recursive: true });

// Generate config.ts
// Generate index.tsx
// Generate health check
// etc.

console.log(`✅ Module '${options.name}' created at ${modulePath}`);
```

Run with: `npm run create-module -- --name="Accounting" --slug="accounting"`

### Task 9: Module Health Check System

Create health check endpoints for each module:

```typescript
// src/modules/hr/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Perform checks (DB connection, dependencies, etc.)
    return NextResponse.json({
      status: 'healthy',
      module: 'hr',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

## 🎯 Quick Start for Testing

1. **Restart dev server** to reload Prisma client with new tables
2. **Seed modules**: Run `npm run db:seed` (after creating seed script)
3. **Test theme switching**: Switch between firms and verify theme colors persist
4. **Test admin mode**: Log in as admin and verify the administration card appears
5. **Create HR module**: Use the structure above to create your first module

## 📝 Best Practices

1. **Module Isolation**: Each module should be self-contained
2. **Error Boundaries**: Wrap module components in error boundaries
3. **Health Checks**: Implement health checks for critical modules
4. **Dependencies**: Clearly declare module dependencies
5. **Permissions**: Always check user permissions before rendering
6. **Naming**: Use consistent naming (slug matches folder name)

## 🐛 Troubleshooting

- **Module not appearing**: Check if it's registered in module-registry.ts
- **Access denied**: Verify firmModule record exists and is enabled
- **Theme not applying**: Clear cookies and restart browser
- **Routes not working**: Ensure dynamic route is created correctly

## 📚 Additional Resources

- Prisma docs: https://www.prisma.io/docs
- Next.js dynamic routes: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- Module pattern: https://www.patterns.dev/posts/module-pattern

---

**Status**: Core infrastructure complete. Ready for module implementation.
**Next Steps**: Create HR module, implement dynamic routing, build admin UI.
