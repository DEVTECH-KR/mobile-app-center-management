import Class from "./class.schema";
import { Types } from 'mongoose';

interface FilterOptions {
  name?: string;
  description?: string,
  levels?: string[];
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ClassService {
    static async create(ClassData: any){
        return await Class.create(ClassData);
    }

    static async getAll(
        filter: FilterOptions = {},
        { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }: PaginationOptions
    ) {
        const query: any = {};

        // Apply filters
        if (filter.name) {
        query.name = { $regex: filter.name, $options: 'i' };
        }

        if (filter.description) {
        query.description = { $regex: filter.description, $options: 'i' };
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
        const [classes, total] = await Promise.all([
        Class.find(query)
            .populate('courseId', 'title description price days')
            .populate('teacherId', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Class.countDocuments(query)
        ]);

        return {
            classes,
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
            throw new Error('Invalid Class ID');
        }
        
        const gotClass = await Class.findById(id)
            .populate('courseId', 'title description price days')
            .populate('teacherId', 'name email');
            
        if (!gotClass) {
            throw new Error('class not found');
        }
        
        return gotClass;
    }

    static async update(id: string, updateData: any) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid class ID');
        }

        const newclass = await Class.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
        ).populate('courseId', 'title description price days')
        .populate('teacherId', 'name email');

        if (!newclass) {
            throw new Error('Class not found');
        }

        return newclass;
    }

    static async delete(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid class ID');
        }

        const deletedClass = await Class.findByIdAndDelete(id);
        
        if (!deletedClass) {
            throw new Error('Class not found');
        }

        return deletedClass;
    }
}