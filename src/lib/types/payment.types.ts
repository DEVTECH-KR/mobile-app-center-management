// src/lib/types/payment.types.ts

/**
 * Statuts des paiements
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

/**
 * Statuts des versements individuels
 */
export enum InstallmentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  PENDING = 'Pending',
  REFUNDED = 'Refunded'
}

/**
 * Statuts des demandes d'inscription
 */
export enum EnrollmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * Types de montants pour les versements
 */
export enum AmountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage'
}

/**
 * Rôles utilisateur
 */
export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
  TEACHER = 'teacher'
}

/**
 * Filtres disponibles pour les paiements
 */
export enum PaymentFilterType {
  STATUS = 'status',
  COURSE = 'course',
  CLASS = 'class',
  DATE_RANGE = 'dateRange',
  SEARCH = 'search'
}

/**
 * Interface de validation des actions de paiement
 */
export interface PaymentValidation {
  isValid: boolean;
  allowed: boolean;
  message?: string;
  enrollmentStatus?: EnrollmentStatus;
  paymentStatus?: PaymentStatus;
}

/**
 * Filtres pour la gestion des paiements
 */
export interface PaymentFilters {
  status: InstallmentStatus[];
  // courseId: string[];
  // classId: string[];
  // dateRange: {
  //   from: Date | null;
  //   to: Date | null;
  // };
  searchTerm: string;
}

/**
 * Résultat d'une opération de paiement
 */
export interface PaymentOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}