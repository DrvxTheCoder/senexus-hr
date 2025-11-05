import { parse } from 'papaparse';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedEmployeeRow {
  rowNumber: number;
  data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    maritalStatus: string;
    nationality: string;
    cni: string;
    jobTitle: string;
    category: string;
    hireDate: string;
    contractEndDate: string;
  };
  validationErrors: ValidationError[];
  validationStatus: 'valid' | 'warning' | 'error';
}

export interface CSVParseResult {
  rows: ParsedEmployeeRow[];
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
  };
}

/**
 * Parse date string in various formats (M/D/YYYY, D/M/YYYY, YYYY-MM-DD)
 */
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const cleaned = dateStr.trim();

  // Try parsing as MM/DD/YYYY or M/D/YYYY
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [_, part1, part2, year] = slashMatch;
    const num1 = parseInt(part1);
    const num2 = parseInt(part2);

    // If first number > 12, it must be day
    if (num1 > 12) {
      return new Date(parseInt(year), num2 - 1, num1);
    }
    // If second number > 12, first must be month
    if (num2 > 12) {
      return new Date(parseInt(year), num1 - 1, num2);
    }
    // Ambiguous - default to D/M/YYYY for European format
    return new Date(parseInt(year), num2 - 1, num1);
  }

  // Try ISO format
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return null;
}

/**
 * Validate a single employee row
 */
function validateEmployeeRow(data: any, rowNumber: number): ParsedEmployeeRow {
  const errors: ValidationError[] = [];

  // Required field validations
  const firstName = data['PRENOM']?.trim() || '';
  const lastName = data['NOM']?.trim() || '';
  const dateOfBirth =
    data['DATE DE NAISSANCE ']?.trim() ||
    data['DATE DE NAISSANCE']?.trim() ||
    '';
  const placeOfBirth = data['LIEU DE NAISSANCE']?.trim() || '';
  const maritalStatus =
    data['SITUATION  MATRIMONIALE']?.trim() ||
    data['SITUATION MATRIMONIALE']?.trim() ||
    '';
  const nationality = data['NATIONALITE']?.trim() || '';
  const cni = data['CNI']?.trim() || '';
  const jobTitle = data['EMPLOI']?.trim() || '';
  const category = data['CATEGORIE']?.trim() || '';
  const hireDate = data['DATE ENTREE']?.trim() || '';
  const contractEndDate = data['DATE SORTIE']?.trim() || '';

  // Validate required fields
  if (!firstName) {
    errors.push({
      field: 'PRENOM',
      message: 'Le prénom est obligatoire',
      severity: 'error'
    });
  }

  if (!lastName) {
    errors.push({
      field: 'NOM',
      message: 'Le nom est obligatoire',
      severity: 'error'
    });
  }

  if (!hireDate) {
    errors.push({
      field: 'DATE ENTREE',
      message: "La date d'entrée est obligatoire",
      severity: 'error'
    });
  } else {
    const parsedHireDate = parseFlexibleDate(hireDate);
    if (!parsedHireDate) {
      errors.push({
        field: 'DATE ENTREE',
        message: 'Format de date invalide',
        severity: 'error'
      });
    }
  }

  // Validate optional date fields
  if (dateOfBirth) {
    const parsedDOB = parseFlexibleDate(dateOfBirth);
    if (!parsedDOB) {
      errors.push({
        field: 'DATE DE NAISSANCE',
        message: 'Format de date invalide',
        severity: 'error'
      });
    } else {
      // Check if DOB is reasonable (between 16-100 years old)
      const age =
        (new Date().getTime() - parsedDOB.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      if (age < 16 || age > 100) {
        errors.push({
          field: 'DATE DE NAISSANCE',
          message: `Âge inhabituel (${Math.floor(age)} ans)`,
          severity: 'warning'
        });
      }
    }
  }

  if (contractEndDate) {
    const parsedEndDate = parseFlexibleDate(contractEndDate);
    if (!parsedEndDate) {
      errors.push({
        field: 'DATE SORTIE',
        message: 'Format de date invalide',
        severity: 'error'
      });
    }
  }

  // Validate CNI format (basic check)
  if (cni && !cni.match(/^[A-Z0-9]+$/i)) {
    errors.push({
      field: 'CNI',
      message: 'Format CNI inhabituel',
      severity: 'warning'
    });
  }

  // Warnings for missing optional fields
  if (!dateOfBirth) {
    errors.push({
      field: 'DATE DE NAISSANCE',
      message: 'Date de naissance manquante',
      severity: 'warning'
    });
  }

  if (!cni) {
    errors.push({
      field: 'CNI',
      message: 'Numéro CNI manquant',
      severity: 'warning'
    });
  }

  if (!jobTitle) {
    errors.push({
      field: 'EMPLOI',
      message: 'Emploi manquant',
      severity: 'warning'
    });
  }

  // Determine validation status
  const hasErrors = errors.some((e) => e.severity === 'error');
  const hasWarnings = errors.some((e) => e.severity === 'warning');

  let validationStatus: 'valid' | 'warning' | 'error';
  if (hasErrors) {
    validationStatus = 'error';
  } else if (hasWarnings) {
    validationStatus = 'warning';
  } else {
    validationStatus = 'valid';
  }

  return {
    rowNumber,
    data: {
      firstName,
      lastName,
      dateOfBirth,
      placeOfBirth,
      maritalStatus,
      nationality,
      cni,
      jobTitle,
      category,
      hireDate,
      contractEndDate
    },
    validationErrors: errors,
    validationStatus
  };
}

/**
 * Parse and validate employee CSV file
 */
export async function parseEmployeeCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize header spacing
        return header.trim();
      },
      complete: (results) => {
        const rows: ParsedEmployeeRow[] = [];
        let validCount = 0;
        let warningCount = 0;
        let errorCount = 0;

        results.data.forEach((row: any, index: number) => {
          const parsedRow = validateEmployeeRow(row, index + 1);
          rows.push(parsedRow);

          if (parsedRow.validationStatus === 'valid') validCount++;
          else if (parsedRow.validationStatus === 'warning') warningCount++;
          else if (parsedRow.validationStatus === 'error') errorCount++;
        });

        resolve({
          rows,
          summary: {
            total: rows.length,
            valid: validCount,
            warnings: warningCount,
            errors: errorCount
          }
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Convert parsed row to employee creation data
 */
export function rowToEmployeeData(
  row: ParsedEmployeeRow,
  firmId: string,
  clientId?: string
) {
  const hireDateParsed = parseFlexibleDate(row.data.hireDate);
  const dobParsed = parseFlexibleDate(row.data.dateOfBirth);
  const endDateParsed = parseFlexibleDate(row.data.contractEndDate);

  // Generate matricule from name and timestamp
  const matricule = `${row.data.firstName.substring(0, 3).toUpperCase()}${row.data.lastName.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;

  return {
    firmId,
    assignedClientId: clientId,
    firstName: row.data.firstName,
    lastName: row.data.lastName,
    matricule,
    dateOfBirth: dobParsed,
    placeOfBirth: row.data.placeOfBirth || null,
    maritalStatus: row.data.maritalStatus || null,
    nationality: row.data.nationality || null,
    cni: row.data.cni || null,
    jobTitle: row.data.jobTitle || null,
    category: row.data.category || null,
    hireDate: hireDateParsed!,
    contractEndDate: endDateParsed,
    status: 'ACTIVE' as const
  };
}
