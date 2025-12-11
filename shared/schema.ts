import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with roles
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // admin, user
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Backend services registry
export const services = pgTable("services", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  healthCheckPath: text("health_check_path").default("/health"),
  authType: text("auth_type").default("none"), // none, api_key, bearer
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  baseUrl: true,
  description: true,
  healthCheckPath: true,
  authType: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// API Keys for programmatic access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(), // hashed version of the key
  keyPrefix: text("key_prefix").notNull(), // first 8 chars for display
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`), // list of service IDs or "*"
  rateLimit: integer("rate_limit").default(1000), // requests per hour
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  name: true,
  permissions: true,
  rateLimit: true,
  expiresAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Request logs
export const requestLogs = pgTable("request_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id", { length: 36 }).references(() => apiKeys.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  serviceId: varchar("service_id", { length: 36 }).references(() => services.id),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in ms
  requestHeaders: jsonb("request_headers"),
  responseHeaders: jsonb("response_headers"),
  requestBody: text("request_body"),
  responseBody: text("response_body"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRequestLogSchema = createInsertSchema(requestLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertRequestLog = z.infer<typeof insertRequestLogSchema>;
export type RequestLog = typeof requestLogs.$inferSelect;

// Rate limit tracking
export const rateLimits = pgTable("rate_limits", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id", { length: 36 }).references(() => apiKeys.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  windowStart: timestamp("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(0),
});

export type RateLimit = typeof rateLimits.$inferSelect;

// Login schema for auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registration schema with validation
export const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
