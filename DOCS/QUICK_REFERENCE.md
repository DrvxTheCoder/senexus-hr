# Module System - Quick Reference Card

## 🎯 What Was Implemented

### Core Features ✅
1. **Module Database Tables** - Store module definitions and firm associations
2. **Module Registry** - Central system for loading and managing modules
3. **Theme Context** - Persistent firm theme colors
4. **Admin Mode** - Separate admin/firm views for ADMIN/OWNER users
5. **Fixed Routing** - Proper firm switching with context updates

### Key Files Created
- `src/modules/types.ts` - TypeScript interfaces
- `src/core/module-registry.ts` - Module management system
- `src/modules/index.ts` - Module registration
- `src/modules/hr/config.ts` - Example HR module
- `src/contexts/theme-context.tsx` - Theme management
- `MODULE_SYSTEM_GUIDE.md` - Full implementation guide
- `IMPLEMENTATION_STATUS.md` - Detailed progress tracking

---

## 🚀 How to Add a New Module (Step-by-Step)

### 1. Create Module Structure
```bash
mkdir -p src/modules/my-module/{config.ts,pages,components,api/health}
```

### 2. Create Config File
```typescript
// src/modules/my-module/config.ts
import { ModuleConfig } from '@/modules/types';
import { Icon } from 'lucide-react';
import { FirmRole } from '@prisma/client';

export const myModuleConfig: ModuleConfig = {
  id: 'my-module',
  slug: 'my-module',
  name: 'My Module',
  description: 'Description here',
  version: '1.0.0',
  icon: Icon,
  basePath: '/my-module',
  permissions: [FirmRole.OWNER, FirmRole.ADMIN],
  routes: [
    {
      path: '',
      name: 'Dashboard',
      component: './pages/index',
    },
  ],
};
```

### 3. Register Module
```typescript
// src/modules/index.ts
import { myModuleConfig } from './my-module/config';

export const ALL_MODULES: ModuleConfig[] = [
  hrModuleConfig,
  myModuleConfig, // Add here
];
```

### 4. Seed Module in Database
```typescript
// prisma/seeds/modules.ts
const myModule = await prisma.module.create({
  data: {
    slug: 'my-module',
    name: 'My Module',
    version: '1.0.0',
    basePath: '/my-module',
    isSystem: false,
    isActive: true,
  },
});
```

### 5. Install for Firms
```typescript
// In seed or API
await prisma.firmModule.create({
  data: {
    firmId: firm.id,
    moduleId: myModule.id,
    isEnabled: true,
  },
});
```

---

## 🔍 Quick Code Snippets

### Check if Firm Has Module Access
```typescript
import { moduleRegistry } from '@/core/module-registry';

const hasAccess = await moduleRegistry.firmHasModule(firmId, 'hr');
```

### Get All Active Modules for Firm
```typescript
const modules = await moduleRegistry.getActiveModulesForFirm(firmId);
```

### Check User Permission for Module
```typescript
const module = moduleRegistry.getModuleBySlug('hr');
const canAccess = moduleRegistry.canUserAccessModule(userRole, module);
```

### Apply Theme Color
```typescript
import { useTheme } from '@/contexts/theme-context';

const { setThemeColor } = useTheme();
setThemeColor('#3b82f6');
```

### Module Health Check
```typescript
const health = await moduleRegistry.checkModuleHealth('hr');
console.log(health.isHealthy); // true/false
```

---

## 🗺️ Module Routing Pattern

### URL Structure
```
/{firmSlug}/{moduleSlug}/{...path}
```

### Examples
```
/acme-corp/hr                    → HR Dashboard
/acme-corp/hr/employees          → Employees List
/acme-corp/hr/employees/123      → Employee Detail
/acme-corp/crm/clients           → CRM Clients
/admin/dashboard/modules         → Admin Module Management
```

---

## 📊 Database Schema Quick Reference

### Module Table
```sql
modules (
  id          CUID
  slug        String  @unique
  name        String
  version     String
  basePath    String
  isSystem    Boolean
  isActive    Boolean
  metadata    Json?
)
```

### FirmModule Table
```sql
firm_modules (
  id          CUID
  firmId      String
  moduleId    String
  isEnabled   Boolean
  settings    Json?
  installedAt DateTime
)
UNIQUE(firmId, moduleId)
```

### ModuleDependency Table
```sql
module_dependencies (
  id          CUID
  moduleId    String
  dependsOnId String
)
UNIQUE(moduleId, dependsOnId)
```

---

## 🎨 Theme Color Examples

```typescript
// Default themes from constants
const themes = [
  { name: 'Bleu', value: 'default', color: '#3b82f6' },
  { name: 'Vert', value: 'green', color: '#10b981' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Rose', value: 'rose', color: '#f43f5e' },
  { name: 'Violet', value: 'violet', color: '#8b5cf6' },
];
```

---

## ⚙️ Common Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Run seeds
npm run db:seed

# Create new module (once CLI is built)
npm run create-module -- --name="Accounting" --slug="accounting"

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not appearing | Check if registered in `src/modules/index.ts` |
| Theme not persisting | Clear cookies and restart browser |
| 404 on module route | Ensure dynamic route exists: `[firmSlug]/[moduleSlug]/[...path]/page.tsx` |
| Prisma client errors | Restart dev server after schema changes |
| Module access denied | Check FirmModule record in database |
| Health check fails | Verify health check endpoint exists |

---

## 📞 API Endpoints (To Be Implemented)

```typescript
GET    /api/modules                           // List all modules
POST   /api/modules                           // Register module
GET    /api/modules/health                    // All modules health

GET    /api/firms/[firmId]/modules            // Firm's modules
POST   /api/firms/[firmId]/modules            // Install module
PATCH  /api/firms/[firmId]/modules/[moduleId] // Enable/disable
DELETE /api/firms/[firmId]/modules/[moduleId] // Uninstall

GET    /api/modules/[slug]/health             // Module health check
```

---

## 🎓 Best Practices

1. **Naming**: Module slug must match folder name
2. **Permissions**: Always define required roles
3. **Dependencies**: Declare module dependencies explicitly
4. **Health Checks**: Implement for critical modules
5. **Error Handling**: Wrap module components in error boundaries
6. **Isolation**: Keep modules self-contained
7. **Versioning**: Use semantic versioning (1.0.0)
8. **Metadata**: Store module-specific config in metadata JSON

---

## 📁 Priority Implementation Order

1. **Dynamic Routing** - Module pages need routes
2. **Sidebar Navigation** - Users need to access modules
3. **HR Module Pages** - Example implementation
4. **Module Seeding** - Database population
5. **Module Management API** - Enable/disable functionality
6. **Admin UI** - Module management interface
7. **Health Checks** - Monitoring system
8. **CLI Tool** - Developer productivity

---

## 💡 Pro Tips

- Use `moduleRegistry.initialize()` in API routes that need module access
- Cache expensive operations (registry does this automatically)
- Test with multiple firms and roles
- Use TypeScript strict mode for better type safety
- Keep module configs DRY - reuse route patterns
- Document module-specific APIs in module README
- Use semantic versioning for breaking changes

---

**Need Help?** Check `MODULE_SYSTEM_GUIDE.md` for detailed examples and `IMPLEMENTATION_STATUS.md` for progress tracking.
