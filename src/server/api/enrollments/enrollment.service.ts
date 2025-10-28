// src/server/api/enrollments/enrollment.service.ts

import { Types } from 'mongoose';
import { EnrollmentModel, IEnrollment } from './enrollment.schema';
import { UserModel } from '../auth/user.schema';
import { CourseModel } from '../courses/course.schema';
import { EmailService } from '@/server/services/email.service';
import { CenterSettingsService } from '../settings/center-settings.service';
import { ClassModel } from '../models';
import { PaymentService } from '../payments/payment.service';
import { AssignmentService } from '../assignments/assignment.service';
import cron from 'node-cron';
import { AuditService } from '../audit/audit.service';
import { 
  EnrollmentStatus,
  PaymentStatus,
  InstallmentStatus,
  PaymentOperationResult 
} from '@/lib/types/payment.types';

export class EnrollmentService {

  /**
   * Crée une nouvelle demande d'inscription
   * @param studentId ID de l'étudiant
   * @param courseId ID du cours
   * @param preferredLevel Niveau préféré (optionnel)
   * @returns Demande d'inscription créée
   */
  static async createRequest(
    studentId: string, 
    courseId: string, 
    preferredLevel?: string
  ): Promise<IEnrollment> {
    // ✅ Validation de l'existence de l'étudiant
    const student = await UserModel.findById(studentId);
    if (!student) {
      throw new Error('Étudiant non trouvé');
    }

    // ✅ Validation de l'existence du cours
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Cours non trouvé');
    }

    // ✅ Vérifier les inscriptions existantes
    const existingEnrollment = await EnrollmentModel.findOne({
      studentId,
      courseId,
      status: { $in: [EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED] }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.PENDING) {
        throw new Error('Vous avez déjà une demande d\'inscription en attente pour ce cours');
      } else {
        throw new Error('Vous êtes déjà inscrit à ce cours');
      }
    }

    // ✅ Créer la demande d'inscription
    const enrollmentRequest = await EnrollmentModel.create({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      preferredLevel,
      status: EnrollmentStatus.PENDING,
      requestDate: new Date(),
      registrationFeePaid: false
    });

    // ✅ Créer l'enregistrement de paiement initial
    await PaymentService.createInitialPayment(
      enrollmentRequest._id.toString(), 
      studentId, 
      courseId
    );

    // ✅ Envoyer l'email de confirmation
    try {
      await EmailService.sendEnrollmentRequestConfirmation(student.email, {
        studentName: student.name,
        courseName: course.title,
        courseDetails: `Prix: ${course.price}, Description: ${course.description.substring(0, 200)}..., Niveau préféré: ${preferredLevel || 'Non spécifié'}`,
      });
    } catch (emailError) {
      console.error('Erreur d\'envoi d\'email:', emailError);
      // Ne pas bloquer la création si l'email échoue
    }

    // ✅ Journalisation d'audit
    AuditService.logAction(
      'create_enrollment_request', 
      studentId, 
      enrollmentRequest._id.toString(), 
      'Enrollment', 
      { 
        courseId, 
        preferredLevel,
        courseTitle: course.title
      }
    );

