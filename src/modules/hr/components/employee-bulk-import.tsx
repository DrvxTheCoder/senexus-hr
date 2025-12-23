'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X
} from 'lucide-react';
import {
  parseEmployeeCSV,
  rowToEmployeeData,
  type ParsedEmployeeRow,
  type CSVParseResult
} from '@/lib/csv-parser';
import { toast } from 'sonner';

interface EmployeeBulkImportProps {
  isOpen: boolean;
  onClose: () => void;
  firmId: string;
  clients: Array<{ id: string; name: string }>;
  onImportComplete: () => void;
}

export function EmployeeBulkImport({
  isOpen,
  onClose,
  firmId,
  clients,
  onImportComplete
}: EmployeeBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const rowsPerPage = 10;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    if (!csvFile.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    setFile(csvFile);
    toast.info('Analyse du fichier en cours...');

    try {
      const result = await parseEmployeeCSV(csvFile);
      setParseResult(result);
      // Select all valid and warning rows by default
      const autoSelect = new Set<number>();
      result.rows.forEach((row) => {
        if (row.validationStatus !== 'error') {
          autoSelect.add(row.rowNumber);
        }
      });
      setSelectedRows(autoSelect);
      toast.success(`${result.summary.total} lignes analysées`);
    } catch (error) {
      toast.error("Erreur lors de l'analyse du fichier");
      console.error(error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleSelectAll = (checked: boolean) => {
    if (!parseResult) return;

    if (checked) {
      const allValid = new Set<number>();
      parseResult.rows.forEach((row) => {
        if (row.validationStatus !== 'error') {
          allValid.add(row.rowNumber);
        }
      });
      setSelectedRows(allValid);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowNumber: number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowNumber);
    } else {
      newSelection.delete(rowNumber);
    }
    setSelectedRows(newSelection);
  };

  const handleImportValid = async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter(
      (row) => row.validationStatus !== 'error'
    );
    await performImport(validRows);
  };

  const handleImportSelected = async () => {
    if (!parseResult) return;

    const rowsToImport = parseResult.rows.filter((row) =>
      selectedRows.has(row.rowNumber)
    );
    await performImport(rowsToImport);
  };

  const performImport = async (rows: ParsedEmployeeRow[]) => {
    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    setIsImporting(true);
    try {
      const employeesData = rows.map((row) =>
        rowToEmployeeData(row, firmId, selectedClientId)
      );

      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmId,
          clientId: selectedClientId,
          employees: employeesData
        })
      });

      const result = await response.json();

      // Handle different response statuses
      if (response.status === 200) {
        // Complete success
        toast.success(
          `✓ ${result.count} employé(s) et contrat(s) importés avec succès`
        );
        onImportComplete();
        handleClose();
      } else if (response.status === 207 || response.status === 400) {
        // Partial success (207) or complete failure (400)
        const isPartial = response.status === 207;

        if (isPartial) {
          toast.warning(
            result.message ||
              `${result.count} importé(s), ${result.errors.length} erreur(s)`
          );
        } else {
          toast.error(
            result.message ||
              `Échec de l'importation: ${result.errors?.length || 0} erreur(s)`
          );
        }

        // Show detailed errors for both partial and complete failures
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors
            .slice(0, 3)
            .map(
              (err: any) =>
                `Ligne ${err.rowNumber} (${err.employeeName}): ${err.message}`
            )
            .join('\n');

          toast.error(
            `Erreurs d'importation:\n${errorMessages}${result.errors.length > 3 ? `\n... et ${result.errors.length - 3} autre(s)` : ''}`,
            { duration: 8000 }
          );
        }

        // If some succeeded, refresh the list
        if (result.count > 0) {
          onImportComplete();
        }
      } else {
        // Other failures (500, etc.)
        const errorMsg =
          result.message || result.error || "Erreur lors de l'importation";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'importation");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setSelectedClientId('');
    setSelectedRows(new Set());
    setCurrentPage(1);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className='h-4 w-4 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-orange-600' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-600' />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Validé';
      case 'warning':
        return 'Avertissement';
      case 'error':
        return 'Erreur';
    }
  };

  const paginatedRows = parseResult
    ? parseResult.rows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      )
    : [];

  const totalPages = parseResult
    ? Math.ceil(parseResult.rows.length / rowsPerPage)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='h-fit max-h-[60vh] w-full max-w-[90vw] md:max-h-[90vh] md:max-w-[70vw]'>
        <DialogHeader>
          <DialogTitle>Importer des employés</DialogTitle>
          <DialogDescription>
            Téléverser depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>

        <div className='h-full flex-1 space-y-4 overflow-y-auto'>
          {/* File Upload */}
          {!file && (
            <div
              {...getRootProps()}
              className={`h-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50 border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className='text-muted-foreground mx-auto h-12 w-12' />
              <p className='mt-2 text-sm'>
                {isDragActive
                  ? 'Déposez le fichier ici'
                  : 'Glissez-déposez un fichier CSV ou cliquez pour sélectionner'}
              </p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Format attendu: PRENOM, NOM, DATE DE NAISSANCE, etc.
              </p>
            </div>
          )}

          {/* File Info */}
          {file && !parseResult && (
            <Card>
              <CardContent className='flex items-center justify-between p-4'>
                <div className='flex items-center gap-3'>
                  <FileText className='h-8 w-8' />
                  <div>
                    <p className='font-medium'>{file.name}</p>
                    <p className='text-muted-foreground text-sm'>
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant='ghost' size='sm' onClick={() => setFile(null)}>
                  <X className='h-4 w-4' />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Client Selection */}
          {parseResult && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Client pour l&apos;affectation *
              </label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sélectionner un client' />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary */}
          {parseResult && (
            <div className='grid grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold'>
                    {parseResult.summary.total}
                  </div>
                  <div className='text-muted-foreground text-sm'>Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-green-600' />
                    <div className='text-2xl font-bold'>
                      {parseResult.summary.valid}
                    </div>
                  </div>
                  <div className='text-muted-foreground text-sm'>Validés</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-orange-600' />
                    <div className='text-2xl font-bold'>
                      {parseResult.summary.warnings}
                    </div>
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    Avertissements
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2'>
                    <XCircle className='h-5 w-5 text-red-600' />
                    <div className='text-2xl font-bold'>
                      {parseResult.summary.errors}
                    </div>
                  </div>
                  <div className='text-muted-foreground text-sm'>Erreurs</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview Table */}
          {parseResult && (
            <div className='overflow-hidden rounded-lg border'>
              <div className='max-h-[400px] overflow-x-auto'>
                <Table>
                  <TableHeader className='sticky top-0 z-10'>
                    <TableRow>
                      <TableHead className='w-12'>
                        <Checkbox
                          checked={selectedRows.size > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className='w-12'>#</TableHead>
                      <TableHead className='w-16'>St.</TableHead>
                      <TableHead className='min-w-[120px]'>Prénom</TableHead>
                      <TableHead className='min-w-[120px]'>Nom</TableHead>
                      <TableHead className='min-w-[100px]'>
                        Type Contrat
                      </TableHead>
                      <TableHead className='min-w-[100px]'>CNI</TableHead>
                      <TableHead className='min-w-[150px]'>Emploi</TableHead>
                      <TableHead className='min-w-[100px]'>
                        Date entrée
                      </TableHead>
                      <TableHead className='min-w-[250px]'>
                        Validation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(row.rowNumber)}
                            onCheckedChange={(checked) =>
                              handleSelectRow(row.rowNumber, checked as boolean)
                            }
                            disabled={row.validationStatus === 'error'}
                          />
                        </TableCell>
                        <TableCell className='font-mono text-sm'>
                          {row.rowNumber}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            {getStatusIcon(row.validationStatus)}
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          {row.data.firstName}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {row.data.lastName}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {row.data.contractType || '-'}
                        </TableCell>
                        <TableCell className='font-mono text-xs'>
                          {row.data.cni || '-'}
                        </TableCell>
                        <TableCell
                          className='max-w-[150px] truncate text-sm'
                          title={row.data.jobTitle}
                        >
                          {row.data.jobTitle || '-'}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {row.data.hireDate}
                        </TableCell>
                        <TableCell>
                          {row.validationErrors.length > 0 ? (
                            <div className='space-y-1'>
                              {row.validationErrors
                                .slice(0, 3)
                                .map((err, idx) => (
                                  <div
                                    key={idx}
                                    className='flex items-start gap-1'
                                    title={err.suggestedFix}
                                  >
                                    <Badge
                                      variant={
                                        err.severity === 'error'
                                          ? 'destructive'
                                          : 'outline'
                                      }
                                      className='text-xs'
                                    >
                                      {err.field}
                                    </Badge>
                                    <span className='text-muted-foreground line-clamp-1 text-xs'>
                                      {err.message}
                                    </span>
                                  </div>
                                ))}
                              {row.validationErrors.length > 3 && (
                                <Badge variant='outline' className='text-xs'>
                                  +{row.validationErrors.length - 3} autre(s)
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className='text-xs text-green-600'>
                              ✓ Validé
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between border-t p-3'>
                  <div className='text-sm'>
                    Page {currentPage} sur {totalPages} •{' '}
                    {parseResult.rows.length} lignes
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className='flex-shrink-0'>
          <div className='flex w-full items-center justify-between gap-2'>
            <Button variant='outline' onClick={handleClose}>
              Annuler
            </Button>
            {parseResult && (
              <div className='flex gap-2'>
                <Button
                  variant='secondary'
                  onClick={handleImportValid}
                  disabled={
                    !selectedClientId ||
                    parseResult.summary.valid === 0 ||
                    isImporting
                  }
                >
                  Valides ({parseResult.summary.valid})
                </Button>
                <Button
                  variant='default'
                  onClick={handleImportSelected}
                  disabled={
                    !selectedClientId || selectedRows.size === 0 || isImporting
                  }
                >
                  Sélectionnés ({selectedRows.size})
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
