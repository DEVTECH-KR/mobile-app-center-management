// Course Service: src/server/api/courses/course.service.ts
import Course from './course.schema';
import { Types } from 'mongoose';

interface FilterOptions {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  days?: string[];
  levels?: string[];
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CourseService {
  static async create(courseData: any) {
    return await Course.create(courseData);
  }

  static async getAll(
    filter: FilterOptions = {},
    { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }: PaginationOptions
  ) {
    const query: any = {};

    // Apply filters
    if (filter.title) {
      query.title = { $regex: filter.title, $options: 'i' };
    }
    if (filter.minPrice !== undefined) {
      query.price = { ...query.price, $gte: filter.minPrice };
    }
    if (filter.maxPrice !== undefined) {
      query.price = { ...query.price, $lte: filter.maxPrice };
    }
    if (filter.days?.length) {
      query.days = { $in: filter.days };
    }
    if (filter.levels?.length) {
      query.levels = { $in: filter.levels };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Prepare sort object
    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    // Execute query with pagination
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('teacherIds', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query)
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

  static async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid course ID');
    }
    
    const course = await Course.findById(id)
      .populate('teacherIds', 'name email');
      
    if (!course) {
      throw new Error('Course not found');
    }
    
    return course;
  }

  static async update(id: string, updateData: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid course ID');
    }

    const course = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('teacherIds', 'name email');

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  static async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid course ID');
    }

    const course = await Course.findByIdAndDelete(id);
    
    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }
}