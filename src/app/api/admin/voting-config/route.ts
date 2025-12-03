import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import VotingConfig from "@/models/VotingConfig";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";

async function isAdmin(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return false;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) return false;

  await connectDB();
  const user = await User.findById(decoded.id);
  return user && user.role === "admin";
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    let config = await VotingConfig.findOne();

    if (!config) {
      config = await VotingConfig.create({
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isVotingEnabled: false,
        isResultDeclared: false,
      });
    }

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const data = await request.json();
    const { startTime, endTime, isVotingEnabled, isResultDeclared } = data;

    // Validation
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start >= end) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 },
      );
    }

    if (isVotingEnabled) {
      if (now < start) {
        return NextResponse.json(
          { error: "Cannot enable voting before start time" },
          { status: 400 },
        );
      }
      if (now > end) {
        //
      }
    }

    let config = await VotingConfig.findOne();
    if (!config) {
      config = new VotingConfig(data);
    } else {
      config.startTime = start;
      config.endTime = end;
      config.isVotingEnabled = isVotingEnabled;
      config.isResultDeclared = isResultDeclared;
    }

    await config.save();

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
