// src/lib/api/courses.api.ts
import type { Course, User } from '@/lib/types';

const getHeaders = (includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

export const coursesApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    title?: string;
    minPrice?: number;
    maxPrice?: number;
    days?: string[];
    levels?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.title) searchParams.append('title', params.title);
      if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString());
      params.days?.forEach(day => searchParams.append('days', day));
      params.levels?.forEach(level => searchParams.append('levels', level));
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    }
    const url = `/api/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  },

  async getById(id: string) {
    const res = await fetch(`/api/courses/${id}`, { headers: getHeaders(), credentials: 'include' });
    if (!res.ok) throw new Error(res.status === 404 ? 'Course not found' : 'Failed to fetch course');
    return res.json();
  },

  async create(courseData: Partial<Course>) {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(courseData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create course');
    }
    return res.json();
  },

  async update(id: string, courseData: Partial<Course>) {
    const res = await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(courseData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(res.status === 404 ? 'Course not found' : error.error || 'Failed to update course');
    }
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(`/api/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(res.status === 404 ? 'Course not found' : error.error || 'Failed to delete course');
    }
    return res.json();
  },
};

export const usersApi = {
  async getCurrentUser(): Promise<User | null> {
    const res = await fetch('/api/auth/profile', {
      headers: getHeaders(),
      credentials: 'include', 
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  },

  async getByRole(role: 'admin' | 'teacher' | 'student') {
    const res = await fetch(`/api/users?role=${role}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
};

export const enrollmentApi = {
  async getEnrollmentRequests(userId: string) {
    const res = await fetch(`/api/enrollments?userId=${userId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  },

  async requestEnrollment(courseId: string) {
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit enrollment request');
    }
    return res.json();
  },

  async checkStatus(courseId: string) {
    const res = await fetch(`/api/enrollments?courseId=${courseId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getAll(params?: { status?: 'pending' | 'approved' | 'rejected'; courseId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.courseId) searchParams.append('courseId', params.courseId);
    const url = `/api/enrollments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders(), credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch enrollment requests');
    return res.json();
  },
};
