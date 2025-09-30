// src/lib/api/courses.api.ts
/**
 * Course API Utility Functions
 * Handles all HTTP requests related to courses
 */

// Helper to get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper to create headers with auth token
const getHeaders = (includeContentType: boolean = true): HeadersInit => {
  const headers: HeadersInit = {};
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Course API Functions
export const coursesApi = {
  /**
   * Fetch all courses with optional filters and pagination
   */
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
      if (params.days) params.days.forEach(day => searchParams.append('days', day));
      if (params.levels) params.levels.forEach(level => searchParams.append('levels', level));
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    }
    
    const url = `/api/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    
    return response.json();
  },

  /**
   * Fetch a single course by ID
   */
  async getById(id: string) {
    const response = await fetch(`/api/courses/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Course not found');
      }
      throw new Error('Failed to fetch course');
    }
    
    return response.json();
  },

  /**
   * Create a new course (Admin only)
   */
  async create(courseData: {
    title: string;
    description: string;
    price: number;
    teacherIds: string[];
    days: string[];
    startTime: string;
    endTime: string;
    imageUrl: string;
    imageHint?: string;
    levels: string[];
  }) {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create course');
    }
    
    return response.json();
  },

  /**
   * Update an existing course (Admin only)
   */
  async update(id: string, courseData: Partial<{
    title: string;
    description: string;
    price: number;
    teacherIds: string[];
    days: string[];
    startTime: string;
    endTime: string;
    imageUrl: string;
    imageHint?: string;
    levels: string[];
  }>) {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 404) {
        throw new Error('Course not found');
      }
      throw new Error(error.error || 'Failed to update course');
    }
    
    return response.json();
  },

  /**
   * Delete a course (Admin only)
   */
  async delete(id: string) {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (response.status === 404) {
        throw new Error('Course not found');
      }
      throw new Error(error.error || 'Failed to delete course');
    }
    
    return response.json();
  },
};

// User API Functions
export const usersApi = {
  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const token = getAuthToken();
    if (!token) {
      return null;
    }
    
    const response = await fetch('/api/auth/me', {
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  },

  /**
   * Get users by role
   */
  async getByRole(role: 'admin' | 'teacher' | 'student') {
    const response = await fetch(`/api/users?role=${role}`, {
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  },
};

// Enrollment API Functions
export const enrollmentApi = {
  /**
   * Submit enrollment request for a course
   */
  async requestEnrollment(courseId: string) {
    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ courseId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit enrollment request');
    }
    
    return response.json();
  },

  /**
   * Check enrollment status for a course
   */
  async checkStatus(courseId: string) {
    const response = await fetch(`/api/enrollments?courseId=${courseId}`, {
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  },

  /**
   * Get all enrollment requests (Admin/Teacher only)
   */
  async getAll(params?: {
    status?: 'pending' | 'approved' | 'rejected';
    courseId?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.append('status', params.status);
    if (params?.courseId) searchParams.append('courseId', params.courseId);
    
    const url = `/api/enrollments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(false),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollment requests');
    }
    
    return response.json();
  },
};