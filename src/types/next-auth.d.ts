import 'next-auth';
import { FirmRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    firms?: Array<{
      id: string;
      slug: string;
      name: string;
      role: FirmRole;
      themeColor: string;
    }>;
    activeFirmSlug?: string;
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    firms?: Array<{
      id: string;
      slug: string;
      name: string;
      role: FirmRole;
      themeColor: string;
    }>;
    activeFirmSlug?: string;
  }
}
