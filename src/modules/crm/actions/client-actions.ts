'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput
} from '../schemas/client-schema';

type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all clients for a firm
 */
export async function getClients(
  firmId: string,
  filters?: {
    status?: string;
    search?: string;
  }
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Verify user has access to this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm) {
      return { success: false, error: 'Accès refusé à cette organisation' };
    }

    const where: any = { firmId };

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
        { taxNumber: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const clients = await db.client.findMany({
      where,
      include: {
        _count: {
          select: {
            assignedEmployees: true,
            contracts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: clients };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération des clients'
    };
  }
}

/**
 * Get a single client by ID
 */
export async function getClient(clientId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        firm: true,
        assignedEmployees: {
          include: {
            department: true
          }
        },
        contracts: {
          include: {
            employee: true
          },
          orderBy: { startDate: 'desc' }
        },
        firmAssignments: {
          include: {
            firm: true
          }
        }
      }
    });

    if (!client) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Verify user has access to this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: client.firmId
        }
      }
    });

    if (!userFirm) {
      return { success: false, error: 'Accès refusé' };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error('Error fetching client:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération du client'
    };
  }
}

/**
 * Create a new client
 */
export async function createClient(
  firmId: string,
  input: CreateClientInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Verify user has ADMIN or MANAGER role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['ADMIN', 'OWNER', 'MANAGER'].includes(userFirm.role)) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    // Validate input
    const validatedData = createClientSchema.parse(input);

    // Create client
    const client = await db.client.create({
      data: {
        ...validatedData,
        firmId,
        contractStartDate: validatedData.contractStartDate
          ? new Date(validatedData.contractStartDate)
          : null,
        contractEndDate: validatedData.contractEndDate
          ? new Date(validatedData.contractEndDate)
          : null
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'CLIENT',
        entityId: client.id,
        metadata: {
          clientName: client.name
        }
      }
    });

    revalidatePath(`/${firmId}/crm/clients`);

    return { success: true, data: client };
  } catch (error: any) {
    console.error('Error creating client:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création du client'
    };
  }
}

/**
 * Update an existing client
 */
export async function updateClient(
  clientId: string,
  input: UpdateClientInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Get client to verify access
    const existingClient = await db.client.findUnique({
      where: { id: clientId }
    });

    if (!existingClient) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Verify user has ADMIN or MANAGER role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: existingClient.firmId
        }
      }
    });

    if (!userFirm || !['ADMIN', 'OWNER', 'MANAGER'].includes(userFirm.role)) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    // Validate input
    const validatedData = updateClientSchema.parse(input);

    // Prepare update data
    const updateData: any = { ...validatedData };

    if (validatedData.contractStartDate) {
      updateData.contractStartDate = new Date(validatedData.contractStartDate);
    }
    if (validatedData.contractEndDate) {
      updateData.contractEndDate = new Date(validatedData.contractEndDate);
    }

    // Update client
    const client = await db.client.update({
      where: { id: clientId },
      data: updateData
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId: existingClient.firmId,
        actorId: session.user.id,
        action: 'UPDATE',
        entity: 'CLIENT',
        entityId: client.id,
        metadata: {
          clientName: client.name,
          changes: validatedData
        }
      }
    });

    revalidatePath(`/${existingClient.firmId}/crm/clients`);
    revalidatePath(`/${existingClient.firmId}/crm/clients/${clientId}`);

    return { success: true, data: client };
  } catch (error: any) {
    console.error('Error updating client:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du client'
    };
  }
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Get client to verify access
    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        assignedEmployees: true,
        contracts: true
      }
    });

    if (!client) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Verify user has ADMIN or OWNER role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: client.firmId
        }
      }
    });

    if (!userFirm || !['ADMIN', 'OWNER'].includes(userFirm.role)) {
      return {
        success: false,
        error:
          'Permissions insuffisantes. Seuls les ADMINs peuvent supprimer des clients.'
      };
    }

    // Check if client has assigned employees
    if (client.assignedEmployees.length > 0) {
      return {
        success: false,
        error: `Impossible de supprimer un client avec ${client.assignedEmployees.length} employé(s) assigné(s). Veuillez d'abord les réassigner.`
      };
    }

    // Instead of deleting, mark as ARCHIVED (soft delete)
    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: { status: 'ARCHIVED' }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId: client.firmId,
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'CLIENT',
        entityId: client.id,
        metadata: {
          clientName: client.name
        }
      }
    });

    revalidatePath(`/${client.firmId}/crm/clients`);

    return {
      success: true,
      data: updatedClient
    };
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression du client'
    };
  }
}
