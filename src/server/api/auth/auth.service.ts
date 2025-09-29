import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.schema';

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
}