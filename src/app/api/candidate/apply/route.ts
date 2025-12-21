import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { jwtAuthMiddleware } from '@/lib/jwt';
import VotingConfig from '@/models/VotingConfig';
import Candidate from '@/models/Candidate';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = await jwtAuthMiddleware(request);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const { userId } = authResult;
        const { party, manifesto } = await request.json();

        const config = await VotingConfig.findOne();
        if (config && (config.isVotingEnabled || config.isResultDeclared)) {
            return NextResponse.json(
                { error: 'Cannot apply as candidate while voting session is enabled or results are declared' },
                { status: 403 }
            );
        }

        if (!party || !manifesto) {
            return NextResponse.json(
                { error: 'Party name and manifesto are required' },
                { status: 400 }
            );
        }

        const existingPartyCandidate = await Candidate.findOne({ party });
        if (existingPartyCandidate) {
            return NextResponse.json(
                { error: 'This party already has a candidate' },
                { status: 400 }
            );
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.role === 'admin') {
            return NextResponse.json(
                { error: 'Administrators cannot apply as candidates' },
                { status: 403 }
            );
        }

        if (user.isCandidateApplicant && user.candidateApplicationStatus !== 'rejected') {
            return NextResponse.json(
                { error: 'You have already applied as a candidate' },
                { status: 400 }
            );
        }

        if (user.isVoted) {
            return NextResponse.json(
                { error: 'Users who have voted cannot apply as candidates' },
                { status: 400 }
            );
        }

        user.isCandidateApplicant = true;
        user.candidateApplicationStatus = 'pending';
        user.candidateParty = party;
        user.candidateManifesto = manifesto;
        user.candidateAppliedAt = new Date();

        await user.save();

        return NextResponse.json(
            {
                message: 'Candidate application submitted successfully',
                applicationStatus: 'pending'
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in candidate application:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
