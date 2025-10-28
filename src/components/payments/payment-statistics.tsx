// src/components/payments/payment-statistics.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import { paymentsApi } from '@/lib/api/payments.api';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface PaymentStatisticsProps {
  payments: any[];
}

interface StatisticsData {
  revenueByMonth: { month: string; revenue: number }[];
  paymentStatusDistribution: { name: string; value: number; color: string }[];
  courseRevenue: { name: string; revenue: number; students: number }[];
  enrollmentStatus: { status: string; count: number }[];
  monthlyTrend: { month: string; paid: number; pending: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PaymentStatistics({ payments }: PaymentStatisticsProps) {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [payments]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const statsData = await paymentsApi.getStatistics(token);
      setStats(statsData);
      processChartData(statsData, payments);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = (statsData: any, paymentData: any[]): void => {
    // Revenue by month (last 6 months)
    const revenueByMonth = generateMonthlyRevenue(paymentData);
    
    // Payment status distribution
    const paymentStatusDistribution = [
      { name: 'Fully Paid', value: statsData.paidCount, color: '#10B981' },
      { name: 'Partial', value: statsData.partialCount, color: '#F59E0B' },
      { name: 'Unpaid', value: statsData.unpaidCount, color: '#EF4444' },
      { name: 'Refunded', value: statsData.refundedCount, color: '#6B7280' },
    ];

    // Course revenue
    const courseRevenue = calculateCourseRevenue(paymentData);

    // Enrollment status
    const enrollmentStatus = calculateEnrollmentStatus(paymentData);

    // Monthly trend
    const monthlyTrend = generateMonthlyTrend(paymentData);

    setChartData({
      revenueByMonth,
      paymentStatusDistribution,
      courseRevenue,
      enrollmentStatus,
      monthlyTrend
    });
  };

  const generateMonthlyRevenue = (payments: any[]) => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthlyRevenue = payments
        .filter(p => {
          const paymentDate = new Date(p.updatedAt);
          return paymentDate.getMonth() === date.getMonth() && 
                 paymentDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, p) => sum + p.totalPaid, 0);

      months.push({
        month: monthKey,
        revenue: monthlyRevenue
      });
    }

    return months;
  };

  const calculateCourseRevenue = (payments: any[]) => {
    const courseMap = new Map();
    
    payments.forEach(payment => {
      const courseId = payment.courseId._id;
      const courseName = payment.courseId.title;
      
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          name: courseName,
          revenue: 0,
          students: new Set()
        });
      }
      
      const courseData = courseMap.get(courseId);
      courseData.revenue += payment.totalPaid;
      courseData.students.add(payment.studentId._id);
    });

    return Array.from(courseMap.values()).map(course => ({
      name: course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name,
      revenue: course.revenue,
      students: course.students.size
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  };

  const calculateEnrollmentStatus = (payments: any[]) => {
    const statusCount = {
      approved: 0,
      pending: 0,
      rejected: 0,
      unknown: 0
    };

    payments.forEach(payment => {
      const status = payment.enrollmentId?.status || 'unknown';
      statusCount[status as keyof typeof statusCount]++;
    });

    return [
      { status: 'Approved', count: statusCount.approved },
      { status: 'Pending', count: statusCount.pending },
      { status: 'Rejected', count: statusCount.rejected },
      { status: 'Unknown', count: statusCount.unknown },
    ];
  };

  const generateMonthlyTrend = (payments: any[]) => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthlyData = payments.filter(p => {
        const paymentDate = new Date(p.updatedAt);
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear();
      });

      const paid = monthlyData.filter(p => p.totalPaid >= p.totalDue).length;
      const pending = monthlyData.filter(p => p.totalPaid < p.totalDue && p.totalPaid > 0).length;

      months.push({
        month: monthKey,
        paid,
        pending
      });
    }

    return months;
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "FBU",
    minimumFractionDigits: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats?.totalPayments || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.paidCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.paidCount && stats?.totalPayments 
                ? `${Math.round((stats.paidCount / stats.totalPayments) * 100)}% completion rate`
                : '0% completion rate'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.partialCount || 0) + (stats?.unpaidCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.partialCount || 0} partial, {stats?.unpaidCount || 0} unpaid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(stats?.averagePayment || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per payment record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>
                Revenue generated over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => currencyFormatter.format(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => [currencyFormatter.format(value), 'Revenue']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of payment completion status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData?.paymentStatusDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData?.paymentStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Payments']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enrollment Status</CardTitle>
                <CardDescription>
                  Current enrollment status distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData?.enrollmentStatus || []}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="status" 
                      width={80}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Students" 
                      fill="#8B5CF6" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Revenue Performance</CardTitle>
              <CardDescription>
                Top performing courses by revenue and student count
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData?.courseRevenue || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => currencyFormatter.format(value)}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? currencyFormatter.format(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Students'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="#10B981" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="students" 
                    name="Students" 
                    fill="#F59E0B" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Completion Trends</CardTitle>
              <CardDescription>
                Monthly trends in payment completion vs pending payments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData?.monthlyTrend || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    name="Completed Payments" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    name="Pending Payments" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <Badge variant="outline">
                  {stats?.paidCount && stats?.totalPayments 
                    ? `${Math.round((stats.paidCount / stats.totalPayments) * 100)}%`
                    : '0%'
                  }
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Refund Rate</span>
                <Badge variant="outline">
                  {stats?.refundedCount && stats?.totalPayments 
                    ? `${Math.round((stats.refundedCount / stats.totalPayments) * 100)}%`
                    : '0%'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Student Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Payments</span>
                <Badge variant="outline">
                  {stats?.partialCount || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">New This Month</span>
                <Badge variant="outline">
                  {chartData?.monthlyTrend?.[chartData.monthlyTrend.length - 1]?.paid || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Financial Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Revenue/Month</span>
                <Badge variant="outline">
                  {currencyFormatter.format(
                    chartData?.revenueByMonth 
                      ? chartData.revenueByMonth.reduce((sum, month) => sum + month.revenue, 0) / chartData.revenueByMonth.length
                      : 0
                  )}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Growth Trend</span>
                <Badge variant="outline">
                  {chartData?.revenueByMonth && chartData.revenueByMonth.length > 1
                    ? chartData.revenueByMonth[chartData.revenueByMonth.length - 1].revenue > chartData.revenueByMonth[0].revenue 
                      ? '📈 Growing' 
                      : '📉 Declining'
                    : '📊 Stable'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}