import {
  DashboardService,
  DashboardData,
} from '../../src/config/dashboardService';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/config/entity/User';
import { UserServiceSubscriptions } from '../../src/config/entity/UserServiceSubscriptions';
import { WebhookConfigs } from '../../src/config/entity/WebhookConfigs';
import { WebhookStats } from '../../src/config/entity/WebhookStats';
import { UserActivityLogs } from '../../src/config/entity/UserActivityLogs';

// Mock serviceRegistry
jest.mock('../../src/services/ServiceRegistry', () => ({
  serviceRegistry: {
    getAllServices: jest.fn().mockReturnValue([
      { name: 'github', authOnly: false },
      { name: 'discord', authOnly: false },
      { name: 'spotify', authOnly: true },
    ]),
  },
}));

describe('DashboardService', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockSubscriptionRepo: jest.Mocked<Repository<UserServiceSubscriptions>>;
  let mockWebhookRepo: jest.Mocked<Repository<WebhookConfigs>>;
  let mockWebhookStatsRepo: jest.Mocked<Repository<WebhookStats>>;
  let mockActivityRepo: jest.Mocked<Repository<UserActivityLogs>>;
  let dashboardService: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup repository mocks
    mockUserRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
    } as any;

    mockSubscriptionRepo = {
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
    } as any;

    mockWebhookRepo = {
      count: jest.fn(),
    } as any;

    mockWebhookStatsRepo = {
      find: jest.fn(),
    } as any;

    mockActivityRepo = {
      createQueryBuilder: jest.fn().mockReturnThis(),
    } as any;

    // Setup DataSource mock
    mockDataSource = {
      getRepository: jest.fn(entity => {
        if (entity === User) return mockUserRepo;
        if (entity === UserServiceSubscriptions) return mockSubscriptionRepo;
        if (entity === WebhookConfigs) return mockWebhookRepo;
        if (entity === WebhookStats) return mockWebhookStatsRepo;
        if (entity === UserActivityLogs) return mockActivityRepo;
        return {} as any;
      }),
    } as any;

    dashboardService = new DashboardService(mockDataSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create DashboardService instance with DataSource', () => {
      expect(dashboardService).toBeInstanceOf(DashboardService);
    });
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data structure', async () => {
      // Setup mock data
      mockUserRepo.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(80) // verified users
        .mockResolvedValueOnce(5); // admin users

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(150) // total services
        .mockResolvedValueOnce(120); // active services

      mockWebhookRepo.count.mockResolvedValue(25);

      mockWebhookStatsRepo.find.mockResolvedValue([
        { date: '2024-01-01', success_count: 10, error_count: 2 } as any,
        { date: '2024-01-02', success_count: 15, error_count: 1 } as any,
      ]);

      // Mock query builders
      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(12), // new users this month
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { service: 'github', count: '45' },
          { service: 'discord', count: '30' },
        ]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { date: '2024-01-01', count: '10' },
          { date: '2024-01-02', count: '15' },
        ]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result).toEqual({
        users: {
          total: 100,
          active: 80,
          verified: 80,
          admins: 5,
          newThisMonth: 12,
        },
        services: {
          total: 150,
          active: 120,
          byService: [
            { service: 'github', count: 45 },
            { service: 'discord', count: 30 },
          ],
        },
        webhooks: {
          total: 25,
          active: 25,
          successRate: 89, // (25/28) * 100 rounded
          totalEvents: 28, // 10+2+15+1
          recentActivity: [
            { date: '2024-01-02', success: 15, errors: 1 },
            { date: '2024-01-01', success: 10, errors: 2 },
          ],
        },
        activity: {
          recentUsers: [
            { date: '2024-01-01', count: 10 },
            { date: '2024-01-02', count: 15 },
          ],
        },
      });
    });

    it('should handle user statistics errors gracefully', async () => {
      mockUserRepo.count.mockRejectedValue(new Error('Database error'));
      mockSubscriptionRepo.count.mockResolvedValue(0);
      mockWebhookRepo.count.mockResolvedValue(0);
      mockWebhookStatsRepo.find.mockResolvedValue([]);
      mockActivityRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await dashboardService.getDashboardData();

      expect(result.users.total).toBe(0);
      expect(result.users.active).toBe(0);
      expect(result.users.verified).toBe(0);
      expect(result.users.admins).toBe(0);
    });

    it('should handle service statistics errors gracefully', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(5);

      mockSubscriptionRepo.count.mockRejectedValue(new Error('Database error'));
      mockWebhookRepo.count.mockResolvedValue(0);
      mockWebhookStatsRepo.find.mockResolvedValue([]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.services.total).toBe(0);
      expect(result.services.active).toBe(0);
      expect(result.services.byService).toEqual([
        { service: 'github', count: 0 },
        { service: 'discord', count: 0 },
      ]);
    });

    it('should handle webhook statistics errors gracefully', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(5);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(120);

      mockWebhookRepo.count.mockRejectedValue(new Error('Database error'));
      mockWebhookStatsRepo.find.mockResolvedValue([]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(12),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.webhooks.total).toBe(0);
      expect(result.webhooks.active).toBe(0);
      expect(result.webhooks.successRate).toBe(0);
      expect(result.webhooks.totalEvents).toBe(0);
    });

    it('should handle activity logs errors and provide fallback data', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(5);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(120);

      mockWebhookRepo.count.mockResolvedValue(25);
      mockWebhookStatsRepo.find.mockResolvedValue([]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(12),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      // Mock activity repo to throw error
      mockActivityRepo.createQueryBuilder.mockImplementation(() => {
        throw new Error('Activity logs table error');
      });

      const result = await dashboardService.getDashboardData();

      expect(result.activity.recentUsers).toHaveLength(7); // Fallback data
      expect(result.activity.recentUsers[0]).toHaveProperty('date');
      expect(result.activity.recentUsers[0]).toHaveProperty('count');
    });

    it('should calculate success rate correctly', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(1);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15);

      mockWebhookRepo.count.mockResolvedValue(5);

      mockWebhookStatsRepo.find.mockResolvedValue([
        { date: '2024-01-01', success_count: 100, error_count: 25 } as any,
        { date: '2024-01-02', success_count: 75, error_count: 50 } as any,
      ]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.webhooks.successRate).toBe(70); // (175/250) * 100 = 70
      expect(result.webhooks.totalEvents).toBe(250); // 100+25+75+50
    });

    it('should handle zero total events for success rate', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(1);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15);

      mockWebhookRepo.count.mockResolvedValue(5);

      mockWebhookStatsRepo.find.mockResolvedValue([
        { date: '2024-01-01', success_count: 0, error_count: 0 } as any,
      ]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.webhooks.successRate).toBe(0);
      expect(result.webhooks.totalEvents).toBe(0);
    });

    it('should sort recent activity by date descending', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(1);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15);

      mockWebhookRepo.count.mockResolvedValue(5);

      mockWebhookStatsRepo.find.mockResolvedValue([
        { date: '2024-01-01', success_count: 10, error_count: 2 } as any,
        { date: '2024-01-03', success_count: 5, error_count: 1 } as any,
        { date: '2024-01-02', success_count: 15, error_count: 3 } as any,
      ]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.webhooks.recentActivity).toHaveLength(3);
      expect(result.webhooks.recentActivity[0].date).toBe('2024-01-03');
      expect(result.webhooks.recentActivity[1].date).toBe('2024-01-02');
      expect(result.webhooks.recentActivity[2].date).toBe('2024-01-01');
    });

    it('should limit recent activity to 7 days', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(1);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(15);

      mockWebhookRepo.count.mockResolvedValue(5);

      // Create 10 days of data
      const webhookStats = Array.from(
        { length: 10 },
        (_, i) =>
          ({
            date: `2024-01-${String(i + 1).padStart(2, '0')}`,
            success_count: 10,
            error_count: 2,
          }) as any
      );

      mockWebhookStatsRepo.find.mockResolvedValue(webhookStats);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      const mockSubscriptionQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockSubscriptionRepo.createQueryBuilder.mockReturnValue(
        mockSubscriptionQueryBuilder as any
      );

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.webhooks.recentActivity).toHaveLength(7);
    });

    it('should handle general errors and return default data structure', async () => {
      mockDataSource.getRepository.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await dashboardService.getDashboardData();

      expect(result).toEqual({
        users: { total: 0, active: 0, verified: 0, admins: 0, newThisMonth: 0 },
        services: { total: 0, active: 0, byService: [] },
        webhooks: {
          total: 0,
          active: 0,
          successRate: 0,
          totalEvents: 0,
          recentActivity: [],
        },
        activity: { recentUsers: [] },
      });
    });

    it('should use service registry fallback when service distribution query fails', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(5);

      mockSubscriptionRepo.count
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(120);

      mockWebhookRepo.count.mockResolvedValue(25);
      mockWebhookStatsRepo.find.mockResolvedValue([]);

      const mockUserQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(12),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(
        mockUserQueryBuilder as any
      );

      // Mock subscription query builder to throw error
      mockSubscriptionRepo.createQueryBuilder.mockImplementation(() => {
        throw new Error('Query failed');
      });

      const mockActivityQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockActivityRepo.createQueryBuilder.mockReturnValue(
        mockActivityQueryBuilder as any
      );

      const result = await dashboardService.getDashboardData();

      expect(result.services.byService).toEqual([
        { service: 'github', count: 0 },
        { service: 'discord', count: 0 },
      ]);
    });
  });
});
