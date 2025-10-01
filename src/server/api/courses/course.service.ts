// src/server/api/courses/course.service.ts
import CourseModel from './course.schema';
import type { Course } from '@/lib/types';
import { Types } from 'mongoose';

interface FilterOptions {
  title?: string;
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
  static async create(courseData: Course): Promise<Course> {
    const course = await CourseModel.create(courseData);
    return course.toObject();
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
    if (filters.minPrice !== undefined) query.price = { ...query.price, $gte: filters.minPrice };
    if (filters.maxPrice !== undefined) query.price = { ...query.price, $lte: filters.maxPrice };
    if (filters.days?.length) query.days = { $in: filters.days };
    if (filters.levels?.length) query.levels = { $in: filters.levels };

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [courses, total] = await Promise.all([
      CourseModel.find(query)
        .populate('teacherIds', 'name email')
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
  static async getById(id: string): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid course ID');

    const course = await CourseModel.findById(id).populate('teacherIds', 'name email');
    if (!course) throw new Error('Course not found');

    return course.toObject();
  }

  // ============================
  // Mettre à jour un cours
  // ============================
  static async update(id: string, updateData: Partial<Course>): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid course ID');

    const course = await CourseModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('teacherIds', 'name email');

    if (!course) throw new Error('Course not found');
    return course.toObject();
  }

  // ============================
  // Supprimer un cours
  // ============================
  static async delete(id: string): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid course ID');

    const course = await CourseModel.findByIdAndDelete(id);
    if (!course) throw new Error('Course not found');

    return course.toObject();
  }
}