    // ✅ Peupler et retourner la demande créée
    return await enrollmentRequest.populate([
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'courseId', select: 'title price' }
    ]);
  }

  /**
   * Récupère une demande d'inscription par son ID avec tous les détails
   * @param requestId ID de la demande
   * @returns Demande d'inscription détaillée
   */
  static async getRequestById(requestId: string): Promise<IEnrollment> {
    // ✅ Validation de l'ID
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('ID de demande d\'inscription invalide');
    }

    const request = await EnrollmentModel.findById(requestId)
      .populate('studentId', 'name email avatarUrl gender nationality educationLevel university address phone')
      .populate('courseId', 'title description price days levels teacherIds imageUrl')
      .populate({
        path: 'courseId',
        populate: {
          path: 'teacherIds',
          select: 'name email avatarUrl'
        }
      })
      .populate('assignedClassId', 'name level schedule');

    if (!request) {
      throw new Error('Demande d\'inscription non trouvée');
    }

    return request;
  }

  /**
   * Récupère toutes les demandes d'inscription d'un étudiant
   * @param studentId ID de l'étudiant
   * @returns Liste des demandes de l'étudiant
   */
  static async getStudentRequests(studentId: string): Promise<IEnrollment[]> {
    // ✅ Validation de l'ID
    if (!Types.ObjectId.isValid(studentId)) {
      throw new Error('ID étudiant invalide');
    }

    return await EnrollmentModel.find({ studentId })
      .populate('courseId', 'title price imageUrl levels')
      .populate('assignedClassId', 'name level')
      .sort({ requestDate: 'desc' });
  }

  /**
   * Récupère toutes les demandes d'inscription avec filtres
   * @param filter Filtres de recherche
   * @returns Liste des demandes filtrées
   */
  static async getAllRequests(filter: { 
    status?: EnrollmentStatus; 
    courseId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<IEnrollment[]> {
    const query: any = {};
    
    // ✅ Filtre par statut
    if (filter.status) {
      query.status = filter.status;
    }
    
    // ✅ Filtre par cours
    if (filter.courseId && Types.ObjectId.isValid(filter.courseId)) {
      query.courseId = new Types.ObjectId(filter.courseId);
    }
    
    // ✅ Filtre par date
    if (filter.dateFrom || filter.dateTo) {
      query.requestDate = {};
      if (filter.dateFrom) query.requestDate.$gte = filter.dateFrom;
      if (filter.dateTo) query.requestDate.$lte = filter.dateTo;
    }

    return await EnrollmentModel.find(query)
      .populate('studentId', 'name email avatarUrl phone')
      .populate('courseId', 'title price levels')
      .populate('assignedClassId', 'name level')
      .sort({ requestDate: 'desc' });
  }

  /**
   * Approuve une demande d'inscription
   * @param requestId ID de la demande
   * @param adminData Données de l'administrateur
   * @returns Demande approuvée
   */
  static async approveRequest(
    requestId: string, 
    adminData: { 
      classId: string; 
      adminNotes?: string; 
      assignedBy: string;
    }
  ): Promise<IEnrollment> {
    // ✅ Récupération et validation de la demande
    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Demande d\'inscription non trouvée');
    }

    // ✅ Vérification du statut
    if (request.status !== EnrollmentStatus.PENDING) {
      throw new Error(`Impossible d'approuver une demande avec le statut: ${request.status}`);
    }

    // ✅ Vérification du paiement des frais d'inscription
    if (!request.registrationFeePaid) {
      throw new Error('Les frais d\'inscription doivent être payés avant l\'approbation');
    }

    // ✅ Validation de la classe
    const classExists = await ClassModel.findById(adminData.classId);
    if (!classExists) {
      throw new Error('Classe non trouvée');
    }

    // ✅ Mise à jour de la demande
    request.status = EnrollmentStatus.APPROVED;
    request.approvalDate = new Date();
    request.assignedClassId = new Types.ObjectId(adminData.classId);
    request.adminNotes = adminData.adminNotes;
    await request.save();

    // ✅ Marquer le paiement comme complété
    const paymentResult = await PaymentService.completePayment(requestId);
    if (!paymentResult.success) {
      console.warn('Avertissement: Échec de la complétion du paiement:', paymentResult.message);
    }

    // ✅ Assigner l'étudiant à la classe
    await AssignmentService.addClasses(
      request.studentId.toString(), 
      [adminData.classId], 
      adminData.assignedBy
    );

    // ✅ Mettre à jour l'utilisateur avec le cours inscrit
    await UserModel.findByIdAndUpdate(request.studentId, {
      $push: {
        enrolledCourses: {
          courseId: request.courseId,
          classId: request.assignedClassId,
          status: EnrollmentStatus.APPROVED,
          enrollmentDate: request.requestDate,
          approvalDate: request.approvalDate,
          registrationFeePaid: true,
        },
        enrolledCourseIds: request.courseId,
        classIds: request.assignedClassId
      },
      $set: {
        accessLevel: 'full' // ✅ Déverrouiller l'accès complet
      }
    });

    // ✅ Envoyer l'email d'approbation
    try {
      const [student, course, assignedClass] = await Promise.all([
        UserModel.findById(request.studentId).select('name email'),
        CourseModel.findById(request.courseId).select('title'),
        ClassModel.findById(request.assignedClassId).select('name schedule')
      ]);

      if (student && course && assignedClass) {
        await EmailService.sendEnrollmentApproval(student.email, {
          studentName: student.name,
          courseName: course.title,
          className: assignedClass.name,
          // schedule: assignedClass.schedule
        });
      }
    } catch (emailError) {
      console.error('Erreur d\'envoi d\'email d\'approbation:', emailError);
    }

    // ✅ Journalisation d'audit
    AuditService.logAction(
      'approve_enrollment', 
      adminData.assignedBy, 
      requestId, 
      'Enrollment', 
      { 
        classId: adminData.classId, 
        studentId: request.studentId.toString(),
        courseId: request.courseId.toString()
      }
    );

    // ✅ Retourner la demande peuplée
    return await request.populate([
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'courseId', select: 'title price' },
      { path: 'assignedClassId', select: 'name level schedule' }
    ]);
  }

  /**
   * Rejette une demande d'inscription
   * @param requestId ID de la demande
   * @param adminData Données de l'administrateur
   * @returns Demande rejetée
   */
  static async rejectRequest(
    requestId: string, 
    adminData: { 
      adminNotes?: string; 
      assignedBy: string;
    }
  ): Promise<IEnrollment> {
    // ✅ Récupération et validation de la demande
    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Demande d\'inscription non trouvée');
    }

    // ✅ Vérification du statut
    if (request.status !== EnrollmentStatus.PENDING) {
      throw new Error(`Impossible de rejeter une demande avec le statut: ${request.status}`);
    }

    // ✅ Mise à jour de la demande
    request.status = EnrollmentStatus.REJECTED;
    request.adminNotes = adminData.adminNotes;
    await request.save();

    let refundInfo = '';
    
    // ✅ Gestion du remboursement si paiement effectué
    if (request.registrationFeePaid) {
      try {
        const refundResult = await PaymentService.refundPayment(
          requestId, 
          `Inscription rejetée: ${adminData.adminNotes || 'Aucune raison fournie'}`,
          adminData.assignedBy
        );

        if (refundResult.success) {
          refundInfo = `Un remboursement de ${refundResult.data?.refundAmount || 0} FBU sera traité dans les 7-14 jours ouvrables.`;
        } else {
          refundInfo = 'Erreur lors du traitement du remboursement. Veuillez contacter l\'administration.';
        }
      } catch (paymentError: any) {
        console.error('Erreur de traitement du remboursement:', paymentError);
        refundInfo = 'Le traitement du remboursement a rencontré un problème. Veuillez contacter l\'administration.';
        
        // ✅ Journalisation de l'erreur
        AuditService.logAction(
          'refund_failed', 
          adminData.assignedBy, 
          requestId, 
          'Enrollment', 
          {
            error: paymentError.message,
            adminNotes: adminData.adminNotes
          }
        );
      }
    }

    // ✅ Envoyer l'email de rejet
    try {
      const [student, course] = await Promise.all([
        UserModel.findById(request.studentId).select('name email'),
        CourseModel.findById(request.courseId).select('title')
      ]);

      if (student && course) {
        await EmailService.sendEnrollmentRejection(student.email, {
          studentName: student.name,
          courseName: course.title,
          reason: adminData.adminNotes || 'Aucune raison fournie',
          refundInfo
        });
      }
    } catch (emailError) {
      console.error('Erreur d\'envoi d\'email de rejet:', emailError);
    }

    // ✅ Journalisation d'audit
    AuditService.logAction(
      'reject_enrollment', 
      adminData.assignedBy, 
      requestId, 
      'Enrollment', 
      { 
        adminNotes: adminData.adminNotes,
        refundProcessed: request.registrationFeePaid,
        refundInfo
      }
    );

    return await request.populate([
      { path: 'studentId', select: 'name email avatarUrl' },
      { path: 'courseId', select: 'title price' }
    ]);
  }

  /**
   * Enregistre le paiement des frais d'inscription
   * @param requestId ID de la demande
   * @returns Demande mise à jour
   */
  static async recordPayment(requestId: string): Promise<IEnrollment> {
    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Demande d\'inscription non trouvée');
    }

    // ✅ Vérifications
    if (request.registrationFeePaid) {
      throw new Error('Les frais d\'inscription sont déjà payés');
    }

    if (request.status !== EnrollmentStatus.PENDING) {
      throw new Error('Seules les demandes en attente peuvent enregistrer des paiements');
    }

    // ✅ Mise à jour de la demande
    request.registrationFeePaid = true;
    request.paymentDate = new Date();
    await request.save();

    // ✅ Mettre à jour le niveau d'accès de l'utilisateur
    await UserModel.findByIdAndUpdate(request.studentId, {
      accessLevel: 'full'
    });

    // ✅ Journalisation d'audit
    AuditService.logAction(
      'record_registration_payment', 
      'system', 
      requestId, 
      'Enrollment', 
      {
        studentId: request.studentId.toString(),
        amount: request.registrationFeePaid
      }
    );

    return request;
  }

  /**
   * Récupère les statistiques des inscriptions
   * @returns Statistiques des inscriptions
   */
  static async getStatistics(): Promise<Record<EnrollmentStatus, number>> {
    const stats = await EnrollmentModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // ✅ Formatage des résultats avec valeurs par défaut
    const result = {
      [EnrollmentStatus.PENDING]: 0,
      [EnrollmentStatus.APPROVED]: 0,
      [EnrollmentStatus.REJECTED]: 0
    };

    stats.forEach(stat => {
      result[stat._id as EnrollmentStatus] = stat.count;
    });

    return result;
  }

  /**
   * Vérifie le statut d'un étudiant pour un cours
   * @param studentId ID de l'étudiant
   * @param courseId ID du cours
   * @returns Statut de l'inscription
   */
  static async getCourseStatus(studentId: string, courseId: string): Promise<{
    status: EnrollmentStatus | 'not_enrolled';
    registrationFeePaid?: boolean;
    requestDate?: Date;
    approvalDate?: Date;
    assignedClassId?: string;
  }> {
    // ✅ Validation des IDs
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
      throw new Error("ID étudiant ou cours invalide");
    }

    // ✅ Vérification de l'existence du cours
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Cours non trouvé");
    }

    // ✅ Vérification de l'inscription existante
    const enrollment = await EnrollmentModel.findOne({ studentId, courseId });

    if (!enrollment) {
      return { status: "not_enrolled" };
    }

    return {
      status: enrollment.status,
      registrationFeePaid: enrollment.registrationFeePaid,
      requestDate: enrollment.requestDate,
      approvalDate: enrollment.approvalDate,
      assignedClassId: enrollment.assignedClassId?.toString()
    };
  }

  /**
   * Supprime une demande d'inscription
   * @param requestId ID de la demande
   * @param deletedBy ID de l'utilisateur qui supprime
   * @returns Résultat de la suppression
   */
  static async deleteRequest(
    requestId: string, 
    deletedBy: string
  ): Promise<{
    message: string;
    paymentAction?: string;
    refundAmount?: number;
  }> {
    // ✅ Validation de l'ID
    if (!Types.ObjectId.isValid(requestId)) {
      throw new Error('ID de demande d\'inscription invalide');
    }

    const request = await EnrollmentModel.findById(requestId);
    if (!request) {
      throw new Error('Demande d\'inscription non trouvée');
    }

    // ✅ Vérification si la demande peut être supprimée
    if (request.status === EnrollmentStatus.APPROVED) {
      throw new Error('Impossible de supprimer une demande d\'inscription approuvée');
    }

    // ✅ Gestion du paiement avant suppression
    let paymentAction: { message: string; refundAmount?: number } = { 
      message: 'Aucune action de paiement nécessaire' 
    };
    
    if (request.registrationFeePaid) {
      try {
        // ✅ Remboursement si paiement effectué
        const refundResult = await PaymentService.refundPayment(
          requestId, 
          'Demande d\'inscription supprimée', 
          deletedBy
        );
        
        paymentAction = {
          message: refundResult.message,
          refundAmount: refundResult.data?.refundAmount
        };
        
        // ✅ Envoyer l'email de remboursement
        const student = await UserModel.findById(request.studentId).select('name email');
        const course = await CourseModel.findById(request.courseId).select('title');
        
        if (student && course) {
          try {
            await EmailService.sendRefundNotification(student.email, {
              studentName: student.name,
              courseName: course.title,
              refundAmount: paymentAction.refundAmount || 0,
              reason: 'Demande d\'inscription supprimée'
            });
          } catch (emailError) {
            console.error('Erreur d\'envoi d\'email de remboursement:', emailError);
          }
        }
      } catch (refundError: any) {
        console.error('Erreur de traitement du remboursement lors de la suppression:', refundError);
        paymentAction.message = `Échec du traitement du remboursement: ${refundError.message}`;
        
        // ✅ Journalisation de l'erreur
        AuditService.logAction(
          'refund_failed_during_deletion', 
          deletedBy, 
          requestId, 
          'Enrollment', 
          {
            error: refundError.message
          }
        );
      }
    } else {
      try {
        // ✅ Supprimer le paiement si aucun versement effectué
        const deleteResult = await PaymentService.deletePayment(requestId);
        paymentAction.message = deleteResult.message;
      } catch (deleteError: any) {
        console.error('Erreur de suppression du paiement:', deleteError);
        paymentAction.message = `Échec de la suppression du paiement: ${deleteError.message}`;
      }
    }

    // ✅ Supprimer la demande
    await EnrollmentModel.findByIdAndDelete(requestId);

    // ✅ Journalisation d'audit
    AuditService.logAction(
      'delete_enrollment', 
      deletedBy, 
      requestId, 
      'Enrollment', 
      {
        studentId: request.studentId.toString(),
        courseId: request.courseId.toString(),
        status: request.status,
        paymentAction: paymentAction.message,
        refundAmount: paymentAction.refundAmount || 0
      }
    );

    return { 
      message: 'Demande d\'inscription supprimée avec succès',
      paymentAction: paymentAction.message,
      refundAmount: paymentAction.refundAmount
    };
  }
}

