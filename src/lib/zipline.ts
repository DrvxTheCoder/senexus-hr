/**
 * Zipline Upload Utility
 * Handles file uploads to Zipline instance
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
  maxFileSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // mime types
  compressionPercent?: number; // 0-100
}

const ZIPLINE_URL =
  process.env.ZIPLINE_URL || process.env.NEXT_PUBLIC_ZIPLINE_URL;
const ZIPLINE_TOKEN =
  process.env.ZIPLINE_TOKEN || process.env.NEXT_PUBLIC_ZIPLINE_TOKEN;

/**
 * Upload a file to Zipline
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
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    compressionPercent = 80
  } = options;

  // Validate file size
  if (file.size > maxFileSize) {
    throw new Error(
      `File size exceeds maximum allowed size of ${maxFileSize / (1024 * 1024)}MB`
    );
  }

  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);

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
 */
export async function deleteFromZipline(fileUrl: string): Promise<void> {
  if (!ZIPLINE_URL || !ZIPLINE_TOKEN) {
    throw new Error('Zipline configuration is missing');
  }

  // Extract the file ID from the URL
  const fileName = fileUrl.split('/').pop();
  if (!fileName) {
    throw new Error('Invalid file URL');
  }

  try {
    const response = await fetch(`${ZIPLINE_URL}/api/user/files/${fileName}`, {
      method: 'DELETE',
      headers: {
        Authorization: ZIPLINE_TOKEN
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete file');
    }
  } catch (error) {
    console.error('Error deleting file from Zipline:', error);
    // Don't throw error on delete failures to avoid breaking the app
  }
}
