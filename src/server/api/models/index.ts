// src/server/api/models/index.ts
import { UserModel } from '../auth/user.schema';
import { CourseModel } from '../courses/course.schema';
import { ClassModel } from '../classes/class.schema';
import { EnrollmentModel } from '../enrollments/enrollment.schema';

// 🔹 Export centralisé de tous les modèles
export { UserModel, CourseModel, ClassModel, EnrollmentModel };
