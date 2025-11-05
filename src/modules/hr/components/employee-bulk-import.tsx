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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'importation");
      }

      const result = await response.json();
      toast.success(`${result.count} employés importés avec succès`);
      onImportComplete();
      handleClose();
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
      <DialogContent className='h-full max-h-[60vh] w-full max-w-[90vw] md:max-h-[90vh] md:max-w-[70vw]'>
        <DialogHeader>
          <DialogTitle>Importation en masse d&apos;employés</DialogTitle>
          <DialogDescription>
            Importer des employés depuis un fichier CSV
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
              <Upload className='mx-auto h-12 w-12 text-gray-400' />
              <p className='mt-2 text-sm text-gray-600'>
                {isDragActive
                  ? 'Déposez le fichier ici'
                  : 'Glissez-déposez un fichier CSV ou cliquez pour sélectionner'}
              </p>
              <p className='mt-1 text-xs text-gray-500'>
                Format attendu: PRENOM, NOM, DATE DE NAISSANCE, etc.
              </p>
            </div>
          )}

          {/* File Info */}
          {file && !parseResult && (
            <Card>
              <CardContent className='flex items-center justify-between p-4'>
                <div className='flex items-center gap-3'>
                  <FileText className='h-8 w-8 text-blue-600' />
                  <div>
                    <p className='font-medium'>{file.name}</p>
                    <p className='text-sm text-gray-500'>
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
                  <div className='text-sm text-gray-600'>Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-green-600'>
                    {parseResult.summary.valid}
                  </div>
                  <div className='text-sm text-gray-600'>Validés</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {parseResult.summary.warnings}
                  </div>
                  <div className='text-sm text-gray-600'>Avertissements</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-red-600'>
                    {parseResult.summary.errors}
                  </div>
                  <div className='text-sm text-gray-600'>Erreurs</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview Table */}
          {parseResult && (
            <div className='overflow-hidden rounded-lg border'>
              <div className='max-h-[400px] overflow-x-auto'>
                <Table>
                  <TableHeader className='sticky top-0 z-10 bg-white'>
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
                      <TableHead className='min-w-[100px]'>CNI</TableHead>
                      <TableHead className='min-w-[150px]'>Emploi</TableHead>
                      <TableHead className='min-w-[100px]'>
                        Date entrée
                      </TableHead>
                      <TableHead className='min-w-[200px]'>
                        Validation
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row) => (
                      <TableRow
                        key={row.rowNumber}
                        className={
                          row.validationStatus === 'error'
                            ? 'bg-red-50'
                            : row.validationStatus === 'warning'
                              ? 'bg-orange-50'
                              : ''
                        }
                      >
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
                            <div className='flex flex-wrap gap-1'>
                              {row.validationErrors
                                .slice(0, 2)
                                .map((err, idx) => (
                                  <Badge
                                    key={idx}
                                    variant={
                                      err.severity === 'error'
                                        ? 'destructive'
                                        : 'outline'
                                    }
                                    className='text-xs'
                                  >
                                    {err.field}
                                  </Badge>
                                ))}
                              {row.validationErrors.length > 2 && (
                                <Badge variant='outline' className='text-xs'>
                                  +{row.validationErrors.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className='text-xs text-green-600'>✓ OK</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between border-t bg-gray-50 p-3'>
                  <div className='text-sm text-gray-600'>
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
