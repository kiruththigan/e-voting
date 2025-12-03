import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Candidate from "@/models/Candidate";
import { jwtAuthMiddleware, checkAdminRole } from "@/lib/jwt";
import mongoose from "mongoose";
import VotingConfig from "@/models/VotingConfig";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
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
    const applicationId = resolvedParams.applicationId;
    const { action } = await request.json();

    if (!(await checkAdminRole(userId))) {
      return NextResponse.json(
        { message: "user does not have admin role" },
        { status: 403 },
      );
    }

    const config = await VotingConfig.findOne();
    if (config && (config.isVotingEnabled || config.isResultDeclared)) {
      return NextResponse.json(
        {
          error:
            "Cannot process candidate applications while voting session is enabled or results are declared",
        },
        { status: 403 },
      );
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 },
      );
    }

    const user = await User.findById(applicationId);
    if (!user || !user.isCandidateApplicant) {
      return NextResponse.json(
        { error: "Candidate application not found" },
        { status: 404 },
      );
    }

    if (user.candidateApplicationStatus !== "pending") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const existingPartyCandidate = await Candidate.findOne({
        party: user.candidateParty,
      });
      if (existingPartyCandidate) {
        return NextResponse.json(
          { error: "This party already has a candidate" },
          { status: 400 },
        );
      }

      user.candidateApplicationStatus = "approved";
      user.candidateApprovedAt = new Date();

      const newCandidate = new Candidate({
        name: user.name,
        party: user.candidateParty,
        age: user.age,
        applicantUser: new mongoose.Types.ObjectId(applicationId),
        manifesto: user.candidateManifesto,
        isFromUserApplication: true,
      });

      await newCandidate.save();
      await user.save();

      return NextResponse.json(
        {
          message: "Candidate application approved successfully",
          candidateId: newCandidate._id,
        },
        { status: 200 },
      );
    } else {
      user.candidateApplicationStatus = "rejected";
      await user.save();

      return NextResponse.json(
        { message: "Candidate application rejected" },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error processing candidate application:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
