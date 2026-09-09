import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from '../../src/notifications/notifications.gateway';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let mockServer: { to: jest.Mock; emit: jest.Mock; on: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationGateway],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn().mockReturnThis(),
      on: jest.fn(),
    };

    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      gateway.afterInit();
      expect(logSpy).toHaveBeenCalledWith('Notification gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('should join user and school rooms', () => {
      const mockClient = {
        id: 'client-1',
        join: jest.fn(),
        handshake: {
          query: { userId: 'user-1', schoolId: 'school-1' },
        },
      };

      gateway.handleConnection(mockClient as any);

      expect(mockClient.join).toHaveBeenCalledWith('user:user-1');
      expect(mockClient.join).toHaveBeenCalledWith('school:school-1');
    });

    it('should not join rooms when no userId or schoolId', () => {
      const mockClient = {
        id: 'client-2',
        join: jest.fn(),
        handshake: { query: {} },
      };

      gateway.handleConnection(mockClient as any);
      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    it('should emit to school room when schoolId is provided', async () => {
      const payload = {
        type: 'ANNOUNCEMENT',
        title: 'Test',
        body: 'Body',
        schoolId: 'school-1',
      };

      await gateway.sendNotification(payload as any);

      expect(mockServer.to).toHaveBeenCalledWith('school:school-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', payload);
    });

    it('should emit to user room when userId is provided', async () => {
      const payload = {
        type: 'ANNOUNCEMENT',
        title: 'Test',
        body: 'Body',
        userId: 'user-1',
      };

      await gateway.sendNotification(payload as any);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', payload);
    });

    it('should emit to all when no schoolId or userId', async () => {
      const payload = {
        type: 'GENERAL',
        title: 'Test',
        body: 'Body',
      };

      await gateway.sendNotification(payload as any);

      expect(mockServer.emit).toHaveBeenCalledWith('notification', payload);
    });
  });

  describe('sendToUser', () => {
    it('should emit to user room with payload', async () => {
      const payload = {
        type: 'ANNOUNCEMENT',
        title: 'Test',
        body: 'Body',
      };

      await gateway.sendToUser('user-1', payload as any);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        ...payload,
        userId: 'user-1',
      });
    });
  });

  describe('sendToSchool', () => {
    it('should emit to school room with payload', async () => {
      const payload = {
        type: 'ANNOUNCEMENT',
        title: 'Test',
        body: 'Body',
      };

      await gateway.sendToSchool('school-1', payload as any);

      expect(mockServer.to).toHaveBeenCalledWith('school:school-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        ...payload,
        schoolId: 'school-1',
      });
    });
  });

  describe('handleSubscribe', () => {
    it('should join room when room is provided', () => {
      const mockClient = {
        id: 'client-1',
        join: jest.fn(),
      };

      const result = gateway.handleSubscribe({ room: 'custom-room' }, mockClient as any);

      expect(mockClient.join).toHaveBeenCalledWith('custom-room');
      expect(result).toEqual({ status: 'ok' });
    });

    it('should return ok even when room is not provided', () => {
      const mockClient = { id: 'client-1', join: jest.fn() };

      const result = gateway.handleSubscribe({} as any, mockClient as any);

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('handleUnsubscribe', () => {
    it('should leave room when room is provided', () => {
      const mockClient = {
        id: 'client-1',
        leave: jest.fn(),
      };

      const result = gateway.handleUnsubscribe({ room: 'custom-room' }, mockClient as any);

      expect(mockClient.leave).toHaveBeenCalledWith('custom-room');
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
