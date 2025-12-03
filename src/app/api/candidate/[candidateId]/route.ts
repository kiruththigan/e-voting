import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Candidate from "@/models/Candidate";
import VotingConfig from "@/models/VotingConfig";
import { jwtAuthMiddleware, checkAdminRole } from "@/lib/jwt";

export async function PUT(
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

    if (!(await checkAdminRole(userId))) {
      return NextResponse.json(
        { message: "user does not have admin role" },
        { status: 403 },
      );
    }

    const config = await VotingConfig.findOne();
    if (config) {
      const now = new Date();
      const votingActive =
        config.isVotingEnabled &&
        now >= config.startTime &&
        now <= config.endTime;

      if (config.isVotingEnabled || config.isResultDeclared) {
        return NextResponse.json(
          {
            error:
              "Cannot update candidates while voting session is enabled or results are declared",
          },
          { status: 403 },
        );
      }
    }

    const resolvedParams = await params;
    const candidateId = resolvedParams.candidateId;
    const updatedCandidateData = await request.json();

    if (
      updatedCandidateData.age !== undefined &&
      updatedCandidateData.age < 25
    ) {
      return NextResponse.json(
        { error: "Candidate must be at least 25 years old" },
        { status: 400 },
      );
    }

    if (updatedCandidateData.party) {
      updatedCandidateData.party = updatedCandidateData.party
        .trim()
        .toLowerCase();

      const existingPartyCandidate = await Candidate.findOne({
        party: updatedCandidateData.party,
        _id: { $ne: candidateId },
      });

      if (existingPartyCandidate) {
        return NextResponse.json(
          { error: "This party already has a candidate" },
          { status: 400 },
        );
      }
    }

    const response = await Candidate.findByIdAndUpdate(
      candidateId,
      updatedCandidateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!response) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    if (!(await checkAdminRole(userId))) {
      return NextResponse.json(
        { message: "user does not have admin role" },
        { status: 403 },
      );
    }

    const config = await VotingConfig.findOne();
    if (config) {
      const now = new Date();
      const votingActive =
        config.isVotingEnabled &&
        now >= config.startTime &&
        now <= config.endTime;

      if (config.isVotingEnabled || config.isResultDeclared) {
        return NextResponse.json(
          {
            error:
              "Cannot delete candidates while voting session is enabled or results are declared",
          },
          { status: 403 },
        );
      }
    }

    const resolvedParams = await params;
    const candidateId = resolvedParams.candidateId;

    const response = await Candidate.findByIdAndDelete(candidateId);

    if (!response) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    console.log("Candidate deleted");
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
