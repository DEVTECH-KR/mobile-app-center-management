// src/server/api/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Course, Class, Enrollment } from '../models';


const JWT_SECRET = process.env.JWT_SECRET || '2bda842ae236aedf8bd7da1ee7998bdd0ec8d793afb9da5d6e371eb041f18f0facd41416f331a5c89608c2f3b62597f0401c7255d662b9c3834249b3b66b5225';

export class AuthService {
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    gender: string;
    nationality: string;
    educationLevel: string;
    university?: string;
    address?: string;
    phone?: string;
  }) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      ...userData,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: user.toJSON(), token };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: user.toJSON(), token };
  }

  static async getProfile(userId: string) {
    const user = await User.findById(userId)
      .select('-password')
      .populate('enrolledCourseIds')
      .populate('classIds');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, updateData: any) {
    // Prevent updating sensitive fields
    delete updateData.email;
    delete updateData.role;
    delete updateData.password;
    delete updateData.enrolledCourseIds;
    delete updateData.classIds;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
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
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Met à jour uniquement les champs présents
    if (preferences.theme) user.preferences.theme = preferences.theme;
    if (preferences.language) user.preferences.language = preferences.language;

    await user.save();
    return user.preferences;
  }
}