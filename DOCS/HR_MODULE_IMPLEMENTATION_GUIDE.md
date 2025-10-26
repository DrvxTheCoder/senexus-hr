# HR Module Implementation Guide

## Overview

The HR Module is a comprehensive human resources management system designed for interim staffing agencies in Senegal. It handles employee management, contracts, leaves, transfers, and payroll with special consideration for Senegalese interim law (2-year maximum per firm).

## Current Implementation Status

### ✅ Completed (Phase 1 - Foundation)

1. **Database Schema** - Enhanced with full HR tables:
   - ✅ Employee (with interim tracking)
   - ✅ Department (with manager relation)
   - ✅ Contract (with INTERIM type, renewal tracking)
   - ✅ EmployeeTransfer (complete transfer system)
   - ✅ LeaveRequest (with types and approval workflow)
   - ✅ LeaveBalance (annual balance tracking)
   - ✅ Absence (justified/unjustified tracking)
   - ✅ Mission (with expenses and approval)
   - ✅ MissionExpense (expense tracking)
   - ✅ PayrollConfig (per-firm configuration)
   - ✅ EmployeeSalary (salary history)
   - ✅ Payslip (basic payslip generation)
   - ✅ Client (enhanced with quarterly reports)
   - ✅ ClientQuarterlyReport (automated reporting)
   - ✅ FileObject (document management with expiry)

2. **Validation Schemas** (`src/modules/hr/schemas/`)
   - ✅ employee-schema.ts - Zod validation for employee CRUD

3. **Server Actions** (`src/modules/hr/actions/`)
   - ✅ employee-actions.ts - Complete CRUD with:
     - Permission checks (ADMIN/OWNER/MANAGER)
     - Audit logging
     - Interim duration calculations
     - 2-year limit warnings

4. **Utility Functions** (`src/modules/hr/utils/`)
   - ✅ date-utils.ts - Date calculations, formatting (French), working days

5. **UI Components**
   - ✅ Updated employees page with real data
   - ✅ Stats dashboard
   - ✅ Filterable table
   - ✅ 2-year interim warnings

## Architecture

### File Structure

```
src/modules/hr/
├── config.ts              # Module configuration (routes, permissions)
├── pages/                 # Page components
│   ├── index.tsx         # HR Dashboard
│   ├── employees.tsx     # ✅ Employee management (REAL DATA)
│   ├── contracts.tsx     # ⏳ To implement
│   ├── transfers.tsx     # ⏳ To implement
│   ├── leaves.tsx        # ⏳ To implement
│   ├── absences.tsx      # ⏳ To implement
│   ├── missions.tsx      # ⏳ To implement
│   ├── documents.tsx     # ⏳ To implement
│   └── payroll.tsx       # ⏳ To implement
├── components/            # Module-specific components
│   ├── employees/        # ⏳ Employee components (to create)
│   ├── contracts/        # ⏳ Contract components
│   ├── leaves/           # ⏳ Leave components
│   └── shared/           # Shared module components
├── actions/               # Server actions for data operations
│   ├── employee-actions.ts  # ✅ COMPLETED
│   ├── contract-actions.ts  # ⏳ To implement
│   ├── transfer-actions.ts  # ⏳ To implement
│   └── leave-actions.ts     # ⏳ To implement
├── schemas/               # Zod validation schemas
│   ├── employee-schema.ts   # ✅ COMPLETED
│   └── contract-schema.ts   # ⏳ To implement
└── utils/                 # Module utilities
    ├── date-utils.ts        # ✅ COMPLETED
    └── leave-calculator.ts  # ⏳ To implement
```

### Key Patterns

#### Server Actions Pattern

All data operations use Next.js 15 Server Actions:

```typescript
'use server';

import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function myAction(firmId: string, input: any) {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Non autorisé' };
  }

  // 2. Authorization check
  const userFirm = await db.userFirm.findUnique({
    where: { userId_firmId: { userId: session.user.id, firmId } },
  });

  if (!userFirm || !['ADMIN', 'OWNER'].includes(userFirm.role)) {
    return { success: false, error: 'Permissions insuffisantes' };
  }

  // 3. Validation
  const validated = schema.parse(input);

  // 4. Database operation
  const result = await db.entity.create({ data: validated });

  // 5. Audit log
  await db.auditLog.create({
    data: {
      firmId,
      actorId: session.user.id,
      action: 'CREATE',
      entity: 'ENTITY',
      entityId: result.id,
      metadata: { /* details */ },
    },
  });

  // 6. Revalidate cache
  revalidatePath(`/${firmId}/hr/entity`);

  return { success: true, data: result };
}
```

#### Error Handling Pattern

All actions return a consistent response structure:

```typescript
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

#### Permission Levels

- **OWNER**: Full access, can delete
- **ADMIN**: Create, update, view all
- **MANAGER**: Create, update own department, view all
- **STAFF**: View own data only
- **VIEWER**: Read-only access

## Business Logic

### 1. Interim Law (2-Year Rule)

**Senegalese law**: An employee can work as interim staff for the SAME firm for a maximum of 2 years from their `firstInterimDate`.

**Implementation**:
- `Employee.firstInterimDate` - Tracks when employee started as interim
- `calculateInterimDuration()` - Calculates days elapsed and remaining
- UI shows warnings at 90 days (3 months) before limit
- Transfer system resets `firstInterimDate` when employee moves to a new firm

**Example**:
```typescript
// Employee hired as interim on 2023-01-01
firstInterimDate: 2023-01-01

