export type UserRole = "student" | "teacher" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  enrolledCourseIds?: string[];
  classIds?: string[]; // For students and teachers
};

export type Course = {
  id: string;
  title: string;
  description: string;
  price: number; // in FBU
  teacherIds: string[];
  schedule: string;
  imageUrl: string;
  imageHint: string;
  levels?: string[]; // e.g., ['Beginner', 'Intermediate', 'Advanced']
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
  imageUrl: string;
  imageHint: string;
};

export type Document = {
  id:string;
  courseId: string;
  title: string;
  fileUrl: string;
  type: "Syllabus" | "Material" | "Assignment" | "Evaluation";
  uploadedAt: string;
};

export type Partner = {
    name: string;
    logoUrl: string;
}

export type CenterInfo = {
    mission: string;
    schedule: string;
    registrationFee: number;
}

    