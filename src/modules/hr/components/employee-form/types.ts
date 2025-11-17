export interface EmployeeFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  matricule: string;
  photoUrl: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus: string;
  nationality: string;
  cni: string;
  fatherName: string;
  motherName: string;

  // Professional Info
  jobTitle: string;
  category: string;
  netSalary: string;
  hireDate: string;
  contractEndDate: string;
  departmentId: string;
  assignedClientId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface EmployeeFormErrors {
  [key: string]: string;
}
