import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { User } from "@shared/schema";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set for JWT authentication");
}
const JWT_SECRET = process.env.SESSION_SECRET;
const ACCESS_TOKEN_EXPIRY = "24h";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  type: "access" | "refresh";
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function generateAccessToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    type: "access",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    type: "refresh",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.type !== "access") {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Attach userId to request for later use
  (req as any).userId = payload.userId;
  (req as any).userRole = payload.role;
  
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;
    if (userRole !== role) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
