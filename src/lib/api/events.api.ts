import { IEvent } from "@/server/api/events/events.schema";

// Determine the base URL based on the environment
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window === 'undefined' ? 'http://localhost:9002' : '');

const getHeaders = (includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

export const eventsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    title?: string;
    description?: string;
    details?: string;
    isPast?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, token?: string) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.title) searchParams.append('title', params.title);
      if (params.description) searchParams.append('description', params.description);
      if (params.details) searchParams.append('details', params.details);
      if (params.isPast !== undefined) searchParams.append('isPast', params.isPast.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    }
    const url = `${BASE_URL}/api/events${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url, { 
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      }, 
      credentials: 'include' 
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Events fetch failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to fetch events (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Events fetched:', data);
    return data;
  },

  async getById(id: string, token?: string) {
    const url = `${BASE_URL}/api/events/${id}`;
    console.log('Fetching event by ID:', url);
    const res = await fetch(url, { 
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      }, 
      credentials: 'include' 
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('Event fetch failed:', { status: res.status, error });
      throw new Error(res.status === 404 ? 'Event not found' : `Failed to fetch event (status: ${res.status})`);
    }
    const data = await res.json();
    console.log('Event fetched:', data);
    return data;
  },

  async create(eventData: Partial<IEvent>, token?: string) {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create event');
    }
    return res.json();
  },

  async update(id: string, eventData: Partial<IEvent>, token?: string) {
    console.log('Updating event:', { id, eventData });
    if (!id) throw new Error('Event ID is required');
    const { _id, ...updateData } = eventData;
    const res = await fetch(`${BASE_URL}/api/events/${id}`, {
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
      console.error('Event update failed:', { status: res.status, error });
      throw new Error(error.error || `Failed to update event (status: ${res.status})`);
    }
    return res.json();
  },

  async delete(id: string, token?: string) {
    const res = await fetch(`${BASE_URL}/api/events/${id}`, {
      method: 'DELETE',
      headers: { 
        ...getHeaders(), 
        Authorization: token ? `Bearer ${token}` : ''
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(res.status === 404 ? 'Event not found' : error.error || 'Failed to delete event');
    }
    return res.json();
  },
};