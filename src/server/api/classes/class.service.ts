import { ClassModel, IClass } from './class.schema';
import mongoose, { Types } from 'mongoose';
import { UserModel, CourseModel } from '../models';
import { IUser } from '../auth/user.schema';

interface FilterOptions {
  name?: string;
  courseTitle?: string;
  teacherName?: string;
  courseId?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ClassService {

  static async create(classData: Partial<IClass>): Promise<IClass> {
    const classDoc = await ClassModel.create(classData);

    // Mettre à jour classIds des enseignants et étudiants
    if (classDoc.teacherId) {
      await UserModel.updateOne(
        { _id: classDoc.teacherId, role: 'teacher' },
        { $addToSet: { classIds: classDoc._id } }
      );
    }

    if (classDoc.studentIds && classDoc.studentIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: classDoc.studentIds }, role: 'student' },
        { $addToSet: { classIds: classDoc._id } }
      );
    }

    return classDoc;
  }

  static async getAll(
    filters: FilterOptions = {},
    { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' }: PaginationOptions = {}
  ) {
    const query: any = {};
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.courseId) query.courseId = filters.courseId;
    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [classes, total] = await Promise.all([
      ClassModel.find(query)
        .populate('teacherId', 'name email avatarUrl')
        .populate('studentIds', 'name email avatarUrl')
        .populate('courseId', 'title description price')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ClassModel.countDocuments(query),
    ]);

    console.log("data: ", classes)
    return {
      classes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  static async getById(id: string): Promise<IClass> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid class ID');
    const classDoc = await ClassModel.findById(id)
        .populate('teacherId', 'name email avatarUrl')
        .populate('studentIds', 'name email avatarUrl');

    if (!classDoc) throw new Error('Class not found');
    return classDoc;
  }

  static async update(id: string, updateData: Partial<IClass>): Promise<IClass> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid class ID');

    // Récupérer l'ancienne classe pour comparer
    const oldClass = await ClassModel.findById(id).select('teacherId studentIds');
    if (!oldClass) throw new Error('Class not found');

    // Validate unique studentIds
    if (updateData.studentIds) {
      const uniqueStudentsIds = [...new Set(updateData.studentIds.map(id => id.toString()))];
      if (uniqueStudentsIds.length !== updateData.studentIds.length) {
        throw new Error('Duplicate students IDs are not allowed');
      }
    }

    const classDoc = await ClassModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('teacherId', 'name email avatarUrl')
        .populate('studentIds', 'name email avatarUrl');
        
    if (!classDoc) throw new Error('Class not found');

    // Gérer les changements d'enseignant
    if (updateData.teacherId !== undefined) {
      const oldTeacherId = oldClass.teacherId ? oldClass.teacherId.toString() : undefined;
      const newTeacherId = classDoc.teacherId ? (classDoc.teacherId as any)._id.toString() : undefined;
      if (oldTeacherId !== newTeacherId) {
        if (oldTeacherId && mongoose.Types.ObjectId.isValid(oldTeacherId)) {
          await UserModel.updateOne(
            { _id: oldTeacherId, role: 'teacher' },
            { $pull: { classIds: classDoc._id } }
          );
        }
        if (newTeacherId && mongoose.Types.ObjectId.isValid(newTeacherId)) {
          await UserModel.updateOne(
            { _id: newTeacherId, role: 'teacher' },
            { $addToSet: { classIds: classDoc._id } }
          );
        }
      }
    }

    // Gérer les changements d'étudiants
    if (updateData.studentIds !== undefined) {
      const oldStudentIds = oldClass.studentIds.map((id: mongoose.Types.ObjectId) => id.toString());
      const newStudentIds = classDoc.studentIds.map((student: any) => student._id ? student._id.toString() : student.toString());
      
      const removedStudents = oldStudentIds.filter(id => !newStudentIds.includes(id)).filter(id => mongoose.Types.ObjectId.isValid(id));
      if (removedStudents.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: removedStudents }, role: 'student' },
          { $pull: { classIds: classDoc._id } }
        );
      }
      
      const addedStudents = newStudentIds.filter(id => !oldStudentIds.includes(id)).filter(id => mongoose.Types.ObjectId.isValid(id));
      if (addedStudents.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: addedStudents }, role: 'student' },
          { $addToSet: { classIds: classDoc._id } }
        );
      }
    }

    return classDoc;
  }

  static async getTeachersByCourse(courseId: string): Promise<IUser[]> {
    if (!Types.ObjectId.isValid(courseId)) throw new Error('Invalid course ID');
    const course = await CourseModel.findById(courseId).populate('teacherIds', 'name email avatarUrl _id');
    if (!course) throw new Error('Course not found');
    return course.teacherIds as IUser[];
  }

  static async delete(id: string): Promise<IClass> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid class ID');
    const classDoc = await ClassModel.findByIdAndDelete(id);
    if (!classDoc) throw new Error('Class not found');

    // Nettoyer les classIds des utilisateurs
    if (classDoc.teacherId) {
      const teacherId = classDoc.teacherId.toString();
      if (mongoose.Types.ObjectId.isValid(teacherId)) {
        await UserModel.updateOne(
          { _id: teacherId, role: 'teacher' },
          { $pull: { classIds: classDoc._id } }
        );
      }
    }

    if (classDoc.studentIds && classDoc.studentIds.length > 0) {
      const studentIds = classDoc.studentIds.map(id => id.toString()).filter(id => mongoose.Types.ObjectId.isValid(id));
      if (studentIds.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: studentIds }, role: 'student' },
          { $pull: { classIds: classDoc._id } }
        );
      }
    }

    return classDoc;
  }

  static async getAvailableClassesForEnrollment(courseId: string, preferredLevel?: string) {
    const query: any = { courseId };
    
    if (preferredLevel && preferredLevel !== 'Not specified') {
      query.level = preferredLevel;
    }

    console.log('Searching for classes with query:', query);

    const classes = await ClassModel.find(query)
      .populate('teacherId', 'name')
      .select('name level schedule teacherId');

    console.log('Found classes:', classes);

    return classes;
  }
  
}