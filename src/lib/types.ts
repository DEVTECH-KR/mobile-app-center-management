
import { Timestamp } from "firebase/firestore";

export type UserRole = "student" | "teacher" | "admin";

export type EnrollmentStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string; // This will be the Firebase Auth UID
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
  // Teacher-specific fields
  skills?: string[];
  experience?: string;
  age?: number;
};

export type Course = {
  id?: string; // Firestore will generate this
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
    id?: string; // Firestore will generate this
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
  id?: string; // Firestore will generate this
  userId: string;
  courseId: string;
  installments: Installment[];
  totalPaid: number;
  totalDue: number;
  registrationFee: number;
};

export type Event = {
  id?: string; // Firestore will generate this
  title: string;
  description: string;
  details?: string;
  date: Timestamp | Date | string; // Use Timestamp for Firestore
  isPast: boolean;
  imageUrls: string[];
  imageHint: string;
};

export type Document = {
  id?: string; // Firestore will generate this
  courseId: string;
  title: string;
  fileUrl: string;
  type: "Syllabus" | "Material" | "Assignment" | "Evaluation";
  uploadedAt: Timestamp | string; // Use Timestamp for Firestore
  uploaderId: string;
};

export type Partner = {
    id?: string;
    name: string;
    logoUrl: string;
}

export type CenterInfo = {
    id?: string;
    mission: string;
    schedule: string;
    registrationFee: number;
    address: string;
    contact: string;
}

export type EnrollmentRequest = {
    id?: string; // Firestore will generate this
    userId: string;
    courseId: string;
    requestDate: Timestamp | Date; // Use Timestamp for Firestore
    status: EnrollmentStatus;
    userName: string; // Denormalized for easy display
    userEmail: string; // Denormalized for easy display
    courseTitle: string; // Denormalized for easy display
}

    