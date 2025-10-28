# Zipline Environment Variable Fix

## Issue

Profile photo upload was failing with error:
```
Error: Zipline configuration is missing. Please set ZIPLINE_URL and ZIPLINE_TOKEN in your environment variables.
```

## Root Cause

The `ProfilePhotoUpload` component is a client component that was trying to access environment variables directly via `uploadToZipline()`.

In Next.js:
- Client components can only access env vars prefixed with `NEXT_PUBLIC_`
- Server-only env vars (like API tokens) should not be exposed to the client

## Solution

Created a secure server-side API route for image uploads.

### Files Created

**`src/app/api/upload-image/route.ts`**
- Server-side endpoint for image uploads
- Handles authentication
- Validates file type and size
- Uploads to Zipline using server-side env vars
- Returns uploaded image URL

### Files Modified

**`src/components/profile-photo-upload.tsx`**
- Removed direct `uploadToZipline` import
- Changed to use `/api/upload-image` endpoint
- Upload flow now goes through secure API route

## How It Works Now

### Old Flow (Broken)
```
Client Component → uploadToZipline() → ❌ No env vars accessible
```

### New Flow (Fixed)
```
Client Component → POST /api/upload-image → Server validates → uploadToZipline() → Zipline Server → URL returned
```

## Code Changes

### Before
```typescript
// Client-side - doesn't work
import { uploadToZipline } from '@/lib/zipline';

const url = await uploadToZipline(file, {
  maxFileSize: 5 * 1024 * 1024,
  compressionPercent: 80
});
```

### After
```typescript
// Client-side - calls API route
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData
});

const data = await response.json();
const url = data.url;
```

### API Route (Server-side)
```typescript
export async function POST(request: NextRequest) {
  // 1. Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // 2. Validate file
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 3. Upload to Zipline (env vars accessible on server)
  const url = await uploadToZipline(file, {
    maxFileSize: 5 * 1024 * 1024,
    compressionPercent: 80
  });

  // 4. Return URL
  return NextResponse.json({ url });
}
```

## Benefits

✅ **Security:** API tokens never exposed to client
✅ **Authentication:** Only logged-in users can upload
✅ **Validation:** Server-side file validation
✅ **Error Handling:** Better error messages
✅ **Consistency:** Same pattern as other API routes

## Testing

1. Navigate to Client or Employee form
2. Click "Ajouter une photo"
3. Select an image file
4. ✅ Upload should work now
5. ✅ Photo URL stored in database
6. ✅ Preview shows circular avatar

## Environment Variables

Your .env file has the correct variables:
```env
ZIPLINE_URL="https://zipline.flanpaul.dev"
ZIPLINE_TOKEN="..."
```

These are now accessed **only on the server side** via the API route.

---

**Date:** October 25, 2025
**Status:** ✅ FIXED
**Files Modified:** 1
**Files Created:** 1
