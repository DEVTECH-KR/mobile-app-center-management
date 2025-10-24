import { Types } from 'mongoose';
import { AssignmentModel } from './assignment.schema';
import { UserModel } from '@/server/api/auth/user.schema';
import { ClassModel } from '@/server/api/classes/class.schema';

export class AssignmentService {
  // Get or create assignment for a student
  static async getOrCreateAssignment(studentId: string, assignedBy: string) {
    if (!Types.ObjectId.isValid(studentId)) throw new Error('Invalid student ID');
    if (!Types.ObjectId.isValid(assignedBy)) throw new Error('Invalid admin ID');

    // Verify student exists and is actually a student
    const student = await UserModel.findById(studentId);
    if (!student) throw new Error('Student not found');
    if (student.role !== 'student') throw new Error('Only students can be assigned to classes');

    let assignment = await AssignmentModel.findOne({ studentId })
      .populate('classIds', 'name courseId level');

    if (!assignment) {
      assignment = await AssignmentModel.create({
        studentId: new Types.ObjectId(studentId),
        classIds: [],
        assignedBy: new Types.ObjectId(assignedBy)
      });
      await assignment.populate('classIds', 'name courseId level');
    }

    return assignment;
  }

  static async addClasses(studentId: string, classIds: string[], assignedBy: string) {
    if (!Array.isArray(classIds)) throw new Error('classIds must be an array');

    const assignment = await this.getOrCreateAssignment(studentId, assignedBy);

    // Vérifier que les classes existent
    const classes = await ClassModel.find({ _id: { $in: classIds } });
    if (classes.length !== classIds.length) throw new Error('One or more classes not found');

    // Empêcher les doublons
    const existingClassIds = assignment.classIds.map((id: Types.ObjectId) => id.toString());
    const duplicates = classIds.filter(id => existingClassIds.includes(id));
    if (duplicates.length > 0) {
      throw new Error(`Student is already assigned to these classes: ${duplicates.join(', ')}`);
    }

    // Ajouter les nouvelles classes à l'affectation de l'étudiant
    assignment.classIds.push(...classIds.map(id => new Types.ObjectId(id)));
    await assignment.save();
    await assignment.populate('classIds', 'name courseId level');

    // ✅ Mettre à jour les classes pour y inclure le studentId dans "studentIds"
    await ClassModel.updateMany(
      { _id: { $in: classIds } },
      { $addToSet: { studentIds: new Types.ObjectId(studentId) } } // addToSet évite les doublons
    );

    // ✅ Mettre à jour le document User (compatibilité)
    await UserModel.findByIdAndUpdate(studentId, {
      classIds: assignment.classIds
    });

    return assignment;
  }

  // Remove specific classes from student assignment
  static async removeClasses(studentId: string, classIds: string[]) {
    if (!Types.ObjectId.isValid(studentId)) throw new Error('Invalid student ID');

    const assignment = await AssignmentModel.findOne({ studentId });
    if (!assignment) throw new Error('No assignment found for this student');

    if (classIds.length === 0) {
      // Supprimer toutes les classes
      assignment.classIds = [];
    } else {
      // Supprimer seulement les classes spécifiées
      assignment.classIds = assignment.classIds.filter(
        (classId: Types.ObjectId) => !classIds.includes(classId.toString())
      );
    }

    await assignment.save();
    await assignment.populate('classIds', 'name courseId level');

    // ✅ Mettre à jour les classes concernées pour retirer l'étudiant
    if (classIds.length > 0) {
      await ClassModel.updateMany(
        { _id: { $in: classIds } },
        { $pull: { studentIds: new Types.ObjectId(studentId) } }
      );
    } else {
      // Si toutes les classes sont supprimées
      await ClassModel.updateMany(
        {},
        { $pull: { studentIds: new Types.ObjectId(studentId) } }
      );
    }

    // ✅ Mettre à jour aussi le document User
    await UserModel.findByIdAndUpdate(studentId, {
      classIds: assignment.classIds
    });

    return assignment;
  }

  // Remove all classes from student
  static async removeAllClasses(studentId: string) {
    return this.removeClasses(studentId, []);
  }

  // Get assignment by student ID
  static async getAssignmentByStudentId(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) throw new Error('Invalid student ID');

    const assignment = await AssignmentModel.findOne({ studentId })
      .populate('classIds', 'name courseId level')
      .populate('assignedBy', 'name email');

    return assignment;
  }

  // Get all assignments with filtering
  static async getAllAssignments(filters: { studentId?: string; classId?: string } = {}) {
    const query: any = {};
    
    if (filters.studentId) {
      query.studentId = new Types.ObjectId(filters.studentId);
    }
    
    if (filters.classId) {
      query.classIds = new Types.ObjectId(filters.classId);
    }

    const assignments = await AssignmentModel.find(query)
      .populate('studentId', 'name email avatarUrl status')
      .populate('classIds', 'name courseId level')
      .populate('assignedBy', 'name email')
      .sort({ updatedAt: -1 });

    return assignments;
  }

  // Get students by class ID
  static async getStudentsByClassId(classId: string) {
    if (!Types.ObjectId.isValid(classId)) throw new Error('Invalid class ID');

    const assignments = await AssignmentModel.find({ classIds: classId })
      .populate('studentId', 'name email avatarUrl status')
      .populate('assignedBy', 'name email');

    return assignments.map(assignment => assignment.studentId);
  }

  // Get available classes for a student (classes they are NOT assigned to)
  static async getAvailableClasses(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) throw new Error('Invalid student ID');

    // Get student's current assignments
    const assignment = await AssignmentModel.findOne({ studentId });
    const assignedClassIds = assignment?.classIds.map((id: Types.ObjectId) => id.toString()) || [];

    // Get all classes excluding the ones the student is already in
    const availableClasses = await ClassModel.find({
        _id: { $nin: assignedClassIds }
    }).populate('courseId', 'title description');

    return availableClasses;
  }

  // Get assigned classes count for a student
  static async getAssignedClassesCount(studentId: string) {
      if (!Types.ObjectId.isValid(studentId)) throw new Error('Invalid student ID');

      const assignment = await AssignmentModel.findOne({ studentId });
      return assignment?.classIds.length || 0;
  }

  // Get detailed assigned classes for a student
  static async getStudentAssignedClasses(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) throw new Error('Invalid student ID');

    const assignment = await AssignmentModel.findOne({ studentId })
        .populate('classIds', 'name courseId level schedule')
        .populate({
        path: 'classIds',
        populate: {
            path: 'courseId',
            select: 'title description'
        }
        });

    return assignment?.classIds || [];
  }    
}