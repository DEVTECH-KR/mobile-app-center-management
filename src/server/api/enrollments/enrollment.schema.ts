// src/server/api/enrollments/enrollment.schema.ts

import mongoose, { Schema, Document } from 'mongoose';
import { EnrollmentStatus } from '@/lib/types/payment.types';

/**
 * Interface représentant une demande d'inscription
 */
export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  preferredLevel?: string;
  status: EnrollmentStatus;
  requestDate: Date;
  approvalDate?: Date;
  assignedClassId?: mongoose.Types.ObjectId;
  adminNotes?: string;
  registrationFeePaid: boolean;
  paymentDate?: Date;
  expiresAt?: Date; 
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schéma MongoDB pour les demandes d'inscription
 */
const enrollmentSchema = new Schema<IEnrollment>({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true,
    index: true 
  },
  preferredLevel: { 
    type: String,
    trim: true 
  },
  status: { 
    type: String, 
    enum: Object.values(EnrollmentStatus), 
    default: EnrollmentStatus.PENDING,
    index: true 
  },
  requestDate: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  approvalDate: { 
    type: Date 
  },
  assignedClassId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Class' 
  },
  adminNotes: { 
    type: String,
    trim: true,
    maxlength: 1000 
  },
  registrationFeePaid: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  paymentDate: { 
    type: Date 
  },
  expiresAt: { 
    type: Date,
    index: true 
  }
}, { 
  timestamps: true 
});

/**
 * Index composé pour éviter les doublons d'inscription
 */
enrollmentSchema.index({ 
  studentId: 1, 
  courseId: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    status: { 
      $in: [EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED] 
    } 
  } 
});

/**
 * Index pour les recherches fréquentes
 */
enrollmentSchema.index({ 
  status: 1, 
  registrationFeePaid: 1 
});

/**
 * Middleware pour calculer la date d'expiration avant sauvegarde
 */
enrollmentSchema.pre('save', async function(next) {
  if (this.isNew && this.status === EnrollmentStatus.PENDING) {
    try {
      const { CenterSettingsService } = await import('../settings/center-settings.service');
      const settings = await CenterSettingsService.getSettings();
      const expirationHours = settings.enrollmentValidityHours || 48;
      
      this.expiresAt = new Date(this.requestDate.getTime() + expirationHours * 60 * 60 * 1000);
    } catch (error) {
      // Fallback à 48 heures si les paramètres ne sont pas disponibles
      this.expiresAt = new Date(this.requestDate.getTime() + 48 * 60 * 60 * 1000);
    }
  }
  next();
});

/**
 * Méthode pour vérifier si la demande a expiré
 */
enrollmentSchema.methods.hasExpired = function(): boolean {
  if (this.status !== EnrollmentStatus.PENDING || !this.expiresAt) {
    return false;
  }
  return new Date() > this.expiresAt;
};

/**
 * Méthode pour obtenir le temps restant avant expiration
 */
enrollmentSchema.methods.getRemainingTime = function(): { 
  hours: number; 
  minutes: number; 
  expired: boolean; 
} {
  if (this.status !== EnrollmentStatus.PENDING || !this.expiresAt) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const now = new Date();
  const diffMs = this.expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, expired: false };
};

/**
 * Méthode statique pour trouver les demandes expirées
 */
enrollmentSchema.statics.findExpiredRequests = function(): Promise<IEnrollment[]> {
  return this.find({
    status: EnrollmentStatus.PENDING,
    expiresAt: { $lt: new Date() }
  });
};

/**
 * Méthode statique pour obtenir les statistiques par statut
 */
enrollmentSchema.statics.getStatusCounts = function(): Promise<{ 
  _id: EnrollmentStatus; 
  count: number; 
}[]> {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

export const EnrollmentModel = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);