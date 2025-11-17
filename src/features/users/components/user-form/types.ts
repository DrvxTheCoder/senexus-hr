export interface UserFormData {
  // Personal Details
  name: string;
  email: string;
  image: string;

  // Administrative
  employeeId?: string;
  firmIds: string[];
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';
  password?: string;
  confirmPassword?: string;
}

export interface UserFormErrors {
  [key: string]: string;
}
