# Notification System Design

## Overview
This document outlines the design for a flexible, extensible notification system that will support various use cases across the application, starting with employee transfer workflows.

## Requirements

### Immediate Use Cases (Employee Transfers)
1. **Transfer Request Created** - Notify destination firm managers/owners/admins
2. **Transfer Approved** - Notify source firm owners/admins and the requester
3. **Transfer Rejected** - Notify requester with rejection reason
4. **Transfer Completed** - Notify both firms' owners/admins

### Future Use Cases
- Contract expiration warnings
- Leave request approvals
- Document verification requests
- Payroll processing status
- System-wide announcements
- Task assignments
- Compliance alerts

## Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String   // Recipient
  firmId    String?  // Optional: firm context
  type      NotificationType
  title     String
  message   String
  data      Json?    // Flexible data for different notification types
  read      Boolean  @default(false)
  readAt    DateTime?
  link      String?  // Optional: where to redirect when clicked
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  firm Firm? @relation(fields: [firmId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([firmId])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  TRANSFER_REQUEST
  TRANSFER_APPROVED
  TRANSFER_REJECTED
  TRANSFER_COMPLETED
  CONTRACT_EXPIRING
  CONTRACT_RENEWED
  CONTRACT_TERMINATED
  LEAVE_REQUEST
  LEAVE_APPROVED
  LEAVE_REJECTED
  DOCUMENT_REQUIRES_VERIFICATION
  PAYROLL_PROCESSED
  SYSTEM_ANNOUNCEMENT
  TASK_ASSIGNED
  COMPLIANCE_ALERT
}
```

## API Endpoints

### Core Notification Endpoints
- `GET /api/notifications` - List user's notifications (with pagination, filters)
- `GET /api/notifications/unread-count` - Get count of unread notifications
- `PATCH /api/notifications/:id/read` - Mark single notification as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Firm-wide Notifications (Admin)
- `POST /api/firms/:id/notifications/broadcast` - Send to all firm members
- `POST /api/firms/:id/notifications/role-based` - Send to specific roles

## Notification Service Structure

```typescript
// src/lib/services/notification.service.ts

interface CreateNotificationParams {
  userId: string;
  firmId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  link?: string;
}

class NotificationService {
  // Create single notification
  async create(params: CreateNotificationParams): Promise<Notification>

  // Create multiple notifications (bulk)
  async createMany(notifications: CreateNotificationParams[]): Promise<void>

  // Get recipients for specific events
  async getTransferApprovers(firmId: string): Promise<string[]>
  async getFirmAdminsOwners(firmId: string): Promise<string[]>
  async getFirmRoleMembers(firmId: string, roles: string[]): Promise<string[]>

  // Mark as read
  async markAsRead(notificationId: string, userId: string): Promise<void>
  async markAllAsRead(userId: string): Promise<void>

  // Cleanup old notifications
  async deleteOlderThan(days: number): Promise<number>
}
```

## Integration Points

### Transfer Workflow Integration

#### 1. Transfer Request Created
```typescript
// In POST /api/firms/:id/transfers

// After creating transfer
const approvers = await notificationService.getFirmAdminsOwners(toFirmId);
await notificationService.createMany(
  approvers.map(userId => ({
    userId,
    firmId: toFirmId,
    type: 'TRANSFER_REQUEST',
    title: 'New Employee Transfer Request',
    message: `Transfer request for ${employee.firstName} ${employee.lastName} from ${fromFirm.name}`,
    data: { transferId: transfer.id, employeeId: employee.id },
    link: `/${toFirmSlug}/hr/transfers?id=${transfer.id}`
  }))
);
```

#### 2. Transfer Approved
```typescript
// In POST /api/firms/:id/transfers/:transferId/approve

await notificationService.createMany([
  // Notify requester
  {
    userId: transfer.requestedBy,
    firmId: transfer.fromFirmId,
    type: 'TRANSFER_APPROVED',
    title: 'Transfer Request Approved',
    message: `Transfer of ${employee.firstName} ${employee.lastName} has been approved`,
    data: { transferId: transfer.id },
    link: `/${fromFirmSlug}/hr/transfers?id=${transfer.id}`
  },
  // Notify source firm admins
  ...sourceAdmins.map(userId => ({
    userId,
    firmId: transfer.fromFirmId,
    type: 'TRANSFER_APPROVED',
    title: 'Employee Transfer Approved',
    message: `Transfer of ${employee.firstName} ${employee.lastName} to ${toFirm.name} approved`,
    data: { transferId: transfer.id },
    link: `/${fromFirmSlug}/hr/transfers?id=${transfer.id}`
  }))
]);
```

#### 3. Transfer Completed
```typescript
// In POST /api/firms/:id/transfers/:transferId/complete

const bothFirmAdmins = [
  ...(await notificationService.getFirmAdminsOwners(transfer.fromFirmId)),
  ...(await notificationService.getFirmAdminsOwners(transfer.toFirmId))
];

await notificationService.createMany(
  bothFirmAdmins.map(userId => ({
    userId,
    type: 'TRANSFER_COMPLETED',
    title: 'Employee Transfer Completed',
    message: `${employee.firstName} ${employee.lastName} transfer completed`,
    data: { transferId: transfer.id },
    link: `/${firmSlug}/hr/employees/${employee.id}`
  }))
);
```

## UI Components

### NotificationBell Component
- Badge with unread count
- Dropdown with recent notifications
- "Mark all as read" button
- Link to full notifications page

### NotificationsList Component
- Paginated list
- Filter by type/read status
- Clickable items that navigate to relevant page
- Bulk actions (mark all read, delete)

### Real-time Updates (Future)
- WebSocket or Server-Sent Events for live notifications
- Toast notifications for high-priority alerts
- Browser push notifications (with permission)

## Implementation Phases

### Phase 1: Core Infrastructure (Now)
- Create Prisma schema
- Implement NotificationService
- Create basic API endpoints
- Add to transfer workflow

### Phase 2: UI Components (Next)
- NotificationBell header component
- NotificationsList page
- Toast notifications for transfers

### Phase 3: Additional Workflows
- Contract notifications
- Leave request notifications
- Document verification notifications

### Phase 4: Real-time & Advanced
- WebSocket integration
- Browser push notifications
- Email notifications (optional)
- Notification preferences/settings

## Notes

- Keep notification data flexible with JSON field
- Use indexes for performance (userId + read status)
- Implement cleanup job for old notifications (>90 days)
- Consider notification preferences per user
- Support for notification templates
- Ensure GDPR compliance (user data deletion)
