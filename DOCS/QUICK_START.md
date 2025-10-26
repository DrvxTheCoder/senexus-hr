# Quick Start Guide - HR & CRM Modules

## What's Ready Now ✅

### HR Module (`/{firmSlug}/hr`)
- **Employees Page** - `/hr/employees` ✅ WORKING
  - View employees list
  - Search and filter
  - View interim duration warnings
  - Stats dashboard

### CRM Module (`/{firmSlug}/crm`)
- **Clients Page** - `/crm/clients` ✅ WORKING
  - Create, edit, view clients
  - Full CRUD operations
  - Search and filter
  - Stats dashboard

## Testing Workflow

### Step 1: Setup Database
```bash
# Database is already migrated ✅
# If you need to reset:
npx prisma db push --force-reset
npx prisma db seed
```

### Step 2: Create Test Clients (CRM)
1. Navigate to `/{firmSlug}/crm/clients`
2. Click "Ajouter un client"
3. Create 2-3 test clients:
   - **Client A**: "ABC Corporation" (ACTIVE)
   - **Client B**: "XYZ Industries" (PROSPECT)
   - **Client C**: "Test Company" (ACTIVE)

### Step 3: View Employees (HR)
1. Navigate to `/{firmSlug}/hr/employees`
2. Should see empty list (no employees yet)
3. Stats cards show 0

### Step 4: Create Departments (Optional)
1. Navigate to `/{firmSlug}/hr/departments`
2. Create test departments:
   - IT & Development
   - Operations
   - Administration

## Important Files

### For Reference:
- `HR_MODULE_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- `SESSION_SUMMARY.md` - What was accomplished
- `CRM_MODULE_COMPLETE.md` - CRM details

### For Development:
```
src/modules/hr/actions/employee-actions.ts    ← Employee server actions
src/modules/crm/actions/client-actions.ts     ← Client server actions
src/modules/hr/schemas/employee-schema.ts     ← Employee validation
src/modules/crm/schemas/client-schema.ts      ← Client validation
```

## Quick Commands

```bash
# Start development server
pnpm dev

# Generate Prisma client (after schema changes)
npx prisma generate

# Open Prisma Studio (view database)
npx prisma studio

# Format code
npx prettier --write .

# Run type check
npx tsc --noEmit
```

## Routes Available

### HR Module
- `/hr` - Dashboard
- `/hr/employees` ✅ - Employee management (WORKING)
- `/hr/contracts` - Contracts (placeholder)
- `/hr/transfers` - Transfers (placeholder)
- `/hr/leaves` - Leaves (existing, needs update)
- `/hr/absences` - Absences (placeholder)
- `/hr/missions` - Missions (existing, needs update)
- `/hr/documents` - Documents (placeholder)
- `/hr/payroll` - Payroll (placeholder)
- `/hr/departments` - Departments (existing)

### CRM Module
- `/crm` - Dashboard
- `/crm/clients` ✅ - Client management (WORKING)
- `/crm/reports` - Reports (placeholder)

## Next Immediate Tasks

1. **Fix firmId Resolution** (Priority 1)
   - Update `temp-firm-id` placeholders
   - Implement session-based firmId extraction

2. **Create Employee Form** (Priority 2)
   - Build create/edit dialog
   - Use client form as reference
   - Multi-step form recommended

3. **Test Complete Flow** (Priority 3)
   - Create clients in CRM
   - Create employees in HR
   - Assign employees to clients

## Common Issues & Solutions

### Issue: "temp-firm-id not found"
**Solution**: Need to implement firmId resolution from session

### Issue: Navigation doesn't show HR/CRM
**Solution**:
- Check module is registered in `src/modules/index.ts`
- Check firm has module installed in database
- Run seed script: `npx prisma db seed`

### Issue: TypeScript errors
**Solution**: Run `npx prisma generate` to regenerate Prisma client

## Architecture Patterns

### Creating New Features (Example: Contracts)

1. **Create Schema** (`src/modules/hr/schemas/contract-schema.ts`):
```typescript
export const createContractSchema = z.object({
  // fields
});
```

2. **Create Actions** (`src/modules/hr/actions/contract-actions.ts`):
```typescript
'use server';
export async function getContracts(firmId: string) {
  // implementation
}
```

3. **Create Page** (`src/modules/hr/pages/contracts.tsx`):
```typescript
'use client';
export default function ContractsPage() {
  // use actions
}
```

4. **Update Config** (`src/modules/hr/config.ts`):
```typescript
routes: [
  { path: 'contracts', name: 'Contrats', ... }
]
```

## Permissions System

**Hierarchy:**
- OWNER - Full access, can delete
- ADMIN - Create, update, view all
- MANAGER - Create, update (department scope)
- STAFF - View own data
- VIEWER - Read-only

**Check in Actions:**
```typescript
if (!['ADMIN', 'OWNER'].includes(userFirm.role)) {
  return { success: false, error: 'Permissions insuffisantes' };
}
```

## Help & Resources

**Documentation:**
- HR Implementation Guide
- Session Summary
- CRM Module Complete guide

**Code References:**
- Employee actions - Pattern for all entities
- Client actions - CRM pattern
- Date utils - French formatting

**Next.js 15 Docs:**
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- App Router: https://nextjs.org/docs/app

## Support

For issues:
1. Check documentation files in root
2. Review existing patterns (employee/client)
3. Check TypeScript errors: `npx tsc --noEmit`
4. Review Prisma schema: `npx prisma studio`

---

**Quick Start Complete! Ready to build. 🚀**
