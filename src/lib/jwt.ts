import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import User, { IUser } from "@/models/User";
import connectDB from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "12345";

export interface JWTPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (userData: { id: string }): string => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
  userId?: string;
}

export const jwtAuthMiddleware = async (request: NextRequest) => {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return { error: "Token Not Found", status: 401 };
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return { error: "Unauthorized", status: 401 };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { error: "Invalid token", status: 401 };
    }
    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) {
      return { error: "User not found", status: 404 };
    }

    return { user, userId: decoded.id };
  } catch (error) {
    return { error: "Authentication failed", status: 401 };
  }
};

export const checkAdminRole = async (userId: string): Promise<boolean> => {
  try {
    await connectDB();
    const user = await User.findById(userId);
    return user?.role === "admin";
  } catch (error) {
    return false;
  }
};

export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  return null;
}
