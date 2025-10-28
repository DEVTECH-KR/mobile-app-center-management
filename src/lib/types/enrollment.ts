// src/lib/types/enrollment.ts
export interface PopulatedEnrollment {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    gender?: string;
    nationality?: string;
    educationLevel?: string;
    university?: string;
    address?: string;
    phone?: string;
  };
  courseId: {
    _id: string;
    title: string;
    description: string;
    price: number;
    days: string[];
    levels: string[];
    teacherIds: Array<{
      _id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    }>;
    imageUrl?: string;
  };
  preferredLevel?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvalDate?: string;
  assignedClassId?: {
    _id: string;
    name: string;
    level: string;
    schedule?: string;
  };
  adminNotes?: string;
  registrationFeePaid: boolean;
  paymentDate?: string;
}