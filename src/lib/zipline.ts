/**
 * Zipline Upload Utility with Folder Support
 * Handles file uploads to Zipline instance with folder organization
 */

export interface ZiplineFileObject {
  id: string;
  type: string;
  url: string;
}

export interface ZiplineUploadResponse {
  files: (string | ZiplineFileObject)[];
  expiresAt: string | null;
}

export interface ZiplineUploadOptions {
  maxFileSize?: number; // in bytes, default 2MB
  allowedTypes?: string[]; // mime types
  compressionPercent?: number; // 0-100
  folder?: string; // Optional folder path (e.g., "employees/EMP001/documents")
  filename?: string; // Optional custom filename
}

const ZIPLINE_URL =
  process.env.ZIPLINE_URL || process.env.NEXT_PUBLIC_ZIPLINE_URL;
const ZIPLINE_TOKEN =
  process.env.ZIPLINE_TOKEN || process.env.NEXT_PUBLIC_ZIPLINE_TOKEN;

/**
 * Upload a file to Zipline with folder support
 * @param file - The file to upload
 * @param options - Upload options
 * @returns The URL of the uploaded file
 */
export async function uploadToZipline(
  file: File,
  options: ZiplineUploadOptions = {}
): Promise<string> {
  if (!ZIPLINE_URL || !ZIPLINE_TOKEN) {
    throw new Error(
      'Zipline configuration is missing. Please set ZIPLINE_URL and ZIPLINE_TOKEN in your environment variables.'
    );
  }

  const {
    maxFileSize = 2 * 1024 * 1024, // 2MB default for documents
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    compressionPercent = 80,
    folder,
    filename
  } = options;

  // Validate file size
  if (file.size > maxFileSize) {
    throw new Error(
      `File size exceeds maximum allowed size of ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB`
    );
  }

  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(
      `File type ${file.type} is not allowed. Allowed types: PDF and Images only.`
    );
  }

  // Create FormData
  const formData = new FormData();

  // Add folder to the filename if provided
  // Zipline supports folder structure via file paths
  let finalFilename = filename || file.name;
  if (folder) {
    // Sanitize folder name
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_/]/g, '_');
    finalFilename = `${sanitizedFolder}/${finalFilename}`;
  }

  // Create a new File object with the folder path in the name
  const fileWithPath = new File([file], finalFilename, { type: file.type });
  formData.append('file', fileWithPath);

  // Add compression if it's an image
  if (file.type.startsWith('image/') && compressionPercent < 100) {
    formData.append('compression_percent', compressionPercent.toString());
  }

  try {
    const response = await fetch(`${ZIPLINE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: ZIPLINE_TOKEN
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Upload failed with status: ${response.status}`
      );
    }

    const data: ZiplineUploadResponse = await response.json();

    // Zipline returns an array of file URLs
    if (!data.files || data.files.length === 0) {
      throw new Error('No file URL returned from Zipline');
    }

    // Return the first file URL - extract URL string if it's an object
    const firstFile = data.files[0];
    return typeof firstFile === 'string' ? firstFile : firstFile.url;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload file to Zipline');
  }
}

/**
 * Upload multiple files to Zipline
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Array of uploaded file URLs
 */
export async function uploadMultipleToZipline(
  files: File[],
  options: ZiplineUploadOptions = {}
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadToZipline(file, options));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Zipline
 * @param fileUrl - The URL of the file to delete
 * @returns Promise that resolves when file is deleted
 */
export async function deleteFromZipline(fileUrl: string): Promise<void> {
  if (!ZIPLINE_URL || !ZIPLINE_TOKEN) {
    throw new Error('Zipline configuration is missing');
  }

  try {
    // Extract the file path from the URL
    // URL format: https://zipline.example.com/employees/EMP001/file.pdf
    const urlObj = new URL(fileUrl);
    const filePath = urlObj.pathname.substring(1); // Remove leading slash

    if (!filePath) {
      throw new Error('Invalid file URL - no path found');
    }

    const response = await fetch(
      `${ZIPLINE_URL}/api/user/files/${encodeURIComponent(filePath)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: ZIPLINE_TOKEN
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to delete file from Zipline:', errorData);
      throw new Error(errorData.error || 'Failed to delete file');
    }
  } catch (error) {
    console.error('Error deleting file from Zipline:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Safely delete a file from Zipline (doesn't throw on failure)
 * @param fileUrl - The URL of the file to delete
 * @returns Promise that resolves whether deletion succeeded
 */
export async function safeDeleteFromZipline(fileUrl: string): Promise<boolean> {
  try {
    await deleteFromZipline(fileUrl);
    return true;
  } catch (error) {
    console.error('Failed to delete file from Zipline, but continuing:', error);
    return false;
  }
}
