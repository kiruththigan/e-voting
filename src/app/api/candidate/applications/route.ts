import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { jwtAuthMiddleware, checkAdminRole } from "@/lib/jwt";

export async function GET(request: NextRequest) {
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

    const applications = await User.find(
      { isCandidateApplicant: true },
      "name age aadharLast4 candidateParty candidateManifesto candidateApplicationStatus candidateAppliedAt candidateApprovedAt",
    ).sort({ candidateAppliedAt: -1 });

    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    console.error("Error fetching candidate applications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
