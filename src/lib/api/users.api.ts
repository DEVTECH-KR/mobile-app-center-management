// src/lib/api/users.api.ts
import { IUser } from '@/server/api/auth/user.schema';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

const getHeaders = (includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

export const usersApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    classId?: string;
    promotion?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, token?: string) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.name) searchParams.append('name', params.name);
      if (params.email) searchParams.append('email', params.email);
      if (params.role) searchParams.append('role', params.role);
      if (params.status) searchParams.append('status', params.status);
      if (params.classId) searchParams.append('classId', params.classId);
      if (params.promotion) searchParams.append('promotion', params.promotion);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    }
    const url = `${BASE_URL}/api/auth/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to fetch users (status: ${res.status})`);
    }
    return res.json();
  },

  async getById(id: string, token?: string) {
    const url = `${BASE_URL}/api/auth/users/${id}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(res.status === 404 ? 'User not found' : `Failed to fetch user (status: ${res.status})`);
    }
    return res.json();
  },

  async update(id: string, updateData: { name?: string; email?: string; role?: string; status?: string }, token?: string) {
    if (!id) throw new Error('User ID is required');
    const res = await fetch(`${BASE_URL}/api/auth/users/${id}`, {
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
      throw new Error(error.error || `Failed to update user (status: ${res.status})`);
    }
    return res.json();
  },

  async updateRoleAndStatus(id: string, updateData: { role?: string; status?: string }, token?: string) {
    if (!id) throw new Error('User ID is required');
    const res = await fetch(`${BASE_URL}/api/auth/role-status`, {
      method: 'PUT',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ userId: id, ...updateData }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to update user (status: ${res.status})`);
    }
    return res.json();
  },

  async assignClasses(id: string, classIds: string[], token?: string) {
    if (!id) throw new Error('User ID is required');
    const res = await fetch(`${BASE_URL}/api/auth/assign-classes`, {
      method: 'PUT',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ userId: id, classIds }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to assign classes (status: ${res.status})`);
    }
    return res.json();
  },

  async delete(id: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(res.status === 404 ? 'User not found' : error.error || 'Failed to delete user');
    }
    return res.json();
  },

  async updateProfile(id: string, updateData: { name?: string; avatarUrl?: string | null }, token?: string) {
    if (!id) throw new Error('User ID is required');
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
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
      throw new Error(error.error || `Failed to update profile (status: ${res.status})`);
    }
    return res.json();
  },

  async removeFromClass(userId: string, classId: string, token?: string) {
    if (!userId) throw new Error('User ID is required');
    if (!classId) throw new Error('Class ID is required');
    
    const res = await fetch(`${BASE_URL}/api/auth/remove-from-class`, {
      method: 'PUT',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, classId }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to remove from class (status: ${res.status})`);
    }
    return res.json();
  },
};