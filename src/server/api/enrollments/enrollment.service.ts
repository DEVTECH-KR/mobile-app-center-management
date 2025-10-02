// src/server/api/enrollments/enrollment.service.ts
import { Types } from 'mongoose';
import { EnrollmentModel } from './enrollment.schema';
import { UserModel } from '../auth/user.schema';
import { CourseModel } from '../courses/course.schema';

export class EnrollmentService {
  // Create a new enrollment request
  static async createRequest(studentId: string, courseId: string) {
    // Validate student exists and is not already enrolled
    const existingEnrollment = await EnrollmentModel.findOne({
      studentId,
      courseId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'pending') {
        throw new Error('You already have a pending enrollment request for this course');
      } else {
        throw new Error('You are already enrolled in this course');
      }
    }

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Create enrollment request
    const enrollmentRequest = await EnrollmentModel.create({
      studentId,
      courseId,
      status: 'pending',
      requestDate: new Date(),
    });

    // Populate and return the created request
    return await enrollmentRequest.populate([
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'courseId', select: 'title price' }
    ]);
  }

  // Get enrollment request by ID
  static async getRequestById(requestId: string) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('Invalid enrollment request ID');
    }

    const request = await EnrollmentModel.findById(requestId)
      .populate('studentId', 'name email avatarUrl')
      .populate('courseId', 'title price')
      .populate('assignedClassId', 'name');

    if (!request) {
      throw new Error('Enrollment request not found');
    }

    return request;
  }

  // Get all enrollment requests for a student
  static async getStudentRequests(studentId: string) {
    return await EnrollmentModel.find({ studentId })
      .populate('courseId', 'title price')
      .populate('assignedClassId', 'name')
      .sort({ requestDate: 'desc' });
  }

  // Get all enrollment requests with filters
  static async getAllRequests(filter: { status?: string; courseId?: string } = {}) {
    const query: any = {};
    
    if (filter.status) query.status = filter.status;
    if (filter.courseId) query.courseId = filter.courseId;

    return await EnrollmentModel.find(query)
      .populate('studentId', 'name email avatarUrl')
      .populate('courseId', 'title price')
      .populate('assignedClassId', 'name')
      .sort({ requestDate: 'desc' });
  }

  // Approve enrollment request
  static async approveRequest(requestId: string, adminData: { classId: string; adminNotes?: string }) {
    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Enrollment request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }

    if (!request.registrationFeePaid) {
      throw new Error('Registration fee must be paid before approval');
    }

    request.status = 'approved';
    request.approvalDate = new Date();
    request.assignedClassId = adminData.classId;
    request.adminNotes = adminData.adminNotes;
    await request.save();

    // Update user with enrolled course
    await UserModel.findByIdAndUpdate(request.studentId, {
      $push: {
        enrolledCourses: {
          courseId: request.courseId,
          classId: adminData.classId,
          status: 'approved',
          enrollmentDate: request.requestDate,
          approvalDate: request.approvalDate,
          registrationFeePaid: true,
        },
        enrolledCourseIds: request.courseId,
        classIds: adminData.classId
      }
    });

    return await request.populate([
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'courseId', select: 'title price' },
      { path: 'assignedClassId', select: 'name' }
    ]);
  }

  // Reject enrollment request
  static async rejectRequest(requestId: string, adminNotes?: string) {
    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Enrollment request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot reject request with status: ${request.status}`);
    }

    request.status = 'rejected';
    request.adminNotes = adminNotes;
    await request.save();

    return await request.populate([
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'courseId', select: 'title price' }
    ]);
  }

  // Record registration fee payment
  static async recordPayment(requestId: string) {
    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Enrollment request not found');
    }

    if (request.registrationFeePaid) {
      throw new Error('Registration fee already paid');
    }

    if (request.status !== 'pending') {
      throw new Error('Can only record payment for pending requests');
    }

    request.registrationFeePaid = true;
    request.paymentDate = new Date();
    await request.save();

    // Update user's access level
    await UserModel.findByIdAndUpdate(request.studentId, {
      accessLevel: 'full'
    });

    return request;
  }

  // Get enrollment statistics
  static async getStatistics() {
    const stats = await EnrollmentModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return stats.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }

  // Dans EnrollmentService
  static async getCourseStatus(studentId: string, courseId: string) {
    // Vérifier que les IDs sont valides
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
      throw new Error("Invalid studentId or courseId");
    }

    // Vérifier l’existence du cours
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Vérifier si une demande existe déjà
    const enrollment = await EnrollmentModel.findOne({ studentId, courseId });

    if (!enrollment) {
      return { status: "not_enrolled" }; // pas encore demandé
    }

    return {
      status: enrollment.status, // pending, approved, rejected
      registrationFeePaid: enrollment.registrationFeePaid,
      requestDate: enrollment.requestDate,
      approvalDate: enrollment.approvalDate,
    };
  }

}