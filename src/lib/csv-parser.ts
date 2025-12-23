import { parse } from 'papaparse';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestedFix?: string;
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
    contractType: string;
    position: string;
    salary: string;
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
  requiredColumns: string[];
  optionalColumns: string[];
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
    const [, part1, part2, year] = slashMatch;
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
 * Normalize marital status
 */
function normalizeMaritalStatus(status: string): string | null {
  if (!status) return null;

  const normalized = status.trim().toUpperCase();

  // Map common variations
  const statusMap: Record<string, string> = {
    CELIBATAIRE: 'CELIBATAIRE',
    CELIBAT: 'CELIBATAIRE',
    SINGLE: 'CELIBATAIRE',
    MARIE: 'MARIE',
    MARIEE: 'MARIE',
    MARRIED: 'MARIE',
    VEUF: 'VEUF',
    VEUVE: 'VEUF',
    WIDOW: 'VEUF',
    DIVORCE: 'DIVORCE',
    DIVORCED: 'DIVORCE'
  };

  return statusMap[normalized] || status;
}

/**
 * Normalize contract type
 */
function normalizeContractType(type: string): string | null {
  if (!type) return null;

  const normalized = type.trim().toUpperCase();

  // Map common variations to valid contract types
  const typeMap: Record<string, string> = {
    CDI: 'CDI',
    CDD: 'CDD',
    INTERIM: 'INTERIM',
    INTERIMAIRE: 'INTERIM',
    STAGE: 'STAGE',
    PRESTATION: 'PRESTATION',
    CONSULTANT: 'PRESTATION'
  };

  return typeMap[normalized] || null;
}

/**
 * Validate a single employee row with contract requirements
 */