// 2-year limit: 2025-01-01
// Warning shown: 2024-10-03 (90 days before)
// Must transfer or convert to CDI before 2025-01-01
```

### 2. Employee Transfers

Transfers allow employees to move between firms within the same holding when approaching the 2-year limit.

**Workflow**:
1. Manager requests transfer (90+ days before limit)
2. ADMIN/OWNER of destination firm approves
3. On `effectiveDate`:
   - `Employee.firmId` updated
   - `Employee.firstInterimDate` reset to `effectiveDate`
   - Old contracts marked inactive
   - New contract created at destination firm

### 3. Leave Management

**Annual Leave**: 20 days per year (Senegal standard)
- `LeaveBalance` created on January 1st for all active employees
- Unused days can be carried over (stored in `carriedOver`)
- Leave requests deduct from balance upon approval

**Leave Types**:
- ANNUAL - Paid vacation (20 days/year)
- SICK - Sick leave (requires medical certificate)
- MATERNITY - 14 weeks
- PATERNITY - 3 days
- UNPAID - Unpaid leave
- SPECIAL - Special circumstances (marriage, death, etc.)
- COMPENSATORY - Compensation for overtime

### 4. Contract Alerts

Contracts have an `alertThreshold` (default 30 days):
- System flags contracts ending within threshold
- Managers notified to renew or terminate
- Auto-renewal option available (`isAutoRenewal`)

## Implementation Roadmap

### Phase 2: Contracts Module (Priority 2)

**Files to Create**:
```
src/modules/hr/
├── schemas/contract-schema.ts
├── actions/contract-actions.ts
├── components/contracts/
│   ├── contract-list.tsx
│   ├── contract-form.tsx
│   ├── contract-alerts.tsx
│   └── renewal-dialog.tsx
└── pages/contracts.tsx
```

**Features**:
1. Contract management view with status badges
2. Create/Edit contract form with validation
3. Alert dashboard for expiring contracts
4. Renewal workflow
5. Termination with reason

**Server Actions Needed**:
- `getContracts(firmId, filters)`
- `getContract(contractId)`
- `createContract(firmId, input)`
- `updateContract(contractId, input)`
- `renewContract(contractId, newEndDate)`
- `terminateContract(contractId, reason)`
- `getExpiringContracts(firmId, days)`

### Phase 3: Employee Transfers (Priority 3)

**Files to Create**:
```
src/modules/hr/
├── schemas/transfer-schema.ts
├── actions/transfer-actions.ts
├── components/transfers/
│   ├── transfer-request-form.tsx
│   ├── transfer-approval-list.tsx
│   └── transfer-history.tsx
└── pages/transfers.tsx
```

**Features**:
1. Transfer request form (validates 2-year limit)
2. Approval workflow (destination firm ADMIN)
3. Transfer history timeline
4. Automatic `firstInterimDate` reset

**Server Actions Needed**:
- `requestTransfer(employeeId, toFirmId, data)`
- `approveTransfer(transferId)`
- `rejectTransfer(transferId, reason)`
- `getTransferHistory(employeeId)`

### Phase 4-8: Remaining Modules

Follow the same pattern:
1. Create Zod schema in `schemas/`
2. Create server actions in `actions/`
3. Create UI components in `components/[module]/`
4. Create page in `pages/[module].tsx`
5. Update `config.ts` with new route

## Testing Checklist

Before deploying any phase:

- [ ] Schema migration applied successfully
- [ ] All CRUD operations work
- [ ] Forms validate correctly (client + server)
- [ ] Authorization checks in place
- [ ] Audit logs created for mutations
- [ ] No console errors
- [ ] Responsive design works
- [ ] French language labels correct
- [ ] Loading states implemented
- [ ] Error states handled with toasts
- [ ] Optimistic updates (where appropriate)

## API Routes vs Server Actions

**This module uses Server Actions** instead of API routes for better:
- Type safety
- Performance (no HTTP overhead)
- Simplified error handling
- Built-in React integration

However, you can create API routes if needed for:
- External integrations
- Webhooks
- Non-React clients

## Security Considerations

1. **Always verify firm access**:
   ```typescript
   const userFirm = await db.userFirm.findUnique({
     where: { userId_firmId: { userId, firmId } },
   });
   if (!userFirm) return { success: false, error: 'Access denied' };
   ```

2. **Check role permissions**:
   ```typescript
   if (!['ADMIN', 'OWNER'].includes(userFirm.role)) {
     return { success: false, error: 'Insufficient permissions' };
   }
   ```

3. **Validate all inputs** with Zod schemas

4. **Log all mutations** to `AuditLog`

5. **Use transactions** for multi-step operations:
   ```typescript
   await db.$transaction(async (tx) => {
     await tx.employee.update(/*...*/);
     await tx.contract.create(/*...*/);
     await tx.auditLog.create(/*...*/);
   });
   ```

## Future Enhancements

1. **Advanced Payroll Engine**:
   - Formula builder for complex calculations
   - SMIG/tax rate updates
   - Social security integration

2. **Document Generation**:
   - PDF contracts
   - Payslip PDFs
   - Transfer letters

3. **Notifications**:
   - Email alerts for expiring contracts
   - SMS for leave approvals
   - Dashboard notifications

4. **Reporting & Analytics**:
   - Employee turnover rates
   - Leave statistics
   - Cost per employee reports
   - Client quarterly reports (automated)

5. **Integration**:
   - IPRES (Senegalese social security)
   - Banking for salary deposits
   - Government reporting

## Support

For questions or issues:
1. Check this guide first
2. Review the code in `src/modules/hr/`
3. Check the schema documentation
4. Review existing patterns in employee module

## License

Proprietary - For Senexus Multi use only
