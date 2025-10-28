// src/app/dashboard/payments/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPaymentManager } from "@/components/dashboard/admin-payment-manager";
import { PaymentStatusCard } from "@/components/dashboard/payment-status-card";
import { paymentsApi } from '@/lib/api/payments.api';
import { useAuth } from '@/lib/auth';
import { Loader2, AlertTriangle, TrendingUp, Users, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentStatus } from '@/lib/types/payment.types';
import { PaymentStatistics } from "@/components/payments/payment-statistics";

export default function PaymentsPage() {
  const { user, token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all"); // ✅ Nouvel état pour suivre l'onglet actif
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPayments();
      if (user.role === 'admin') {
        fetchStats();
      }
    }
  }, [user, token]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const data = user?.role === 'admin' 
        ? await paymentsApi.getAll(token)
        : await paymentsApi.getByStudent(user.id, token);
      setPayments(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load payments",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await paymentsApi.getStatistics(token);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // ✅ Fonction pour gérer le changement d'onglet
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          {user?.role === "admin" ? "Manage Payments" : "My Payments"}
        </h2>
        <p className="text-muted-foreground">
          {user?.role === "admin"
            ? "View and manage all student payment records."
            : "Track your tuition fees and payment history for your enrolled courses."}
        </p>
      </div>

      {user?.role === 'admin' ? (
        <>
          {/* ✅ Statistics for admin - CACHÉES sur l'onglet "stats" */}
          {stats && activeTab !== "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPayments}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.paidCount} fully paid
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'FBU' }).format(stats.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'FBU' }).format(stats.averagePayment)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.partialCount + stats.unpaidCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.partialCount} partial, {stats.unpaidCount} unpaid
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.refundedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Refunded payments
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Management Tabs */}
          <Tabs defaultValue="all" className="space-y-4" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Payments</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="attention">Requires Attention</TabsTrigger>
              <TabsTrigger value="stats">Detailed Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <AdminPaymentManager 
                payments={payments} 
                onUpdate={fetchPayments} 
              />
            </TabsContent>
            
            <TabsContent value="pending">
              <AdminPaymentManager 
                payments={payments.filter(p => 
                  p.totalPaid < p.totalDue &&
                  p.enrollmentId?.status === EnrollmentStatus.APPROVED
                )} 
                onUpdate={fetchPayments} 
              />
            </TabsContent>
            
            <TabsContent value="attention">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Overdue Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminPaymentManager 
                        payments={payments.filter(p => {
                          const hasOverdue = p.installments.some((inst: any) => 
                            inst.status === 'Unpaid' && 
                            inst.dueDate && 
                            new Date(inst.dueDate) < new Date()
                          );
                          return hasOverdue && p.enrollmentId?.status === EnrollmentStatus.APPROVED;
                        })} 
                        onUpdate={fetchPayments} 
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-blue-600" />
                        Pending Registration Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminPaymentManager 
                        payments={payments.filter(p => 
                          !p.installments.some((inst: any) => inst.isInitialFee && inst.status === 'Paid') &&
                          p.enrollmentId?.status === EnrollmentStatus.PENDING
                        )} 
                        onUpdate={fetchPayments} 
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="stats">
              <PaymentStatistics payments={payments} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        /* Student Interface */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payments.map(payment => (
            <PaymentStatusCard key={payment._id} paymentDetails={payment} />
          ))}
          {payments.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No payment records found</h3>
              <p>You don't have any payment records for your courses yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}