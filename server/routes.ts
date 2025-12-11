import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  requireRole,
} from "./auth";
import { registerSchema, loginSchema, insertServiceSchema, insertApiKeySchema } from "@shared/schema";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

function generateApiKey(): string {
  return `sk_live_${randomBytes(24).toString("hex")}`;
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ AUTH ROUTES ============

  // Register
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      const isValidPassword = await comparePassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Refresh token
  app.post("/api/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
      }

      const payload = verifyToken(refreshToken);
      if (!payload || payload.type !== "refresh") {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ message: "Token refresh failed" });
    }
  });

  // Get current user
  app.get("/api/user", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // ============ SERVICES ROUTES ============

  app.get("/api/services", authMiddleware, async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.post("/api/services", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertServiceSchema.parse(req.body);

      const existing = await storage.getServiceByName(data.name);
      if (existing) {
        return res.status(400).json({ message: "Service name already exists" });
      }

      const service = await storage.createService(data);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create service error:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(id, req.body);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // ============ API KEYS ROUTES ============

  app.get("/api/api-keys", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const keys = await storage.getApiKeysByUser(userId);
      res.json(keys);
    } catch (error) {
      console.error("Get API keys error:", error);
      res.status(500).json({ message: "Failed to get API keys" });
    }
  });

  app.post("/api/api-keys", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { name, rateLimit = 1000, expiresInDays } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const rawKey = generateApiKey();
      const keyHash = hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12);

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const apiKey = await storage.createApiKey({
        userId,
        name,
        keyHash,
        keyPrefix,
        permissions: [],
        rateLimit,
        isActive: true,
        lastUsedAt: null,
        expiresAt,
      });

      res.status(201).json({
        ...apiKey,
        key: rawKey, // Only returned once at creation
      });
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  app.delete("/api/api-keys/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const key = await storage.getApiKey(id);
      if (!key || key.userId !== userId) {
        return res.status(404).json({ message: "API key not found" });
      }

      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete API key error:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // ============ LOGS ROUTES ============

  app.get("/api/logs", authMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getRequestLogs({ limit, offset });
      res.json(logs);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to get logs" });
    }
  });

  // ============ DASHBOARD & MONITORING ROUTES ============

  app.get("/api/dashboard/stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/monitoring/stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json({
        ...stats,
        successRate: 100 - stats.errorRate,
        responseTimeTrend: 0,
      });
    } catch (error) {
      console.error("Get monitoring stats error:", error);
      res.status(500).json({ message: "Failed to get monitoring stats" });
    }
  });

  app.get("/api/monitoring/timeseries", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Return mock time series data for now
      const data = Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        requests: Math.floor(Math.random() * 500) + 50,
        responseTime: Math.floor(Math.random() * 150) + 30,
        errors: Math.floor(Math.random() * 20),
      }));
      res.json(data);
    } catch (error) {
      console.error("Get timeseries error:", error);
      res.status(500).json({ message: "Failed to get timeseries" });
    }
  });

  app.get("/api/monitoring/services", authMiddleware, async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      const data = services.map((s) => ({
        serviceId: s.id,
        serviceName: s.name,
        requests: Math.floor(Math.random() * 5000) + 500,
        avgResponseTime: Math.floor(Math.random() * 150) + 30,
        errorRate: Math.random() * 5,
      }));
      res.json(data);
    } catch (error) {
      console.error("Get service stats error:", error);
      res.status(500).json({ message: "Failed to get service stats" });
    }
  });

  // ============ ADMIN ROUTES ============

  app.get("/api/admin/users", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, isActive } = req.body;

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  return httpServer;
}
