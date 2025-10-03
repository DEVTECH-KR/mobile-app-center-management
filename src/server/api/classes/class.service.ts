import { ClassModel, IClass } from './class.schema';
import mongoose, { Types } from 'mongoose';
import { UserModel, CourseModel } from '../models';

interface FilterOptions {
  name?: string;
  courseTitle?: string;
  teacherName?: string;
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
    return classDoc;
  }

  static async getAll(
    filters: FilterOptions = {},
    { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' }: PaginationOptions = {}
  ) {
    const query: any = {};
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
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
    // Validate unique teacherIds
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
    return classDoc;
  }

  static async delete(id: string): Promise<IClass> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid class ID');
    const classDoc = await ClassModel.findByIdAndDelete(id);
    if (!classDoc) throw new Error('Class not found');
    return classDoc;
  }
}