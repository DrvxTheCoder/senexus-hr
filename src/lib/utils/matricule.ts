import { prisma } from '@/core/db/client';

/**
 * Generates the next matricule for a firm in the format CI0001, CI0002, etc.
 * @param firmId - The ID of the firm
 * @param prefix - The prefix for the matricule (default: 'CI')
 * @returns The next available matricule
 */
export async function generateNextMatricule(
  firmId: string,
  prefix: string = 'CI'
): Promise<string> {
  // Get all employees for this firm, ordered by matricule descending
  const employees = await prisma.employee.findMany({
    where: {
      firmId,
      matricule: {
        startsWith: prefix
      }
    },
    select: {
      matricule: true
    },
    orderBy: {
      matricule: 'desc'
    },
    take: 1
  });

  // If no employees exist, start with 0001
  if (employees.length === 0) {
    return `${prefix}0001`;
  }

  // Extract the numeric part from the last matricule
  const lastMatricule = employees[0].matricule;
  const numericPart = lastMatricule.replace(prefix, '');
  const nextNumber = parseInt(numericPart, 10) + 1;

  // Format the new number with leading zeros (4 digits)
  const formattedNumber = nextNumber.toString().padStart(4, '0');

  // Check if we've exceeded the maximum (9999)
  if (nextNumber > 9999) {
    throw new Error(
      `Maximum matricule number reached for prefix ${prefix}. Please use a different prefix.`
    );
  }

  return `${prefix}${formattedNumber}`;
}

/**
 * Validates if a matricule format is correct
 * @param matricule - The matricule to validate
 * @param prefix - The expected prefix (default: 'CI')
 * @returns True if valid, false otherwise
 */
export function isValidMatricule(
  matricule: string,
  prefix: string = 'CI'
): boolean {
  const regex = new RegExp(`^${prefix}\\d{4}$`);
  return regex.test(matricule);
}
