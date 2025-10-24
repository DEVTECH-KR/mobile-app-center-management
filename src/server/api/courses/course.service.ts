// src/server/api/courses/course.service.ts
import mongoose from 'mongoose';
import { UserModel } from '../models';
import { CourseModel, ICourse } from './course.schema';
import { Types } from 'mongoose';

interface FilterOptions {
  title?: string;
  description?: string;
  minPrice?: number;
  maxPrice?: number;
  days?: string[];
  levels?: string[];
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CourseService {
  // ============================
  // Créer un nouveau cours
  // ============================
  static async create(courseData: Partial<ICourse>): Promise<ICourse> {
    // Validate unique teacherIds
    if (courseData.teacherIds) {
      const uniqueTeacherIds = [...new Set(courseData.teacherIds.map(id => id.toString()))];
      if (uniqueTeacherIds.length !== courseData.teacherIds.length) {
        throw new Error('Duplicate teacher IDs are not allowed');
      }
    }
    const course = await CourseModel.create(courseData);
    
    // Mettre à jour enrolledCourseIds des enseignants
    if (courseData.teacherIds && courseData.teacherIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: courseData.teacherIds }, role: 'teacher' },
        { $addToSet: { enrolledCourseIds: course._id } }
      );
    }

    return course.populate('teacherIds', 'name email avatarUrl');
  }

  // ============================
  // Récupérer tous les cours avec filtres et pagination
  // ============================
  static async getAll(
    filters: FilterOptions = {},
    { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }: PaginationOptions = {}
  ) {
    const query: any = {};
    if (filters.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters.description) query.description = { $regex: filters.description, $options: 'i' };
    if (filters.minPrice !== undefined) query.price = { ...query.price, $gte: filters.minPrice };
    if (filters.maxPrice !== undefined) query.price = { ...query.price, $lte: filters.maxPrice };
    if (filters.days?.length) query.days = { $in: filters.days };
    if (filters.levels?.length) query.levels = { $in: filters.levels };

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [courses, total] = await Promise.all([
      CourseModel.find(query)
        .populate('teacherIds', 'name email avatarUrl')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CourseModel.countDocuments(query)
    ]);

    return {
      courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  // ============================
  // Récupérer un cours par ID
  // ============================
  static async getById(id: string): Promise<ICourse> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid course ID');
    const course = await CourseModel.findById(id).populate('teacherIds', 'name email avatarUrl');
    if (!course) throw new Error('Course not found');
    return course;
  }


  // ============================
  // Mettre à jour un cours
  // ============================

  static async update(id: string, updateData: Partial<ICourse>): Promise<ICourse> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid course ID');
    
    // Récupérer l'ancien cours pour comparer les teacherIds
    const oldCourse = await CourseModel.findById(id);
    if (!oldCourse) throw new Error('Course not found');
    
    // Validate unique teacherIds
    if (updateData.teacherIds) {
      const uniqueTeacherIds = [...new Set(updateData.teacherIds.map(id => id.toString()))];
      if (uniqueTeacherIds.length !== updateData.teacherIds.length) {
        throw new Error('Duplicate teacher IDs are not allowed');
      }
    }
    
    const course = await CourseModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('teacherIds', 'name email avatarUrl'); 
    if (!course) throw new Error('Course not found');
    
    // ✅ NOUVEAU: Gérer les changements d'enseignants
    if (updateData.teacherIds !== undefined) {
      const oldTeacherIds = oldCourse.teacherIds.map((id: mongoose.Types.ObjectId) => id.toString());
      const newTeacherIds = updateData.teacherIds.map((id: mongoose.Types.ObjectId) => id.toString());
      
      // Retirer le cours des anciens enseignants qui ne sont plus assignés
      const removedTeachers = oldTeacherIds.filter((id: mongoose.Types.ObjectId) => !newTeacherIds.includes(id));
      if (removedTeachers.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: removedTeachers }, role: 'teacher' },
          { $pull: { enrolledCourseIds: course._id } }
        );
      }
      
      // Ajouter le cours aux nouveaux enseignants
      const addedTeachers = newTeacherIds.filter(id => !oldTeacherIds.includes(id));
      if (addedTeachers.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: addedTeachers }, role: 'teacher' },
          { $addToSet: { enrolledCourseIds: course._id } }
        );
      }
    }
    
    return course;
  }
  
  // ============================
  // Supprimer un cours
  // ============================
  static async delete(id: string): Promise<ICourse> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid course ID');
    const course = await CourseModel.findByIdAndDelete(id);
    if (!course) throw new Error('Course not found');

    // Nettoyer les enrolledCourseIds des enseignants
    if (course.teacherIds && course.teacherIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: course.teacherIds }, role: 'teacher' },
        { $pull: { enrolledCourseIds: course._id } }
      );
    }

    return course;
  }
}
