import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import {
  users,
  services,
  apiKeys,
  requestLogs,
  rateLimits,
  type User,
  type InsertUser,
  type Service,
  type InsertService,
  type ApiKey,
  type InsertApiKey,
  type RequestLog,
  type InsertRequestLog,
  type RateLimit,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Services
  getService(id: string): Promise<Service | undefined>;
  getServiceByName(name: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, data: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // API Keys
  getApiKey(id: string): Promise<ApiKey | undefined>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  getApiKeysByUser(userId: string): Promise<ApiKey[]>;
  createApiKey(apiKey: Omit<ApiKey, "id" | "createdAt">): Promise<ApiKey>;
  updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;

  // Request Logs
  getRequestLogs(filters?: { limit?: number; offset?: number }): Promise<RequestLog[]>;
  createRequestLog(log: InsertRequestLog): Promise<RequestLog>;

  // Rate Limits
  getRateLimit(apiKeyId: string, windowStart: Date): Promise<RateLimit | undefined>;
  createOrUpdateRateLimit(apiKeyId: string, windowStart: Date): Promise<RateLimit>;

  // Stats
  getDashboardStats(): Promise<{
    totalRequests: number;
    activeServices: number;
    activeApiKeys: number;
    errorRate: number;
    avgResponseTime: number;
    requestsTrend: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser & { password: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Services
  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.name, name));
    return service;
  }

  async getAllServices(): Promise<Service[]> {
    return db.select().from(services).orderBy(desc(services.createdAt));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: string, data: Partial<Service>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return true;
  }

  // API Keys
  async getApiKey(id: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return key;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return key;
  }

  async getApiKeysByUser(userId: string): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  }

  async createApiKey(apiKey: Omit<ApiKey, "id" | "createdAt">): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values(apiKey).returning();
    return key;
  }

  async updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const [key] = await db.update(apiKeys).set(data).where(eq(apiKeys.id, id)).returning();
    return key;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));
    return true;
  }

  // Request Logs
  async getRequestLogs(filters?: { limit?: number; offset?: number }): Promise<RequestLog[]> {
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    return db
      .select()
      .from(requestLogs)
      .orderBy(desc(requestLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createRequestLog(log: InsertRequestLog): Promise<RequestLog> {
    const [requestLog] = await db.insert(requestLogs).values(log).returning();
    return requestLog;
  }

  // Rate Limits
  async getRateLimit(apiKeyId: string, windowStart: Date): Promise<RateLimit | undefined> {
    const [limit] = await db
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.apiKeyId, apiKeyId), eq(rateLimits.windowStart, windowStart)));
    return limit;
  }

  async createOrUpdateRateLimit(apiKeyId: string, windowStart: Date): Promise<RateLimit> {
    const existing = await this.getRateLimit(apiKeyId, windowStart);
    if (existing) {
      const [updated] = await db
        .update(rateLimits)
        .set({ requestCount: existing.requestCount + 1 })
        .where(eq(rateLimits.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(rateLimits)
      .values({ apiKeyId, windowStart, requestCount: 1 })
      .returning();
    return created;
  }

  // Stats
  async getDashboardStats() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [requestCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(requestLogs)
      .where(gte(requestLogs.createdAt, yesterday));

    const [serviceCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(services)
      .where(eq(services.isActive, true));

    const [keyCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiKeys)
      .where(eq(apiKeys.isActive, true));

    const [errorCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(requestLogs)
      .where(and(gte(requestLogs.createdAt, yesterday), gte(requestLogs.statusCode, 400)));

    const [avgTime] = await db
      .select({ avg: sql<number>`coalesce(avg(response_time), 0)::int` })
      .from(requestLogs)
      .where(gte(requestLogs.createdAt, yesterday));

    const totalRequests = requestCount?.count || 0;
    const errorRate = totalRequests > 0 ? ((errorCount?.count || 0) / totalRequests) * 100 : 0;

    return {
      totalRequests,
      activeServices: serviceCount?.count || 0,
      activeApiKeys: keyCount?.count || 0,
      errorRate,
      avgResponseTime: avgTime?.avg || 0,
      requestsTrend: 0,
    };
  }
}

export const storage = new DatabaseStorage();
