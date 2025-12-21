import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { jwtAuthMiddleware } from "@/lib/jwt";
import { storeFaceHashOnChain } from "@/lib/blockchain";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult: any = await jwtAuthMiddleware(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { message: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    const body = await request.json();
    const descriptor = body?.descriptor as number[] | undefined;

    if (!Array.isArray(descriptor) || !descriptor.length) {
      return NextResponse.json(
        { message: "Face data is not valid" },
        { status: 400 }
      );
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    dbUser.faceEmbedding = descriptor;
    dbUser.hasFaceRegistered = true;
    await dbUser.save();

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(descriptor))
      .digest("hex");

    await storeFaceHashOnChain(String(dbUser._id), hash);

    return NextResponse.json({ message: "Face enrolled for this user" });
  } catch (err) {
    console.error("Enroll face error", err);
    return NextResponse.json(
      { message: "Server error while enrolling face" },
      { status: 500 }
    );
  }
}
