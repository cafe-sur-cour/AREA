'use client';

import Navigation from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Zap, Activity, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  // Mock data
  const dashboardStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalActions: 5324,
    successRate: 98.5,
    failedActions: 78,
    averageResponseTime: 245,
  };

  const recentActivities = [
    { id: 1, user: "John Doe", action: "Created workflow", timestamp: "2 hours ago", status: "success" },
    { id: 2, user: "Jane Smith", action: "Updated settings", timestamp: "4 hours ago", status: "success" },
    { id: 3, user: "Bob Wilson", action: "Failed action execution", timestamp: "6 hours ago", status: "error" },
    { id: 4, user: "Alice Brown", action: "Deleted workflow", timestamp: "1 day ago", status: "success" },
    { id: 5, user: "Charlie Davis", action: "Added new reaction", timestamp: "1 day ago", status: "success" },
  ];

  const topServices = [
    { name: "GitHub", actions: 1245, reactions: 892 },
    { name: "Slack", actions: 1120, reactions: 756 },
    { name: "Spotify", actions: 856, reactions: 612 },
    { name: "Discord", actions: 543, reactions: 389 },
  ];

  return (
    <div className='min-h-screen bg-app-background'>
      <Navigation />
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='font-heading text-4xl font-bold text-app-text-primary mb-2'>
            Admin Dashboard
          </h1>
          <p className='text-app-text-secondary'>Welcome back! Here's your application overview.</p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {/* Total Users */}
          <Card className='bg-app-surface border-app-border-light'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
              <Users className='h-4 w-4 text-primary' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-app-text-primary'>{dashboardStats.totalUsers}</div>
              <p className='text-xs text-app-text-secondary mt-1'>
                {dashboardStats.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className='bg-app-surface border-app-border-light'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
              <Activity className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-app-text-primary'>{dashboardStats.activeUsers}</div>
              <p className='text-xs text-app-text-secondary mt-1'>
                {((dashboardStats.activeUsers / dashboardStats.totalUsers) * 100).toFixed(1)}% of total users
              </p>
            </CardContent>
          </Card>

          {/* Total Actions */}
          <Card className='bg-app-surface border-app-border-light'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Actions</CardTitle>
              <Zap className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-app-text-primary'>{dashboardStats.totalActions}</div>
              <p className='text-xs text-app-text-secondary mt-1'>
                {dashboardStats.failedActions} failed actions
              </p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className='bg-app-surface border-app-border-light'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
              <TrendingUp className='h-4 w-4 text-emerald-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-app-text-primary'>{dashboardStats.successRate}%</div>
              <div className='w-full bg-app-background rounded-full h-2 mt-2'>
                <div
                  className='bg-emerald-500 h-2 rounded-full'
                  style={{ width: `${dashboardStats.successRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Response Time */}
          <Card className='bg-app-surface border-app-border-light'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Avg Response Time</CardTitle>
              <Activity className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-app-text-primary'>{dashboardStats.averageResponseTime}ms</div>
              <p className='text-xs text-app-text-secondary mt-1'>Last 24 hours</p>
            </CardContent>
          </Card>

          {/* Failed Actions */}
          <Card className='bg-app-surface border-app-border-light'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Failed Actions</CardTitle>
              <AlertCircle className='h-4 w-4 text-red-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-app-text-primary'>{dashboardStats.failedActions}</div>
              <p className='text-xs text-app-text-secondary mt-1'>
                {((dashboardStats.failedActions / dashboardStats.totalActions) * 100).toFixed(2)}% failure rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          {/* Recent Activities */}
          <div className='lg:col-span-2'>
            <Card className='bg-app-surface border-app-border-light'>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className='flex items-center justify-between pb-4 border-b border-app-border-light last:border-b-0'>
                      <div className='flex items-center gap-3'>
                        {activity.status === 'success' ? (
                          <CheckCircle className='h-5 w-5 text-green-500' />
                        ) : (
                          <AlertCircle className='h-5 w-5 text-red-500' />
                        )}
                        <div>
                          <p className='text-sm font-medium text-app-text-primary'>{activity.action}</p>
                          <p className='text-xs text-app-text-secondary'>{activity.user}</p>
                        </div>
                      </div>
                      <span className='text-xs text-app-text-secondary'>{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Services */}
          <div>
            <Card className='bg-app-surface border-app-border-light'>
              <CardHeader>
                <CardTitle>Top Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {topServices.map((service, index) => (
                    <div key={index} className='pb-4 border-b border-app-border-light last:border-b-0'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-sm font-medium text-app-text-primary'>{service.name}</p>
                        <span className='text-xs bg-primary/10 text-primary px-2 py-1 rounded'>
                          {service.actions + service.reactions}
                        </span>
                      </div>
                      <div className='text-xs text-app-text-secondary space-y-1'>
                        <p>Actions: {service.actions}</p>
                        <p>Reactions: {service.reactions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Links */}
        <Card className='bg-app-surface border-app-border-light'>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <Link href="/admin/users" className='block'>
                <Button variant='outline' className='w-full'>
                  <Users className='w-4 h-4 mr-2' />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/actions" className='block'>
                <Button variant='outline' className='w-full'>
                  <Zap className='w-4 h-4 mr-2' />
                  Manage Actions
                </Button>
              </Link>
              <Link href="/admin/services" className='block'>
                <Button variant='outline' className='w-full'>
                  <Activity className='w-4 h-4 mr-2' />
                  Manage Services
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}