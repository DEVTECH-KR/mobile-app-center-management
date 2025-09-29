import { Types } from 'mongoose';
import EnrollmentRequest from './enrollment.schema';
import User from '../auth/user.schema';
import Course from '../courses/course.schema';
import CenterSettings from '../settings/center-settings.schema';

export class EnrollmentService {
  // Create a new enrollment request
  static async createRequest(studentId: string, courseId: string) {
    // Validate student exists and is not already enrolled
    const existingEnrollment = await EnrollmentRequest.findOne({
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
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Create enrollment request
    const enrollmentRequest = await EnrollmentRequest.create({
      studentId,
      courseId,
      status: 'pending',
      requestDate: new Date(),
    });

    // Populate and return the created request
    return await enrollmentRequest.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'courseId', select: 'title price' }
    ]);
  }

  // Get enrollment request by ID
  static async getRequestById(requestId: string) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('Invalid enrollment request ID');
    }

    const request = await EnrollmentRequest.findById(requestId)
      .populate('studentId', 'name email')
      .populate('courseId', 'title price')
      .populate('assignedClassId', 'name');

    if (!request) {
      throw new Error('Enrollment request not found');
    }

    return request;
  }

  // Get all enrollment requests for a student
  static async getStudentRequests(studentId: string) {
    return await EnrollmentRequest.find({ studentId })
      .populate('courseId', 'title price')
      .populate('assignedClassId', 'name')
      .sort({ requestDate: -1 });
  }

  // Get all enrollment requests (admin only)
  static async getAllRequests(filter: {
    status?: 'pending' | 'approved' | 'rejected';
    courseId?: string;
  } = {}) {
    const query: any = {};
    if (filter.status) query.status = filter.status;
    if (filter.courseId) query.courseId = filter.courseId;

    return await EnrollmentRequest.find(query)
      .populate('studentId', 'name email')
      .populate('courseId', 'title price')
      .populate('assignedClassId', 'name')
      .sort({ requestDate: -1 });
  }

  // Approve enrollment request
  static async approveRequest(
    requestId: string,
    adminData: {
      classId: string;
      adminNotes?: string;
    }
  ) {
    const request = await EnrollmentRequest.findById(requestId);
    if (!request) {
      throw new Error('Enrollment request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }

    // Update request status
    request.status = 'approved';
    request.approvalDate = new Date();
    request.assignedClassId = new Types.ObjectId(adminData.classId);
    if (adminData.adminNotes) {
      request.adminNotes = adminData.adminNotes;
    }

    // Save the updated request
    await request.save();

    // Update user's enrolled courses
    await User.findByIdAndUpdate(request.studentId, {
      $push: {
        enrolledCourses: {
          courseId: request.courseId,
          classId: adminData.classId,
          status: 'approved',
          enrollmentDate: request.requestDate,
          approvalDate: request.approvalDate,
        }
      }
    });

    return await request.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'courseId', select: 'title price' },
      { path: 'assignedClassId', select: 'name' }
    ]);
  }

  // Reject enrollment request
  static async rejectRequest(requestId: string, adminNotes?: string) {
    const request = await EnrollmentRequest.findById(requestId);
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
      { path: 'studentId', select: 'name email' },
      { path: 'courseId', select: 'title price' }
    ]);
  }

  // Record registration fee payment
  static async recordPayment(requestId: string) {
    const request = await EnrollmentRequest.findById(requestId);
    if (!request) {
      throw new Error('Enrollment request not found');
    }

    if (request.registrationFeePaid) {
      throw new Error('Registration fee already paid');
    }

    request.registrationFeePaid = true;
    request.paymentDate = new Date();
    await request.save();

    // Update user's access level
    await User.findByIdAndUpdate(request.studentId, {
      accessLevel: 'full'
    });

    return request;
  }

  // Get enrollment statistics
  static async getStatistics() {
    const stats = await EnrollmentRequest.aggregate([
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
}