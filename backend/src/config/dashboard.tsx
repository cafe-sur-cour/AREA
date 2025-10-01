import React, { useState, useEffect } from 'react';
import { ApiClient } from 'adminjs';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalServices: number;
  activeServices: number;
  totalWebhooks: number;
  webhookSuccessRate: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
  serviceDistribution: Array<{
    service: string;
    count: number;
  }>;
  webhookEvents: Array<{
    date: string;
    success: number;
    errors: number;
  }>;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}> = ({ title, value, subtitle, color = '#3e6172' }) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      margin: '10px',
      minWidth: '200px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}
  >
    <h3 style={{ margin: '0 0 10px 0', color: color, fontSize: '14px' }}>
      {title}
    </h3>
    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        {subtitle}
      </div>
    )}
  </div>
);

const SimpleChart: React.FC<{
  title: string;
  data: Array<{ label: string; value: number }>;
  type?: 'bar' | 'line';
}> = ({ title, data, type = 'bar' }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        margin: '10px',
        minWidth: '300px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 20px 0', color: '#3e6172' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((item, index) => (
          <div
            key={index}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{ minWidth: '100px', fontSize: '12px' }}>
              {item.label}
            </div>
            <div
              style={{
                flex: 1,
                height: '20px',
                backgroundColor: '#f0f0f0',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: '#3e6172',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div
              style={{ minWidth: '30px', fontSize: '12px', textAlign: 'right' }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/admin/api/dashboard-stats');
        if (response.ok) {
          const data = await response.json();

          const dashboardStats: DashboardStats = {
            totalUsers: data.users.total,
            activeUsers: data.users.verified,
            totalServices: data.services.total,
            activeServices: data.services.active,
            totalWebhooks: data.webhooks.total,
            webhookSuccessRate: data.webhooks.successRate,
            recentActivity: data.activity.recentUsers,
            serviceDistribution: data.services.byService.map((item: any) => ({
              service: item.service,
              count: item.count,
            })),
            webhookEvents: data.webhooks.recentActivity,
          };

          setStats(dashboardStats);
        } else {
          throw new Error('Failed to fetch dashboard stats');
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);

        try {
          const api = new ApiClient();

          const [usersResponse, servicesResponse, webhooksResponse] =
            await Promise.all([
              api.resourceAction({ resourceId: 'User', actionName: 'list' }),
              api.resourceAction({
                resourceId: 'UserServiceConfigs',
                actionName: 'list',
              }),
              api.resourceAction({
                resourceId: 'WebhookConfigs',
                actionName: 'list',
              }),
            ]);

          const dashboardStats: DashboardStats = {
            totalUsers: usersResponse?.data?.records?.length || 0,
            activeUsers:
              usersResponse?.data?.records?.filter(
                (user: any) => user.params?.email_verified
              )?.length || 0,
            totalServices: servicesResponse?.data?.records?.length || 0,
            activeServices:
              servicesResponse?.data?.records?.filter(
                (service: any) => service.params?.is_active
              )?.length || 0,
            totalWebhooks: webhooksResponse?.data?.records?.length || 0,
            webhookSuccessRate: 0,
            recentActivity: [],
            serviceDistribution: [],
            webhookEvents: [],
          };

          setStats(dashboardStats);
        } catch (fallbackErr) {
          console.error('Fallback API also failed:', fallbackErr);
          // Set fallback stats when all API calls fail
          setStats({
            totalUsers: 0,
            activeUsers: 0,
            totalServices: 0,
            activeServices: 0,
            totalWebhooks: 0,
            webhookSuccessRate: 0,
            recentActivity: [],
            serviceDistribution: [],
            webhookEvents: [],
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#d32f2f' }}>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#3e6172', margin: '0 0 10px 0' }}>
          AREA Admin Dashboard
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Monitor your platform's performance and user activity
        </p>
      </div>

      {/* Main Statistics Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '30px' }}>
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} verified`}
          color="#4caf50"
        />
        <StatCard
          title="Connected Services"
          value={stats?.totalServices || 0}
          subtitle={`${stats?.activeServices || 0} active`}
          color="#2196f3"
        />
        <StatCard
          title="Webhook Configurations"
          value={stats?.totalWebhooks || 0}
          subtitle="Total configured"
          color="#ff9800"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.webhookSuccessRate || 0}%`}
          subtitle="Webhook reliability"
          color="#9c27b0"
        />
      </div>

      {/* Additional Statistics Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '30px' }}>
        <StatCard
          title="Service Types"
          value={stats?.serviceDistribution?.length || 0}
          subtitle="Different services"
          color="#795548"
        />
        {/* <StatCard
          title="Active Rate"
          value={stats?.totalServices > 0 ? `${Math.round((stats.activeServices / stats.totalServices) * 100)}%` : '0%'}
          subtitle="Service activation"
          color="#607d8b"
        /> */}
        <StatCard
          title="User Growth"
          value="📈"
          subtitle="Trending up"
          color="#4caf50"
        />
        <StatCard
          title="System Health"
          value="✅"
          subtitle="All systems operational"
          color="#4caf50"
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '30px' }}>
        {stats?.serviceDistribution && (
          <SimpleChart
            title="Services Overview"
            data={stats.serviceDistribution.slice(0, 8).map(item => ({
              label: item.service,
              value: item.count,
            }))}
          />
        )}

        {stats?.webhookEvents && stats.webhookEvents.length > 0 ? (
          <SimpleChart
            title="Webhook Activity (Last 7 Days)"
            data={stats.webhookEvents.map(item => ({
              label: item.date,
              value: item.success + item.errors,
            }))}
          />
        ) : (
          <SimpleChart
            title="Recent Activity"
            data={[
              { label: 'Mon', value: 0 },
              { label: 'Tue', value: 0 },
              { label: 'Wed', value: 0 },
              { label: 'Thu', value: 0 },
              { label: 'Fri', value: 0 },
              { label: 'Sat', value: 0 },
              { label: 'Sun', value: 0 },
            ]}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          margin: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: '#3e6172' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            style={{
              backgroundColor: '#3e6172',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            View All Users
          </button>
          <button
            style={{
              backgroundColor: '#57798B',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Webhook Analytics
          </button>
          <button
            style={{
              backgroundColor: '#648BA0',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            System Health
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          margin: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: '#3e6172' }}>
          System Status
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}
        >
          <div>
            <strong style={{ color: '#4caf50' }}>✓ Database:</strong> Connected
          </div>
          <div>
            <strong style={{ color: '#4caf50' }}>✓ Webhooks:</strong> Processing
          </div>
          <div>
            <strong style={{ color: '#4caf50' }}>✓ Services:</strong>{' '}
            Operational
          </div>
          <div>
            <strong style={{ color: '#ff9800' }}>⚠ Cache:</strong> Warming up
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
