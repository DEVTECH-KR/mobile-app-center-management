// src/server/api/events/events.service.ts
import { EventModel, IEvent } from './events.schema';

interface FilterOptions {
  title?: string;
  description?: string;
  details?: string;
  isPast?: boolean;  // Filter upcoming (false) or past (true)
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class EventService {
  // ============================
  // Créer un nouvel event
  // ============================
  static async create(eventData: Partial<IEvent>): Promise<IEvent> {
    const event = await EventModel.create(eventData);
    return event;
  }

  // ============================
  // Récupérer tous les events avec filtres et pagination
  // ============================
  static async getAll(
    filters: FilterOptions = {},
    { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' }: PaginationOptions = {}
  ) {
    const query: any = {};
    if (filters.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters.description) query.description = { $regex: filters.description, $options: 'i' };
    if (filters.details) query.details = { $regex: filters.details, $options: 'i' };
    if (filters.isPast !== undefined) {

      const now = new Date();
      query.date = filters.isPast ? { $lt: now } : { $gte: now };
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [events, total] = await Promise.all([
      EventModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      EventModel.countDocuments(query)
    ]);

    // Optionally update isPast on fetch, but for perf, do it on create/update
    return {
      events: events.map(e => ({
        ...e.toObject(),
        isPast: e.date < new Date()  // Compute dynamically for accuracy
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  // ============================
  // Récupérer un event par ID
  // ============================
  static async getById(id: string): Promise<IEvent> {
    const event = await EventModel.findById(id);
    if (!event) throw new Error('Event not found');
    return {
      ...event.toObject(),
      isPast: event.date < new Date()
    };
  }

  // ============================
  // Mettre à jour un event
  // ============================
  static async update(id: string, updateData: Partial<IEvent>): Promise<IEvent> {
    const event = await EventModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!event) throw new Error('Event not found');
    return {
      ...event.toObject(),
      isPast: event.date < new Date()
    };
  }

  // ============================
  // Supprimer un event
  // ============================
  static async delete(id: string): Promise<IEvent> {
    const event = await EventModel.findByIdAndDelete(id);
    if (!event) throw new Error('Event not found');
    return event;
  }
}