// src/server/api/payments/payment.service.ts
import { Types } from 'mongoose';
import { IPayment, PaymentModel } from './payment.schema';
import { CourseModel } from '../courses/course.schema';
import { EnrollmentService } from '../enrollments/enrollment.service';
import { CenterSettingsService } from '../settings/center-settings.service';
import { InstallmentTemplateService } from '../installment-templates/installment-template.service';
import { EnrollmentStatus, InstallmentStatus, PaymentOperationResult, PaymentStatus, PaymentValidation } from '@/lib/types/payment.types';

export class PaymentService {

  /**
   * Valide si une action de paiement est autorisée
   * @param enrollmentId ID de la demande d'inscription
   * @param action Action à valider
   * @returns Résultat de la validation
   */
  static async validatePaymentAction(
    enrollmentId: string, 
    action: string
  ): Promise<PaymentValidation> {
    try {
      const { EnrollmentModel } = await import('../enrollments/enrollment.schema');
      const enrollment = await EnrollmentModel.findById(enrollmentId);
      
      if (!enrollment) {
        return {
          isValid: false,
          allowed: false,
          message: 'Demande d\'inscription non trouvée'
        };
      }

      // ✅ Empêcher toute action sur les demandes rejetées ou supprimées
      if ([EnrollmentStatus.REJECTED, 'deleted'].includes(enrollment.status)) {
        return {
          isValid: false,
          allowed: false,
          message: `Action non autorisée: la demande est ${enrollment.status}`,
          enrollmentStatus: enrollment.status as EnrollmentStatus
        };
      }

      return {
        isValid: true,
        allowed: true,
        enrollmentStatus: enrollment.status as EnrollmentStatus
      };
    } catch (error) {
      return {
        isValid: false,
        allowed: false,
        message: `Erreur de validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }


  /**
   * Crée un enregistrement de paiement initial
   * @param enrollmentId ID de la demande d'inscription
   * @param studentId ID de l'étudiant
   * @param courseId ID du cours
   * @returns Payment créé
   */
  static async createInitialPayment(
    enrollmentId: string, 
    studentId: string, 
    courseId: string
  ): Promise<IPayment> {
    const [course, settings, template] = await Promise.all([
      CourseModel.findById(courseId),
      CenterSettingsService.getSettings(),
      InstallmentTemplateService.getByCourse(courseId)
    ]);

    if (!course) throw new Error('Cours non trouvé');

    const registrationFee = settings.registrationFee || 0;
    const totalDue = course.price + registrationFee;

    let installments = [];
    if (template && template.installments.length > 0) {
      // Utiliser le template dynamique
      installments = template.installments.map((inst, index) => ({
        name: inst.name,
        amountType: inst.amountType,
        amount: inst.amountType === 'percentage' 
          ? (course.price * inst.amount / 100) 
          : inst.amount,
        status: InstallmentStatus.UNPAID,
        dueDate: new Date(Date.now() + inst.dueOffsetDays * 24 * 60 * 60 * 1000),
        isInitialFee: index === 0 // ✅ Premier versement = frais initiaux
      }));
    } else {
      // Fallback vers le système actuel
      installments = [
        {
          name: 'Frais d\'Inscription',
          amountType: 'fixed' as const,
          amount: registrationFee,
          status: InstallmentStatus.UNPAID,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          isInitialFee: true // ✅ Identifié comme frais initiaux
        },
        {
          name: 'Première Tranche',
          amountType: 'percentage' as const,
          amount: course.price / 4,
          status: InstallmentStatus.UNPAID,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isInitialFee: false
        },
        {
          name: 'Deuxième Tranche',
          amountType: 'percentage' as const,
          amount: course.price / 4,
          status: InstallmentStatus.UNPAID,
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isInitialFee: false
        },
        {
          name: 'Troisième Tranche',
          amountType: 'percentage' as const,
          amount: course.price / 4,
          status: InstallmentStatus.UNPAID,
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isInitialFee: false
        },
        {
          name: 'Quatrième Tranche',
          amountType: 'percentage' as const,
          amount: course.price / 4,
          status: InstallmentStatus.UNPAID,
          dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          isInitialFee: false
        },
      ];
    }

    return await PaymentModel.create({
      enrollmentId: new Types.ObjectId(enrollmentId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      registrationFee,
      totalDue,
      totalPaid: 0,
      installments,
    });
  }



  /**
   * Récupère les détails d'un paiement pour un étudiant et un cours
   * @param studentId ID de l'étudiant
   * @param courseId ID du cours
   * @returns Détails du paiement
   */
  static async getPaymentDetails(studentId: string, courseId: string): Promise<IPayment> {
    // ✅ Validation des IDs
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
      throw new Error('IDs invalides');
    }

    const payment = await PaymentModel.findOne({ studentId, courseId })
      .populate('studentId', 'name email avatarUrl')
      .populate('courseId', 'title price description')
      .populate('enrollmentId', 'status registrationFeePaid');

    if (!payment) {
      throw new Error('Enregistrement de paiement non trouvé');
    }

    return payment;
  }

  /**
   * Récupère tous les paiements d'un étudiant
   * @param studentId ID de l'étudiant
   * @returns Liste des paiements de l'étudiant
   */
  static async getStudentPayments(studentId: string): Promise<IPayment[]> {
    // ✅ Validation de l'ID
    if (!Types.ObjectId.isValid(studentId)) {
      throw new Error('ID étudiant invalide');
    }

    return await PaymentModel.find({ studentId })
      .populate('courseId', 'title price imageUrl levels')
      .populate('enrollmentId', 'status assignedClassId')
      .sort({ createdAt: -1 });
  }

  /**
   * Récupère tous les paiements avec filtres (pour administrateur)
   * @param filter Filtres de recherche
   * @returns Liste des paiements filtrés
   */
  static async getAllPayments(filter: { 
    status?: string; 
    courseId?: string; 
    studentId?: string;
    enrollmentStatus?: EnrollmentStatus;
  } = {}): Promise<IPayment[]> {
    const query: any = {};
    
    // ✅ Filtres de base
    if (filter.courseId && Types.ObjectId.isValid(filter.courseId)) {
      query.courseId = new Types.ObjectId(filter.courseId);
    }
    if (filter.studentId && Types.ObjectId.isValid(filter.studentId)) {
      query.studentId = new Types.ObjectId(filter.studentId);
    }

    const payments = await PaymentModel.find(query)
      .populate('studentId', 'name email avatarUrl phone')
      .populate('courseId', 'title price levels')
      .populate('enrollmentId', 'status assignedClassId adminNotes')
      .sort({ updatedAt: -1 });

    // ✅ Filtrage par statut dérivé (en mémoire)
    if (filter.status) {
      return payments.filter(payment => {
        const totalPaid = payment.totalPaid;
        const totalDue = payment.totalDue;
        
        switch (filter.status) {
          case 'Paid':
            return totalPaid >= totalDue;
          case 'Partial':
            return totalPaid > 0 && totalPaid < totalDue;
          case 'Unpaid':
            return totalPaid === 0;
          default:
            return true;
        }
      });
    }

    // ✅ Filtrage par statut d'inscription
    if (filter.enrollmentStatus) {
      return payments.filter(payment => {
        const enrollment = payment.enrollmentId as any;
        return enrollment?.status === filter.enrollmentStatus;
      });
    }

    return payments;
  }

  /**
   * Met à jour le statut d'un versement avec validation
   * @param paymentId ID du paiement
   * @param installmentName Nom du versement
   * @param updates Nouvelles valeurs
   * @returns Payment mis à jour
   */
  static async updateInstallment(
    paymentId: string,
    installmentName: string,
    updates: { 
      status: InstallmentStatus; 
      paymentDate?: Date;
      updatedBy: string;
    }
  ): Promise<IPayment> {
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) throw new Error('Paiement non trouvé');

    // ✅ Validation de l'action
    if (payment.enrollmentId) {
      const validation = await this.validatePaymentAction(
        payment.enrollmentId.toString(), 
        'mettre à jour le paiement'
      );
      if (!validation.allowed) {
        throw new Error(validation.message);
      }
    }

    const installment = payment.installments.find(i => i.name === installmentName);
    if (!installment) throw new Error('Versement non trouvé');

    // ✅ Empêcher les doubles paiements
    if (updates.status === InstallmentStatus.PAID && installment.status === InstallmentStatus.PAID) {
      throw new Error('Ce versement est déjà payé');
    }

    // ✅ Empêcher de marquer comme impayé un versement déjà payé
    if (updates.status === InstallmentStatus.UNPAID && installment.status === InstallmentStatus.PAID) {
      throw new Error('Impossible de marquer comme impayé un versement déjà payé');
    }

    const oldStatus = installment.status;
    installment.status = updates.status;
    
    if (updates.paymentDate) {
      installment.paymentDate = updates.paymentDate;
    } else if (updates.status === InstallmentStatus.PAID) {
      installment.paymentDate = new Date();
    }

    // Mettre à jour le total payé
    if (oldStatus !== InstallmentStatus.PAID && updates.status === InstallmentStatus.PAID) {
      payment.totalPaid += installment.amount;
    } else if (oldStatus === InstallmentStatus.PAID && updates.status !== InstallmentStatus.PAID) {
      payment.totalPaid -= installment.amount;
      installment.paymentDate = undefined;
    }

    // Mettre à jour le statut global du paiement
    this.updatePaymentStatus(payment);

    await payment.save();

    // ✅ Mettre à jour l'inscription si frais initiaux payés
    if (installment.isInitialFee && updates.status === InstallmentStatus.PAID) {
      try {
        const enrollment = await import('../enrollments/enrollment.schema')
          .then(mod => mod.EnrollmentModel.findOne({ _id: payment.enrollmentId }));
        
        if (enrollment && !enrollment.registrationFeePaid) {
          await EnrollmentService.recordPayment(enrollment._id.toString());
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'inscription:', error);
      }
    }

    // ✅ Audit
    const { AuditService } = await import('../audit/audit.service');
    AuditService.logAction(
      'update_installment', 
      updates.updatedBy, 
      paymentId, 
      'Payment', 
      { 
        installmentName, 
        oldStatus, 
        newStatus: updates.status,
        amount: installment.amount 
      }
    );

    return payment;
  }

  // Record registration fee (shortcut)
  // static async recordRegistrationFee(paymentId: string) {
  //   return this.updateInstallment(paymentId, 'Registration Fee', {
  //     status: InstallmentStatus.PAID,
  //     paymentDate: new Date(),
  //   });
  // }

  /**
   * Récupère les statistiques des paiements (pour administrateur)
   * @returns Statistiques détaillées des paiements
   */
  static async getStatistics(): Promise<{
    totalPayments: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
    totalRevenue: number;
    averagePayment: number;
    refundedCount: number;
  }> {
    const [
      totalPayments,
      paidCount,
      partialCount,
      unpaidCount,
      refundedCount,
      revenueResult
    ] = await Promise.all([
      // Nombre total de paiements
      PaymentModel.countDocuments(),
      
      // Paiements complètement payés
      PaymentModel.countDocuments({ 
        $expr: { $gte: ['$totalPaid', '$totalDue'] },
        paymentStatus: { $ne: PaymentStatus.REFUNDED }
      }),
      
      // Paiements partiels
      PaymentModel.countDocuments({ 
        $expr: { 
          $and: [
            { $gt: ['$totalPaid', 0] },
            { $lt: ['$totalPaid', '$totalDue'] }
          ]
        },
        paymentStatus: { $ne: PaymentStatus.REFUNDED }
      }),
      
      // Paiements non payés
      PaymentModel.countDocuments({ 
        totalPaid: 0,
        paymentStatus: { $ne: PaymentStatus.REFUNDED }
      }),
      
      // Paiements remboursés
      PaymentModel.countDocuments({ 
        paymentStatus: PaymentStatus.REFUNDED 
      }),
      
      // Revenu total
      PaymentModel.aggregate([
        { 
          $match: { 
            paymentStatus: { $ne: PaymentStatus.REFUNDED } 
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$totalPaid' } 
          } 
        }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

    return {
      totalPayments,
      paidCount,
      partialCount,
      unpaidCount,
      refundedCount,
      totalRevenue,
      averagePayment: Math.round(averagePayment)
    };
  }


  /**
   * Met à jour le statut global du paiement
   * @param payment Paiement à mettre à jour
   */
  private static updatePaymentStatus(payment: IPayment): void {
    const totalInstallments = payment.installments.length;
    const paidInstallments = payment.installments.filter(
      inst => inst.status === InstallmentStatus.PAID
    ).length;

    if (paidInstallments === 0) {
      payment.paymentStatus = PaymentStatus.PENDING;
    } else if (paidInstallments === totalInstallments) {
      payment.paymentStatus = PaymentStatus.COMPLETED;
    } else {
      payment.paymentStatus = PaymentStatus.PENDING;
    }
  }


  /**
   * Rembourse un paiement
   * @param enrollmentId ID de la demande d'inscription
   * @param reason Raison du remboursement
   * @param refundedBy ID de l'admin qui effectue le remboursement
   * @returns Résultat de l'opération
   */
  static async refundPayment(
    enrollmentId: string, 
    reason: string, 
    refundedBy: string
  ): Promise<PaymentOperationResult> {
    const payment = await PaymentModel.findOne({ enrollmentId });
    if (!payment) {
      return {
        success: false,
        message: 'Enregistrement de paiement non trouvé'
      };
    }

    // Vérifier si un remboursement est nécessaire
    if (payment.totalPaid === 0) {
      payment.paymentStatus = PaymentStatus.CANCELLED;
      await payment.save();
      
      return {
        success: true,
        message: 'Paiement annulé (aucun remboursement nécessaire)',
        data: { refundAmount: 0 }
      };
    }

    try {
      // Marquer tous les versements payés comme remboursés
      await PaymentModel.updateOne(
        { _id: payment._id },
        {
          $set: {
            paymentStatus: PaymentStatus.REFUNDED,
            refundReason: reason,
            refundDate: new Date(),
            refundedBy: new Types.ObjectId(refundedBy),
            'installments.$[elem].status': InstallmentStatus.REFUNDED,
            'installments.$[elem].refundDate': new Date()
          }
        },
        {
          arrayFilters: [
            { 'elem.status': InstallmentStatus.PAID }
          ]
        }
      );

      const updatedPayment = await PaymentModel.findById(payment._id);
      if (!updatedPayment) {
        throw new Error('Échec de la mise à jour de l\'enregistrement de paiement');
      }

      // Audit
      const { AuditService } = await import('../audit/audit.service');
      AuditService.logAction('refund_payment', refundedBy, payment._id.toString(), 'Payment', {
        enrollmentId,
        reason,
        amountRefunded: payment.totalPaid
      });

      return {
        success: true,
        message: 'Remboursement effectué avec succès',
        data: { 
          payment: updatedPayment,
          refundAmount: payment.totalPaid 
        }
      };
    } catch (error: any) {
      console.error('Erreur de remboursement:', error);
      return {
        success: false,
        message: `Échec du traitement du remboursement: ${error.message}`,
        error: error.message
      };
    }
  }


  /**
   * Annule un paiement (pour expiration)
   * @param enrollmentId ID de la demande d'inscription
   * @param reason Raison de l'annulation
   * @returns Résultat de l'opération
   */
  static async cancelPayment(
    enrollmentId: string, 
    reason: string
  ): Promise<PaymentOperationResult> {
    const payment = await PaymentModel.findOne({ enrollmentId });
    if (!payment) {
      return {
        success: false,
        message: 'Enregistrement de paiement non trouvé'
      };
    }

    try {
      payment.paymentStatus = PaymentStatus.CANCELLED;
      payment.refundReason = reason;
      await payment.save();

      return {
        success: true,
        message: 'Paiement annulé avec succès',
        data: { 
          payment,
          refundAmount: 0 
        }
      };
    } catch (error: any) {
      console.error('Erreur d\'annulation:', error);
      return {
        success: false,
        message: `Échec de l'annulation du paiement: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Marque un paiement comme complété (lors de l'approbation)
   * @param enrollmentId ID de la demande d'inscription
   * @returns Résultat de l'opération
   */
  static async completePayment(enrollmentId: string): Promise<PaymentOperationResult> {
    const payment = await PaymentModel.findOne({ enrollmentId });
    if (!payment) {
      return {
        success: false,
        message: 'Enregistrement de paiement non trouvé'
      };
    }

    try {
      // ✅ Validation - vérifier que les frais initiaux sont payés
      const initialFee = payment.installments.find(inst => inst.isInitialFee);
      if (!initialFee || initialFee.status !== InstallmentStatus.PAID) {
        return {
          success: false,
          message: 'Les frais d\'inscription doivent être payés avant de compléter le paiement'
        };
      }

      payment.paymentStatus = PaymentStatus.COMPLETED;
      await payment.save();

      return {
        success: true,
        message: 'Paiement marqué comme complété avec succès',
        data: { payment }
      };
    } catch (error: any) {
      console.error('Erreur de complétion du paiement:', error);
      return {
        success: false,
        message: `Échec de la complétion du paiement: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Supprime un enregistrement de paiement (uniquement si aucune transaction)
   * @param enrollmentId ID de la demande d'inscription
   * @returns Résultat de l'opération
   */
  static async deletePayment(enrollmentId: string): Promise<PaymentOperationResult> {
    const payment = await PaymentModel.findOne({ enrollmentId });
    if (!payment) {
      return {
        success: true,
        message: 'Enregistrement de paiement non trouvé ou déjà supprimé'
      };
    }

    // ✅ Empêcher la suppression s'il y a eu des transactions financières
    if (payment.totalPaid > 0) {
      return {
        success: false,
        message: 'Impossible de supprimer un enregistrement de paiement avec des transactions financières'
      };
    }

    // ✅ Vérifier le statut de l'inscription associée
    try {
      const { EnrollmentModel } = await import('../enrollments/enrollment.schema');
      const enrollment = await EnrollmentModel.findById(enrollmentId);
      
      if (enrollment && enrollment.status === EnrollmentStatus.APPROVED) {
        return {
          success: false,
          message: 'Impossible de supprimer le paiement d\'une inscription approuvée'
        };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'inscription:', error);
    }

    try {
      await PaymentModel.deleteOne({ enrollmentId });
      
      return {
        success: true,
        message: 'Enregistrement de paiement supprimé avec succès'
      };
    } catch (error: any) {
      console.error('Erreur de suppression du paiement:', error);
      return {
        success: false,
        message: `Échec de la suppression du paiement: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Vérifie si un paiement peut être remboursé
   * @param enrollmentId ID de la demande d'inscription
   * @returns True si le remboursement est possible
   */
  static async canRefundPayment(enrollmentId: string): Promise<boolean> {
    const payment = await PaymentModel.findOne({ enrollmentId });
    if (!payment) return false;

    // ✅ Conditions pour le remboursement
    const hasPaidAmount = payment.totalPaid > 0;
    const isNotRefunded = payment.paymentStatus !== PaymentStatus.REFUNDED;
    const isNotCancelled = payment.paymentStatus !== PaymentStatus.CANCELLED;
    const hasValidEnrollment = payment.enrollmentId !== undefined;

    return hasPaidAmount && isNotRefunded && isNotCancelled && hasValidEnrollment;
  }



  /**
   * Récupère les paiements nécessitant une attention (pour dashboard admin)
   * @returns Paiements nécessitant une action
   */
  static async getPaymentsRequiringAttention(): Promise<{
    pendingRegistrations: IPayment[];
    overduePayments: IPayment[];
    partialPayments: IPayment[];
  }> {
    const [pendingRegistrations, overduePayments, partialPayments] = await Promise.all([
      // Paiements avec frais d'inscription en attente
      PaymentModel.find({
        'installments': {
          $elemMatch: {
            isInitialFee: true,
            status: InstallmentStatus.UNPAID
          }
        },
        'enrollmentId': { $exists: true }
      })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .populate('enrollmentId', 'status requestDate')
      .limit(10),

      // Paiements en retard
      PaymentModel.find({
        'installments': {
          $elemMatch: {
            status: InstallmentStatus.UNPAID,
            dueDate: { $lt: new Date() }
          }
        }
      })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .limit(10),

      // Paiements partiels récents
      PaymentModel.find({
        totalPaid: { $gt: 0, $lt: '$totalDue' },
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 derniers jours
      })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .limit(10)
    ]);

    return {
      pendingRegistrations,
      overduePayments,
      partialPayments
    };
  }
}