// src/components/enrollments/admin-enrollment-manager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { IEnrollment } from '@/server/api/enrollments/enrollment.schema';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { classesApi } from '@/lib/api/classes.api';
import { EnrollmentStatus, PaymentStatus } from '@/lib/types/payment.types';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

// ✅ Type pour les enrollments peuplés
type PopulatedEnrollment = Omit<IEnrollment, 'studentId' | 'courseId'> & {
  studentId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  courseId: {
    _id: string;
    title: string;
    price: number;
  };
  enrollmentStatus: EnrollmentStatus;
};

interface AdminEnrollmentManagerProps {
  enrollment: PopulatedEnrollment;
  onStatusUpdate: () => void;
}

export function AdminEnrollmentManager({ enrollment, onStatusUpdate }: AdminEnrollmentManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]); 
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    fetchClasses();
    fetchPaymentStatus();
  }, [enrollment.courseId._id, enrollment._id]);

  /**
   * Récupère les classes disponibles pour le cours
   */
  const fetchClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const result = await classesApi.getAvailableForEnrollment(
        enrollment.courseId._id, 
        enrollment.preferredLevel
      );
      setClasses(result || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec du chargement des classes disponibles",
      });
    } finally {
      setIsLoadingClasses(false);
    }
  };

  /**
   * Récupère le statut du paiement associé
   */
  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payments?studentId=${enrollment.studentId._id}&courseId=${enrollment.courseId._id}`);
      if (response.ok) {
        const payments = await response.json();
        if (payments.length > 0) {
          setPaymentStatus(payments[0].paymentStatus);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du paiement:', error);
    }
  };

  /**
   * Enregistre le paiement des frais d'inscription
   */
  const handleRecordPayment = async () => {

    if (!enrollment._id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de demande manquant",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/enrollments/${enrollment._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de l\'enregistrement du paiement');
      }

      toast({
        title: "Succès",
        description: "Paiement des frais d'inscription enregistré avec succès",
      });

      onStatusUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Échec de l'enregistrement du paiement",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Met à jour le statut de la demande d'inscription
   */
  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated or user ID not found",
      });
      return;
    }

    if (!enrollment._id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de demande manquant",
      });
      return;
    }

    // ✅ Validation pour l'approbation
    if (status === 'approved' && !enrollment.registrationFeePaid) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Les frais d'inscription doivent être payés avant l'approbation",
      });
      return;
    }

    if (status === 'approved' && !selectedClass) {
      toast({
        variant: "destructive",
        title: "Action impossible",
        description: "Veuillez sélectionner une classe avant d'approuver",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = status === 'approved' 
        ? `/api/enrollments/${enrollment._id}/approve`
        : `/api/enrollments/${enrollment._id}/reject`;

      const body = status === 'approved'
        ? { 
            classId: selectedClass, 
            adminNotes: adminNotes.trim() || undefined,
            assignedBy: user.id // À remplacer par l'ID de l'admin connecté
          }
        : { 
            adminNotes: adminNotes.trim() || undefined,
            assignedBy: user.id // À remplacer par l'ID de l'admin connecté
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Échec de la mise à jour du statut: ${status}`);
      }

      toast({
        title: "Succès",
        description: `Demande d'inscription ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      });

      onStatusUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Échec de la mise à jour du statut",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Vérifie si la demande peut être approuvée
   */
  const canApprove = enrollment.registrationFeePaid && selectedClass && adminNotes.trim().length > 0;

  /**
   * Vérifie si la demande peut être rejetée
   */
  const canReject = adminNotes.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gérer la Demande d'Inscription</span>
          <Badge variant={
            enrollment.status === EnrollmentStatus.APPROVED ? "default" :
            enrollment.status === EnrollmentStatus.PENDING ? "secondary" : "destructive"
          }>
            {enrollment.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ✅ Statut du paiement */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Frais d'Inscription:</span>
            <div className="flex items-center gap-2">
              {enrollment.registrationFeePaid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">Payés</span>
                  {enrollment.paymentDate && (
                    <span className="text-sm text-muted-foreground">
                      le {new Date(enrollment.paymentDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 font-medium">En attente</span>
                </>
              )}
            </div>
          </div>
          {paymentStatus && (
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Statut global du paiement: </span>
              <Badge variant="outline" className="ml-1 capitalize">
                {paymentStatus}
              </Badge>
            </div>
          )}
        </div>

        {/* Notes d'administration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Notes d'Administration
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Textarea
            placeholder="Ajoutez des notes concernant cette demande d'inscription..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Les notes sont obligatoires pour l'approbation ou le rejet
          </p>
        </div>

        {/* ✅ Actions pour les demandes en attente */}
        {enrollment.status === EnrollmentStatus.PENDING && (
          <>
            {/* Bouton d'enregistrement de paiement */}
            {!enrollment.registrationFeePaid && (
              <Button 
                onClick={handleRecordPayment}
                disabled={isSubmitting}
                variant="secondary"
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Enregistrer le Paiement des Frais d'Inscription
              </Button>
            )}

            {/* Sélection de classe */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Assigner une Classe
                <span className="text-red-500 ml-1">*</span>
              </label>
              {isLoadingClasses ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des classes disponibles...
                </div>
              ) : classes.length > 0 ? (
                <Select onValueChange={setSelectedClass} value={selectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une classe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name} ({cls.level})
                        {cls.schedule && ` - ${cls.schedule}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded border">
                  <AlertTriangle className="h-4 w-4" />
                  Aucune classe disponible pour ce cours et ce niveau
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {enrollment.preferredLevel && `Niveau préféré: ${enrollment.preferredLevel}`}
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isSubmitting || !canReject}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Rejeter
              </Button>
              <Button
                onClick={() => handleStatusUpdate('approved')}
                disabled={isSubmitting || !canApprove}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approuver
              </Button>
            </div>

            {/* ✅ Messages d'aide */}
            {!canApprove && enrollment.status === EnrollmentStatus.PENDING && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                <p className="font-medium">Conditions pour l'approbation:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {!enrollment.registrationFeePaid && (
                    <li>Frais d'inscription doivent être payés</li>
                  )}
                  {!selectedClass && <li>Une classe doit être sélectionnée</li>}
                  {!adminNotes.trim() && <li>Des notes d'administration sont requises</li>}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ✅ Informations pour les demandes traitées */}
        {enrollment.status !== EnrollmentStatus.PENDING && enrollment.adminNotes && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Notes d'Administration:</h4>
            <p className="text-sm">{enrollment.adminNotes}</p>
            {enrollment.approvalDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Traité le {new Date(enrollment.approvalDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}