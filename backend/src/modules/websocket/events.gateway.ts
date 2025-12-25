import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly connectedClients = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, currentOrganizationId: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Attach user info to socket
      client.userId = user.id;
      client.organizationId = user.currentOrganizationId || undefined;

      // Track connected client
      if (!this.connectedClients.has(user.id)) {
        this.connectedClients.set(user.id, new Set());
      }
      this.connectedClients.get(user.id)!.add(client.id);

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join organization room if applicable
      if (user.currentOrganizationId) {
        client.join(`org:${user.currentOrganizationId}`);
      }

      // Store in Redis for distributed setup
      await this.redis.sadd(`ws:user:${user.id}`, client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${user.id})`);

      // Send connection acknowledgment
      client.emit('connected', {
        socketId: client.id,
        userId: user.id,
        organizationId: user.currentOrganizationId,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedClients.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(client.userId);
        }
      }

      // Remove from Redis
      await this.redis.srem(`ws:user:${client.userId}`, client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:job')
  async handleJoinJob(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    // Verify user has access to this job
    const job = await this.prisma.job.findFirst({
      where: {
        id: data.jobId,
        OR: [
          { clientId: client.userId },
          { matches: { some: { workerId: client.userId } } },
        ],
      },
    });

    if (!job) {
      return { error: 'Job not found or access denied' };
    }

    client.join(`job:${data.jobId}`);
    this.logger.log(`User ${client.userId} joined job room: ${data.jobId}`);

    return { success: true, jobId: data.jobId };
  }

  @SubscribeMessage('leave:job')
  handleLeaveJob(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string },
  ) {
    client.leave(`job:${data.jobId}`);
    return { success: true };
  }

  @SubscribeMessage('join:organization')
  async handleJoinOrganization(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { organizationId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    // Verify membership
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: client.userId,
        organizationId: data.organizationId,
        deletedAt: null,
      },
    });

    if (!membership) {
      return { error: 'Not a member of this organization' };
    }

    client.join(`org:${data.organizationId}`);
    return { success: true, organizationId: data.organizationId };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { jobId: string; isTyping: boolean },
  ) {
    client.to(`job:${data.jobId}`).emit('user:typing', {
      userId: client.userId,
      jobId: data.jobId,
      isTyping: data.isTyping,
    });
  }

  // Event handlers for emitting real-time updates
  @OnEvent('job.created')
  handleJobCreatedEvent(payload: { jobId: string; clientId: string }) {
    this.server.to(`user:${payload.clientId}`).emit('job:created', payload);
  }

  @OnEvent('job.updated')
  handleJobUpdatedEvent(payload: {
    jobId: string;
    changes: any;
    previousStatus: string;
    newStatus: string;
  }) {
    this.server.to(`job:${payload.jobId}`).emit('job:updated', payload);
  }

  @OnEvent('job.cancelled')
  handleJobCancelledEvent(payload: { jobId: string; reason?: string }) {
    this.server.to(`job:${payload.jobId}`).emit('job:cancelled', payload);
  }

  @OnEvent('match.created')
  handleMatchCreatedEvent(payload: {
    matchId: string;
    jobId: string;
    workerId: string;
  }) {
    this.server.to(`user:${payload.workerId}`).emit('match:created', payload);
    this.server.to(`job:${payload.jobId}`).emit('match:created', payload);
  }

  @OnEvent('match.responded')
  handleMatchRespondedEvent(payload: {
    matchId: string;
    jobId: string;
    workerId: string;
    action: string;
  }) {
    this.server.to(`job:${payload.jobId}`).emit('match:responded', payload);
  }

  @OnEvent('organization.memberAdded')
  handleMemberAddedEvent(payload: {
    organizationId: string;
    userId: string;
    addedBy: string;
  }) {
    this.server.to(`org:${payload.organizationId}`).emit('member:added', payload);
    this.server.to(`user:${payload.userId}`).emit('org:joined', payload);
  }

  @OnEvent('organization.memberRemoved')
  handleMemberRemovedEvent(payload: {
    organizationId: string;
    userId: string;
    removedBy: string;
  }) {
    this.server.to(`org:${payload.organizationId}`).emit('member:removed', payload);
    this.server.to(`user:${payload.userId}`).emit('org:removed', payload);
  }

  // Utility methods
  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token;
    if (token) {
      return token;
    }

    return client.handshake.query?.token as string || null;
  }

  // Public methods for sending messages
  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  async sendToJob(jobId: string, event: string, data: any): Promise<void> {
    this.server.to(`job:${jobId}`).emit(event, data);
  }

  async sendToOrganization(
    organizationId: string,
    event: string,
    data: any,
  ): Promise<void> {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }

  async broadcast(event: string, data: any): Promise<void> {
    this.server.emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  getOnlineUsersCount(): number {
    return this.connectedClients.size;
  }
}