function validateEmployeeRow(data: any, rowNumber: number): ParsedEmployeeRow {
  const errors: ValidationError[] = [];

  // Extract all fields with trim
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
  const contractType =
    data['TYPE CONTRAT']?.trim() || data['CONTRAT']?.trim() || '';
  const position = data['POSTE']?.trim() || data['EMPLOI']?.trim() || '';
  const salary = data['SALAIRE']?.trim() || '';

  // === REQUIRED FIELDS FOR EMPLOYEE ===
  if (!firstName) {
    errors.push({
      field: 'PRENOM',
      message: 'Le prénom est obligatoire',
      severity: 'error',
      suggestedFix: "Ajoutez le prénom de l'employé"
    });
  }

  if (!lastName) {
    errors.push({
      field: 'NOM',
      message: 'Le nom est obligatoire',
      severity: 'error',
      suggestedFix: "Ajoutez le nom de famille de l'employé"
    });
  }

  if (!hireDate) {
    errors.push({
      field: 'DATE ENTREE',
      message: "La date d'entrée est obligatoire",
      severity: 'error',
      suggestedFix: "Ajoutez la date d'embauche (format: JJ/MM/AAAA)"
    });
  } else {
    const parsedHireDate = parseFlexibleDate(hireDate);
    if (!parsedHireDate) {
      errors.push({
        field: 'DATE ENTREE',
        message: 'Format de date invalide',
        severity: 'error',
        suggestedFix: 'Utilisez le format JJ/MM/AAAA (ex: 15/01/2024)'
      });
    } else if (parsedHireDate > new Date()) {
      errors.push({
        field: 'DATE ENTREE',
        message: "La date d'entrée ne peut pas être dans le futur",
        severity: 'error',
        suggestedFix: 'Vérifiez que la date est correcte'
      });
    }
  }

  // === REQUIRED FIELDS FOR CONTRACT ===
  if (!contractType) {
    errors.push({
      field: 'TYPE CONTRAT',
      message: 'Le type de contrat est obligatoire',
      severity: 'error',
      suggestedFix:
        'Ajoutez le type de contrat (CDI, CDD, INTERIM, STAGE, PRESTATION)'
    });
  } else {
    const normalizedType = normalizeContractType(contractType);
    if (!normalizedType) {
      errors.push({
        field: 'TYPE CONTRAT',
        message: 'Type de contrat invalide',
        severity: 'error',
        suggestedFix: 'Utilisez: CDI, CDD, INTERIM, STAGE ou PRESTATION'
      });
    }
  }

  // Validate contract end date for CDD and INTERIM
  const normalizedType = normalizeContractType(contractType);
  if (normalizedType === 'CDD' || normalizedType === 'INTERIM') {
    if (!contractEndDate) {
      errors.push({
        field: 'DATE SORTIE',
        message: `La date de fin est obligatoire pour un contrat ${normalizedType}`,
        severity: 'error',
        suggestedFix: 'Ajoutez la date de fin du contrat (format: JJ/MM/AAAA)'
      });
    } else {
      const parsedEndDate = parseFlexibleDate(contractEndDate);
      if (!parsedEndDate) {
        errors.push({
          field: 'DATE SORTIE',
          message: 'Format de date invalide',
          severity: 'error',
          suggestedFix: 'Utilisez le format JJ/MM/AAAA (ex: 31/12/2024)'
        });
      } else {
        const parsedHireDate = parseFlexibleDate(hireDate);
        if (parsedHireDate && parsedEndDate <= parsedHireDate) {
          errors.push({
            field: 'DATE SORTIE',
            message: "La date de fin doit être après la date d'entrée",
            severity: 'error',
            suggestedFix: 'Vérifiez que les dates sont cohérentes'
          });
        }
      }
    }
  }

  // === IMPORTANT OPTIONAL FIELDS ===
  // Validate optional date fields
  if (dateOfBirth) {
    const parsedDOB = parseFlexibleDate(dateOfBirth);
    if (!parsedDOB) {
      errors.push({
        field: 'DATE DE NAISSANCE',
        message: 'Format de date invalide',
        severity: 'error',
        suggestedFix: 'Utilisez le format JJ/MM/AAAA (ex: 15/03/1990)'
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
          severity: 'warning',
          suggestedFix: 'Vérifiez que la date de naissance est correcte'
        });
      }
    }
  } else {
    errors.push({
      field: 'DATE DE NAISSANCE',
      message: 'Date de naissance recommandée',
      severity: 'warning',
      suggestedFix: 'Ajoutez la date de naissance pour un dossier complet'
    });
  }

  if (contractEndDate && contractEndDate.trim()) {
    const parsedEndDate = parseFlexibleDate(contractEndDate);
    if (!parsedEndDate) {
      errors.push({
        field: 'DATE SORTIE',
        message: 'Format de date invalide',
        severity: 'error',
        suggestedFix: 'Utilisez le format JJ/MM/AAAA ou laissez vide'
      });
    }
  }

  // Validate CNI format (basic check)
  if (cni && cni.length < 5) {
    errors.push({
      field: 'CNI',
      message: 'Numéro CNI trop court',
      severity: 'warning',
      suggestedFix: 'Vérifiez que le numéro CNI est complet'
    });
  }

  // Validate marital status
  if (maritalStatus) {
    const normalized = normalizeMaritalStatus(maritalStatus);
    if (
      normalized &&
      !['CELIBATAIRE', 'MARIE', 'VEUF', 'DIVORCE'].includes(normalized)
    ) {
      errors.push({
        field: 'SITUATION MATRIMONIALE',
        message: 'Valeur inhabituelle',
        severity: 'warning',
        suggestedFix: 'Utilisez: CELIBATAIRE, MARIE, VEUF ou DIVORCE'
      });
    }
  }

  // Validate salary
  if (salary) {
    const salaryNum = parseFloat(salary.replace(/[^\d.]/g, ''));
    if (isNaN(salaryNum) || salaryNum < 0) {
      errors.push({
        field: 'SALAIRE',
        message: 'Format de salaire invalide',
        severity: 'warning',
        suggestedFix: 'Entrez un nombre valide (ex: 150000)'
      });
    }
  }

  // === WARNINGS FOR MISSING OPTIONAL FIELDS ===
  if (!cni) {
    errors.push({
      field: 'CNI',
      message: 'Numéro CNI manquant',
      severity: 'warning',
      suggestedFix: 'Ajoutez le numéro CNI pour un dossier complet'
    });
  }

  if (!jobTitle && !position) {
    errors.push({
      field: 'EMPLOI/POSTE',
      message: 'Emploi ou poste manquant',
      severity: 'warning',
      suggestedFix: "Ajoutez l'intitulé du poste"
    });
  }

  if (!nationality) {
    errors.push({
      field: 'NATIONALITE',
      message: 'Nationalité manquante',
      severity: 'warning',
      suggestedFix: "Ajoutez la nationalité de l'employé"
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
      contractEndDate,
      contractType,
      position,
      salary
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
          },
          requiredColumns: ['PRENOM', 'NOM', 'DATE ENTREE', 'TYPE CONTRAT'],
          optionalColumns: [
            'DATE DE NAISSANCE',
            'LIEU DE NAISSANCE',
            'SITUATION MATRIMONIALE',
            'NATIONALITE',
            'CNI',
            'EMPLOI',
            'POSTE',
            'CATEGORIE',
            'DATE SORTIE',
            'SALAIRE'
          ]
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
 * Note: Matricule will be generated server-side
 */
export function rowToEmployeeData(
  row: ParsedEmployeeRow,
  firmId: string,
  clientId?: string
) {
  const hireDateParsed = parseFlexibleDate(row.data.hireDate);
  const dobParsed = parseFlexibleDate(row.data.dateOfBirth);
  const endDateParsed = parseFlexibleDate(row.data.contractEndDate);

  const normalizedMaritalStatus = normalizeMaritalStatus(
    row.data.maritalStatus
  );
  const normalizedContractType = normalizeContractType(row.data.contractType);

  // Parse salary
  let salaryNum: number | null = null;
  if (row.data.salary) {
    const parsed = parseFloat(row.data.salary.replace(/[^\d.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      salaryNum = parsed;
    }
  }

  return {
    // Employee data
    firmId,
    assignedClientId: clientId,
    firstName: row.data.firstName,
    lastName: row.data.lastName,
    dateOfBirth: dobParsed,
    placeOfBirth: row.data.placeOfBirth || null,
    maritalStatus: normalizedMaritalStatus,
    nationality: row.data.nationality || null,
    cni: row.data.cni || null,
    jobTitle: row.data.jobTitle || row.data.position || null,
    category: row.data.category || null,
    hireDate: hireDateParsed!,
    contractEndDate: endDateParsed,
    status: 'ACTIVE' as const,

    // Contract data
    contract: {
      type: normalizedContractType!,
      startDate: hireDateParsed!,
      endDate: endDateParsed,
      position: row.data.position || row.data.jobTitle || null,
      salary: salaryNum
    }
  };
}
