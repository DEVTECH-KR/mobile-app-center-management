// src/lib/api/courses.api.ts
import { ICourse } from "@/server/api/courses/course.schema";
import { IUser } from "@/server/api/auth/user.schema";

// Determine the base URL based on the environment
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window === 'undefined' ? 'http://localhost:9002' : '');

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
  }, token?: string) {
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
    const url = `${BASE_URL}/api/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, { 
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      }, 
      credentials: 'include' 
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Courses fetch failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to fetch courses (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Courses fetched:', data);
    return data;
  },

  async getById(id: string, token?: string) {
    const url = `${BASE_URL}/api/courses/${id}`;
    console.log('Fetching course by ID:', url)
    const res = await fetch(url, { 
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      }, 
      credentials: 'include' 
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Course fetch failed:', { status: res.status, error });
      throw new Error(res.status === 404 ? 'Course not found' : `Failed to fetch course (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Course fetched:', data);
    return data;
  },

  async create(courseData: Partial<ICourse>, token?: string) {
    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
      body: JSON.stringify(courseData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create course');
    }
    return res.json();
  },

  async update(id: string, courseData: Partial<ICourse>, token?: string) {
    console.log('Updating course:', { id, courseData }); // Debug log
    if (!id) {
      console.error('Update course error: Course ID is missing');
      throw new Error('Course ID is required');
    }
    // Validate teacherIds
    if (courseData.teacherIds) {
      courseData.teacherIds.forEach(id => {
        if (typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
          console.error('Update course error: Invalid teacher ID:', id, 'Type:', typeof id);
          throw new Error(`Invalid teacher ID: ${JSON.stringify(id)}`);
        }
      });
    }
    // Ensure _id is not included in the body
    const { _id, ...updateData } = courseData;
    const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
      method: 'PUT',
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Course update failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to update course (status: ${res.status})`);
    }
    return res.json();
  },

  async delete(id: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
      method: 'DELETE',
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
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
  async getCurrentUser(token?: string): Promise<IUser | null> {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include', 
    });
    if (!res.ok) {
      console.error('User fetch failed:', { status: res.status });
      return null;
    }
    const data = await res.json();
    console.log('User fetched:', data);
    return data;
  },

  async getByRole(role: 'admin' | 'teacher' | 'student', token?: string) {
    const res = await fetch(`${BASE_URL}/api/auth/users?role=${role}`, {
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 404) {
        console.log(`No users found for role: ${role}`); 
        return [];
      }
      const error = await res.json().catch(() => ({}));
      console.error('Users fetch failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to fetch users (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Users fetched for role:', role, data); 
    return data || [];
  },
};

export const enrollmentApi = {
  async getEnrollmentRequests(studentId: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/enrollments?studentId=${studentId}`, {
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status !== 404) {
        const error = await res.json().catch(() => ({}));
        console.error('Enrollment requests fetch failed:', { status: res.status, error });
        throw new Error(error.error || `Failed to fetch enrollment requests (status: ${res.status})`);
      }
      return [];
    }
    const data = await res.json();
    console.log('Enrollment requests fetched:', data);
    return data || [];
  },

  async requestEnrollment(courseId: string, studentId: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/enrollments`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
      body: JSON.stringify({ courseId, studentId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit enrollment request');
    }
    return res.json();
  },

  async checkStatus(courseId: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/enrollments?courseId=${courseId}`, {
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error('Enrollment status fetch failed:', { status: res.status });
        throw new Error(`Failed to fetch enrollment status (status: ${res.status})`);
      }
      return [];
    }
    return res.json();
  },

  async getAll(params?: { status?: 'pending' | 'approved' | 'rejected'; courseId?: string }, token?: string) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.courseId) searchParams.append('courseId', params.courseId);
    const url = `${BASE_URL}/api/enrollments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, { 
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      }, 
      credentials: 'include' 
    });
    if (!res.ok) {
      if (res.status !== 404) {
        const error = await res.json().catch(() => ({}));
        console.error('Enrollments fetch failed:', { status: res.status, error });
        throw new Error(error.error || `Failed to fetch enrollment requests (status: ${res.status})`);
      }
      return [];
    }
    return res.json();
  },
};