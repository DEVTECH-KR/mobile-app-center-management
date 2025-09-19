export type UserRole = "student" | "teacher" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  enrolledCourseIds?: string[];
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
};

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
  date: string;
  isPast: boolean;
  imageUrl: string;
  imageHint: string;
};

export type Document = {
  id: string;
  courseId: string;
  title: string;
  fileUrl: string;
  type: "Syllabus" | "Material" | "Assignment" | "Evaluation";
  uploadedAt: string;
};
