

export type UserRole = "student" | "teacher" | "admin";

export type EnrollmentStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  enrolledCourseIds?: string[];
  enrollmentRequestIds?: string[];
  classIds?: string[]; // For students and teachers
  // Extended profile information
  gender?: "male" | "female" | "other";
  nationality?: string;
  otherNationality?: string;
  educationLevel?: string;
  university?: string;
  address?: string;
  phone?: string;
};

export type Course = {
  id: string;
  title: string;
  description:string;
  price: number; // in FBU
  teacherIds: string[];
  days: string[];
  startTime: string;
  endTime: string;
  imageUrl: string;
  imageHint: string;
  levels: string[]; // e.g., ['Beginner', 'Intermediate', 'Advanced']
};

export type Class = {
    id: string;
    name: string; // e.g. "Room A"
    courseId: string;
    level: string;
    teacherId: string | null;
    studentIds: string[];
}

export type PaymentStatus = "Paid" | "Unpaid" | "Pending";

export type Installment = {
  name: string;
  amount: number;
  status: PaymentStatus;
  dueDate?: string;
};

export type PaymentDetails = {
  userId: string;
  courseId: string;
  installments: Installment[];
  totalPaid: number;
  totalDue: number;
  registrationFee: number;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  details?: string;
  date: string;
  isPast: boolean;
  imageUrls: string[];
  imageHint: string;
};

export type Document = {
  id:string;
  courseId: string;
  title: string;
  fileUrl: string;
  type: "Syllabus" | "Material" | "Assignment" | "Evaluation";
  uploadedAt: string;
  uploaderId: string;
};

export type Partner = {
    name: string;
    logoUrl: string;
}

export type CenterInfo = {
    mission: string;
    schedule: string;
    registrationFee: number;
    address: string;
    contact: string;
}

export type EnrollmentRequest = {
    id: string;
    userId: string;
    courseId: string;
    requestDate: string;
    status: EnrollmentStatus;
}
    
