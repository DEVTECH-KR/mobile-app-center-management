// src/server/api/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { UserModel, CourseModel, ClassModel, EnrollmentModel } from '../models';
import { AssignmentModel } from '../assignments/assignment.schema';
import { ActivityLogService } from '../logs/activity-log.service';

const JWT_SECRET = process.env.JWT_SECRET || '2bda842ae236aedf8bd7da1ee7998bdd0ec8d793afb9da5d6e371eb041f18f0facd41416f331a5c89608c2f3b62597f0401c7255d662b9c3834249b3b66b5225';

interface FilterOptions {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  classId?: string;
  promotion?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AuthService {
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    gender: string;
    nationality: string;
    educationLevel: string;
    university?: string;
    address?: string;
    phone?: string;
    promotion?: string;
    role?: string; // Ajout du rôle optionnel
    status?: string; // Ajout du statut optionnel
  }, generateToken: boolean = false) {
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await UserModel.create({
      ...userData,
      password: hashedPassword,
      status: userData.status || 'pending', // Utiliser le statut fourni ou 'pending'
      role: userData.role || 'student', // Utiliser le rôle fourni ou 'student'
    });

    const result: { user: any; token?: string } = { user: user.toJSON() };

    if (generateToken) {
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role, status: user.status },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      result.token = token;
    }

    result.user.avatarUrl = result.user.avatarUrl === '' ? null : result.user.avatarUrl;
    return result;
  }

  static async login(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'banned') {
      throw new Error('Your account is banned');
    }

    if (user.status === 'pending') {
      throw new Error('Your account is pending approval');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userJson = user.toJSON();
    userJson.avatarUrl = userJson.avatarUrl === '' ? null : userJson.avatarUrl;
    return { user: userJson, token };
  }

  static async getProfile(userId: string) {
    const user = await UserModel.findById(userId)
      .select('-password')
      .populate('enrolledCourseIds', 'title description')
      .populate('classIds', 'name courseId level');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Convertir avatarUrl vide en null
    const userJson = user.toJSON();
    userJson.avatarUrl = userJson.avatarUrl === '' ? null : userJson.avatarUrl;
    userJson.status = userJson.status || 'pending';
    return userJson;
  }

  static async updateProfile(userId: string, updateData: any) {
    // Prevent updating sensitive fields
    delete updateData.email;
    delete updateData.role;
    delete updateData.status;
    delete updateData.password;
    delete updateData.enrolledCourseIds;
    delete updateData.classIds;

    // Convertir avatarUrl vide en null
    if (updateData.avatarUrl === '') {
      updateData.avatarUrl = null;
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    const userJson = user.toJSON();
    userJson.avatarUrl = userJson.avatarUrl === '' ? null : userJson.avatarUrl;
    userJson.status = userJson.status || 'pending';
    return userJson;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return { message: 'Password changed successfully' };
  }  

  static async updatePreferences(userId: string, preferences: { theme?: string; language?: string }) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Met à jour uniquement les champs présents
    if (preferences.theme) user.preferences.theme = preferences.theme;
    if (preferences.language) user.preferences.language = preferences.language;

    await user.save();
    return user.preferences;
  }

  static async getAll(
    filters: FilterOptions = {},
    { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' }: PaginationOptions = {}
  ) {
    const query: any = {};
    if (filters.name && filters.name !== 'all') query.name = { $regex: filters.name, $options: 'i' };
    if (filters.email && filters.email !== 'all') query.email = { $regex: filters.email, $options: 'i' };
    if (filters.role && filters.role !== 'all') query.role = filters.role;
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    
    // Handle classId filter - only apply if it's a valid ObjectId and not "all"
    if (filters.classId && filters.classId !== 'all' && Types.ObjectId.isValid(filters.classId)) {
      query.classIds = new Types.ObjectId(filters.classId);
    }
    
    if (filters.promotion && filters.promotion !== 'all') query.promotion = filters.promotion;

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select('-password')
        .populate('classIds', 'name courseId level')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(query),
    ]);

    // Get proper stats with separate aggregations
    const [roleStats, statusStats] = await Promise.all([
      UserModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      UserModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format the stats properly
    const formattedStats = {
      total: total,
      byRole: roleStats.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      byStatus: statusStats.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      stats: formattedStats,
    };
  }

  // static async getAll(
  //   filters: FilterOptions = {},
  //   { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' }: PaginationOptions = {}
  // ) {
  //   const query: any = {};
  //   if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  //   if (filters.email) query.email = { $regex: filters.email, $options: 'i' };
  //   if (filters.role) query.role = filters.role;
  //   if (filters.status) query.status = filters.status;
  //   if (filters.classId) query.classIds = new Types.ObjectId(filters.classId);
  //   if (filters.promotion) query.promotion = filters.promotion;

  //   const skip = (page - 1) * limit;
  //   const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  //   const [users, total, stats] = await Promise.all([
  //     UserModel.find(query)
  //       .select('-password')
  //       .populate('classIds', 'name courseId level')
  //       .sort(sort)
  //       .skip(skip)
  //       .limit(limit),
  //     UserModel.countDocuments(query),
  //     UserModel.aggregate([
  //       { $match: query },
  //       {
  //         $group: {
  //           _id: null,
  //           total: { $sum: 1 },
  //           byRole: { $push: { role: '$role', count: { $sum: 1 } } },
  //           byStatus: { $push: { status: '$status', count: { $sum: 1 } } },
  //         }
  //       },
  //     ]),
  //   ]);

  //   const formattedStats = {
  //     total: stats[0]?.total || 0,
  //     byRole: stats[0]?.byRole.reduce((acc: any, curr: any) => ({ ...acc, [curr.role]: curr.count }), {}) || {},
  //     byStatus: stats[0]?.byStatus.reduce((acc: any, curr: any) => ({ ...acc, [curr.status]: curr.count }), {}) || {},
  //   };

  //   return {
  //     users,
  //     pagination: {
  //       total,
  //       page,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //       hasMore: page * limit < total,
  //     },
  //     stats: formattedStats,
  //   };
  // }

  static async updateRoleAndStatus(userId: string, updateData: { role?: string; status?: string }) {
    if (!Types.ObjectId.isValid(userId)) throw new Error('Invalid user ID');
    
    const updateFields: any = {};
    if (updateData.role) updateFields.role = updateData.role;
    if (updateData.status) updateFields.status = updateData.status;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    const userJson = user.toJSON();
    userJson.avatarUrl = userJson.avatarUrl === '' ? null : userJson.avatarUrl;
    userJson.status = userJson.status || 'pending';
    return userJson;
  }


  static async assignClasses(userId: string, classIds: string[]) {
    if (!Types.ObjectId.isValid(userId)) throw new Error('Invalid user ID');
    
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Allow assignment for both students and teachers
    if (user.role !== 'teacher' && user.role !== 'student') {
      throw new Error('Only teachers and students can be assigned classes');
    }

    const uniqueClassIds = [...new Set(classIds.map(id => id))];
    
    if (uniqueClassIds.length > 0) {
      const classes = await ClassModel.find({ _id: { $in: uniqueClassIds } });
      if (classes.length !== uniqueClassIds.length) throw new Error('One or more classes not found');
    }

    // For teachers, update class teacherId; for students, just assign to user
    if (user.role === 'teacher' && uniqueClassIds.length > 0) {
      await ClassModel.updateMany(
        { _id: { $in: uniqueClassIds } },
        { teacherId: userId }
      );
    }

    user.classIds = uniqueClassIds.map(id => new Types.ObjectId(id));
    await user.save();

    return user.toJSON();
  }

  static async updateUserByAdmin(userId: string, updateData: any) {
    // For admin updates, allow email changes but still protect sensitive fields
    delete updateData.password;
    delete updateData.enrolledCourseIds;
    delete updateData.classIds;

    // Convert empty avatarUrl to null
    if (updateData.avatarUrl === '') {
      updateData.avatarUrl = null;
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingUser = await UserModel.findOne({ 
        email: updateData.email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    const userJson = user.toJSON();
    userJson.avatarUrl = userJson.avatarUrl === '' ? null : userJson.avatarUrl;
    userJson.status = userJson.status || 'pending';
    return userJson;
  }

  // static async delete(userId: string) {
  //   const user = await UserModel.findByIdAndDelete(userId);
  //   if (!user) throw new Error('User not found');
  //   return user;
  // }

static async delete(userId: string, performedBy?: string, ipAddress?: string, userAgent?: string) {
  const user = await UserModel.findByIdAndDelete(userId);
  if (!user) throw new Error('User not found');

  // 🔹 1. Retirer l'utilisateur de toutes les classes où il apparaît
  await ClassModel.updateMany(
    { studentIds: user._id },
    { $pull: { studentIds: user._id } }
  );
  await ClassModel.updateMany(
    { teacherId: user._id },
    { $unset: { teacherId: "" } }
  );

  // 🔹 2. Retirer des cours où il est enseignant
  await CourseModel.updateMany(
    { teacherIds: user._id },
    { $pull: { teacherIds: user._id } }
  );

  // 🔹 3. Supprimer ses inscriptions (enrollments)
  await EnrollmentModel.deleteMany({ studentId: user._id });

  // 🔹 4. Supprimer ses affectations (assignments)
  await AssignmentModel.deleteMany({ studentId: user._id });

  // 🔹 5. Enregistrer dans les logs
  if (performedBy) {
    await ActivityLogService.record({
      actionType: 'delete',
      performedBy,
      affectedUser: userId,
      details: `User "${user.name}" (${user.email}) deleted by admin.`,
      collection: 'User',
      ipAddress,
      userAgent,
    });
  }

  return { message: `User ${user.name} deleted successfully` };
}

  static async removeFromClass(userId: string, classId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new Error('Invalid user ID');
    if (!Types.ObjectId.isValid(classId)) throw new Error('Invalid class ID');
    
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Fix the type issue - classIds are ObjectId types
    user.classIds = user.classIds.filter(
      (id: Types.ObjectId) => id.toString() !== classId
    );
    
    await user.save();

    return user.toJSON();
  }
}