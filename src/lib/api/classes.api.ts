import { IClass } from '@/server/api/classes/class.schema';
import { IUser } from '@/server/api/auth/user.schema';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window === 'undefined' ? 'http://localhost:9002' : '');

const getHeaders = (includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

export const classesApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    name?: string;
    courseId?: string;
    courseTitle?: string;
    teacherName?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    availableForEnrollment?: string;
  }, token?: string) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.name) searchParams.append('name', params.name);
      if (params.courseTitle) searchParams.append('courseTitle', params.courseTitle);
      if (params.teacherName) searchParams.append('teacherName', params.teacherName);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.availableForEnrollment) {
        searchParams.append('availableForEnrollment', params.availableForEnrollment);
      }    
    }
    const url = `${BASE_URL}/api/classes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Classes fetch failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to fetch classes (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Classes fetched:', data);
    return data;
  },

  async getById(id: string, token?: string) {
    const url = `${BASE_URL}/api/classes/${id}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Class fetch failed:', { status: res.status, error });
      throw new Error(res.status === 404 ? 'Class not found' : `Failed to fetch class (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Class fetched:', data);
    return data;
  },

  async create(classData: Partial<IClass>, token?: string) {
    const res = await fetch(`${BASE_URL}/api/classes`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify(classData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create class');
    }
    return res.json();
  },

  async update(id: string, classData: Partial<IClass>, token?: string) {
    if (!id) throw new Error('Class ID is required');
    const { _id, ...updateData } = classData;
    const res = await fetch(`${BASE_URL}/api/classes/${id}`, {
      method: 'PUT',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Class update failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to update class (status: ${res.status})`);
    }
    return res.json();
  },

  async getTeachersForCourse(courseId: string, token?: string) {
    const url = `${BASE_URL}/api/classes?getTeachersForCourse=${courseId}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Teachers fetch failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to fetch teachers (status: ${res.status})`);
    }
    const data = await res.json();
    return data.teachers || [];
  },

  async delete(id: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/classes/${id}`, {
      method: 'DELETE',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(res.status === 404 ? 'Class not found' : error.error || 'Failed to delete class');
    }
    return res.json();
  },

  async getAvailableForEnrollment(courseId: string, preferredLevel?: string, token?: string) {
    const searchParams = new URLSearchParams();
    searchParams.append('availableForEnrollment', 'true');
    searchParams.append('courseId', courseId);
    if (preferredLevel) searchParams.append('preferredLevel', preferredLevel);

    const url = `${BASE_URL}/api/classes?${searchParams.toString()}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to fetch available classes`);
    }
    
    const data = await res.json();
    return data.classes || [];
  },
  
};