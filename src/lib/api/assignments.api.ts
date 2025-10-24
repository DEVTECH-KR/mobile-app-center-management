const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

const getHeaders = (includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

export const assignmentsApi = {
  // Get assignment for a specific student
  async getByStudentId(studentId: string, token?: string) {
    const url = `${BASE_URL}/api/assignments/student?studentId=${studentId}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to fetch assignment (status: ${res.status})`);
    }
    
    return res.json();
  },

  // Add classes to student assignment
  async addClasses(studentId: string, classIds: string[], assignedBy: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
      body: JSON.stringify({ studentId, classIds, assignedBy }),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to assign classes (status: ${res.status})`);
    }
    
    return res.json();
  },

  // Remove classes from student assignment
    async removeClasses(userId: string, classIds: string[], token?: string) {
        const res = await fetch(`${BASE_URL}/api/assignments/remove`, {
            method: 'PUT',
            headers: {
            ...getHeaders(),
            Authorization: token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
            body: JSON.stringify({ userId, classIds }),
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `Failed to remove classes (status: ${res.status})`);
        }
        
        return res.json();
    },

  // Remove all classes from student
  async removeAllClasses(studentId: string, token?: string) {
    return this.removeClasses(studentId, [], token);
  },

  // Get all assignments with optional filtering
  async getAll(params?: { studentId?: string; classId?: string }, token?: string) {
    const searchParams = new URLSearchParams();
    if (params?.studentId) searchParams.append('studentId', params.studentId);
    if (params?.classId) searchParams.append('classId', params.classId);

    const url = `${BASE_URL}/api/assignments${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `Failed to fetch assignments (status: ${res.status})`);
    }
    
    return res.json();
  },

  // Get available classes for a student
  async getAvailableClasses(studentId: string, token?: string) {
    const url = `${BASE_URL}/api/assignments/available?studentId=${studentId}`;
    const res = await fetch(url, {
        headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
    });
    
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to fetch available classes (status: ${res.status})`);
    }
    
    return res.json();
    },

    // Get assigned classes count for a student
  async getAssignedClassesCount(studentId: string, token?: string) {
    const url = `${BASE_URL}/api/assignments/count?studentId=${studentId}`;
    const res = await fetch(url, {
        headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
    });
    
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to fetch classes count (status: ${res.status})`);
    }
    
    return res.json();
  },

    // Get detailed assigned classes for a student
  async getStudentAssignedClasses(studentId: string, token?: string) {
    const url = `${BASE_URL}/api/assignments/student-classes?studentId=${studentId}`;
    const res = await fetch(url, {
        headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
    });
    
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to fetch student classes (status: ${res.status})`);
    }
    
    return res.json();
  },
  
};