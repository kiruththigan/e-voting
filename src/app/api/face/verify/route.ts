import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { jwtAuthMiddleware } from "@/lib/jwt";
import { isSameFace } from "@/lib/face";
import { storeVerificationOnChain } from "@/lib/blockchain";

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
    if (!dbUser || !dbUser.faceEmbedding || !dbUser.faceEmbedding.length) {
      return NextResponse.json(
        { message: "No enrolled face for this user" },
        { status: 400 }
      );
    }

    const ok = isSameFace(
      dbUser.faceEmbedding as number[],
      descriptor
    );

    if (!ok) {
      return NextResponse.json(
        { message: "Face does not match" },
        { status: 401 }
      );
    }

    dbUser.lastFaceVerifiedAt = new Date();
    await dbUser.save();

    await storeVerificationOnChain(String(dbUser._id));

    return NextResponse.json({ message: "Face verified for this user" });
  } catch (err) {
    console.error("Verify face error", err);
    return NextResponse.json(
      { message: "Server error while verifying face" },
      { status: 500 }
    );
  }
}