// ✅ Job Cron pour l'expiration des demandes en attente >48h
cron.schedule('0 0 * * *', async () => {
  try {
    const settings = await CenterSettingsService.getSettings();
    const expirationHours = settings.enrollmentValidityHours || 48;
    const expirationDate = new Date(Date.now() - expirationHours * 60 * 60 * 1000);

    const expiredRequests = await EnrollmentModel.find({
      status: EnrollmentStatus.PENDING,
      requestDate: { $lt: expirationDate },
      registrationFeePaid: false // Seulement celles sans paiement
    });

    for (const req of expiredRequests) {
      try {
        // ✅ Annuler le paiement sans remboursement (pas de paiement effectué)
        const cancelResult = await PaymentService.cancelPayment(
          req._id.toString(), 
          'Demande expirée - aucun paiement dans le délai imparti'
        );
        
        // ✅ Marquer comme rejeté
        req.status = EnrollmentStatus.REJECTED;
        req.adminNotes = 'Demande expirée - aucun paiement dans le délai imparti';
        await req.save();

        // ✅ Envoyer l'email d'expiration
        const student = await UserModel.findById(req.studentId).select('name email');
        const course = await CourseModel.findById(req.courseId).select('title');
        
        if (student && course) {
          await EmailService.sendEnrollmentExpiration(student.email, {
            studentName: student.name,
            courseName: course.title,
            validityHours: expirationHours
          });
        }

        // ✅ Journalisation d'audit
        AuditService.logAction(
          'expire_enrollment', 
          'system', 
          req._id.toString(), 
          'Enrollment', 
          {
            reason: 'Demande expirée - aucun paiement dans le délai imparti',
            validityHours: expirationHours
          }
        );

      } catch (error) {
        console.error(`Échec du traitement de l'inscription expirée ${req._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Erreur du job cron d\'expiration des inscriptions:', error);
  }
});