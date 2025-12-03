import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Candidate from "@/models/Candidate";
import User from "@/models/User";
import VotingConfig from "@/models/VotingConfig";
import { jwtAuthMiddleware } from "@/lib/jwt";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    await connectDB();

    const authResult = await jwtAuthMiddleware(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const { userId } = authResult;
    const resolvedParams = await params;
    const candidateId = resolvedParams.candidateId;

    const config = await VotingConfig.findOne();
    if (!config) {
      return NextResponse.json(
        { message: "Voting configuration not found" },
        { status: 500 },
      );
    }

    const now = new Date();

    console.log("Voting Config Check:", {
      now: now.toISOString(),
      startTime: config.startTime.toISOString(),
      endTime: config.endTime.toISOString(),
      isVotingEnabled: config.isVotingEnabled,
      nowBeforeStart: now < config.startTime,
      nowAfterEnd: now > config.endTime,
    });

    if (!config.isVotingEnabled) {
      return NextResponse.json(
        { message: "Voting is currently disabled" },
        { status: 403 },
      );
    }

    if (now < config.startTime) {
      return NextResponse.json(
        { message: "Voting has not started yet" },
        { status: 403 },
      );
    }

    if (now > config.endTime) {
      return NextResponse.json(
        { message: "Voting has ended" },
        { status: 403 },
      );
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate not found" },
        { status: 404 },
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { message: "admin is not allowed" },
        { status: 403 },
      );
    }

    if (user.isVoted) {
      return NextResponse.json(
        { message: "You have already voted" },
        { status: 400 },
      );
    }

    if (user.candidateApplicationStatus === "approved") {
      return NextResponse.json(
        { message: "Candidates cannot vote in the election" },
        { status: 403 },
      );
    }

    candidate.votes.push({
      user: new mongoose.Types.ObjectId(userId),
      votedAt: new Date(),
    });
    candidate.voteCount++;
    await candidate.save();

    user.isVoted = true;
    await user.save();

    return NextResponse.json(
      { message: "Vote recorded successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
