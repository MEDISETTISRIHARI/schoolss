import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  schoolId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

export interface NotificationEventPayload {
  type: NotificationType;
  title: string;
  body: string;
  schoolId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('Notification gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const schoolId = client.handshake.query.schoolId as string;

    if (userId) {
      client.join(`user:${userId}`);
    }

    if (schoolId) {
      client.join(`school:${schoolId}`);
    }

    this.logger.log(`Client connected: ${client.id} (userId: ${userId}, schoolId: ${schoolId})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async sendNotification(payload: NotificationEventPayload) {
    if (payload.schoolId) {
      this.server.to(`school:${payload.schoolId}`).emit('notification', payload);
    }

    if (payload.userId) {
      this.server.to(`user:${payload.userId}`).emit('notification', payload);
    }

    if (!payload.schoolId && !payload.userId) {
      this.server.emit('notification', payload);
    }
  }

  async sendToUser(userId: string, payload: Omit<NotificationEventPayload, 'userId'>) {
    this.server
      .to(`user:${userId}`)
      .emit('notification', { ...payload, userId });
  }

  async sendToSchool(schoolId: string, payload: Omit<NotificationEventPayload, 'schoolId'>) {
    this.server
      .to(`school:${schoolId}`)
      .emit('notification', { ...payload, schoolId });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    if (data?.room) {
      client.join(data.room);
      this.logger.log(`Client ${client.id} joined room: ${data.room}`);
    }
    return { status: 'ok' };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    if (data?.room) {
      client.leave(data.room);
      this.logger.log(`Client ${client.id} left room: ${data.room}`);
    }
    return { status: 'ok' };
  }
}
