// src/lib/api/payments.api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

const getHeaders = (includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

export const paymentsApi = {
  async getAll(token?: string) {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payments');
    }
    return res.json();
  },

  async getByStudent(studentId: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/payments?studentId=${studentId}`, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch student payments');
    }
    return res.json();
  },

  async recordPayment(paymentId: string, installmentName: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ 
        paymentId, 
        installmentName, 
        status: 'Paid', 
        paymentDate: new Date().toISOString() 
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Payment record error:', errorData);
      throw new Error(errorData.error || `Failed to record payment (status: ${res.status})`);
    }

    return res.json();
  },

  async getStatistics(token?: string) {
    const res = await fetch(`${BASE_URL}/api/payments/stats`, {
      headers: {
        ...getHeaders(),
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch payment statistics');
    }
    return res.json();
  },
  
};