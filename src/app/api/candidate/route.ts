import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Candidate from '@/models/Candidate';
import VotingConfig from '@/models/VotingConfig';
import { jwtAuthMiddleware, checkAdminRole } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const candidates = await Candidate.find({}, 'name party age _id');

        return NextResponse.json(candidates, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult: any = await jwtAuthMiddleware(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId } = authResult;

        if (!(await checkAdminRole(userId))) {
            return NextResponse.json({ message: 'User does not have admin role' }, { status: 403 });
        }
        const config = await VotingConfig.findOne();
        if (config) {
            const now = new Date();
            const votingActive = !!config.isVotingEnabled || config.isResultDeclared

            console.log('VotingConfig Check:', {
                now: now.toISOString(),
                startTime: config.startTime?.toISOString?.(),
                endTime: config.endTime?.toISOString?.(),
                isVotingEnabled: config.isVotingEnabled,
                votingActive,
                isResultDeclared: config.isResultDeclared,
            });

            if (votingActive || config.isResultDeclared) {
                return NextResponse.json(
                    { error: 'Cannot add candidates while voting session is enabled or results are declared' },
                    { status: 403 }
                );
            }
        }

        const data = await request.json();
        let { name, party, age } = data ?? {};

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        if (!party || typeof party !== 'string') {
            return NextResponse.json({ error: 'Party is required' }, { status: 400 });
        }
        if (age === undefined || age === null || typeof age !== 'number') {
            return NextResponse.json({ error: 'Age is required and must be a number' }, { status: 400 });
        }

        party = party.trim().toLowerCase();

        // Validate age
        if (age < 25) {
            return NextResponse.json({ error: 'Candidate must be at least 25 years old' }, { status: 400 });
        }

        // Check if party already has a candidate
        const existingPartyCandidate = await Candidate.findOne({ party });
        if (existingPartyCandidate) {
            return NextResponse.json({ error: 'This party already has a candidate' }, { status: 400 });
        }

        const newCandidate = new Candidate({ name, party, age });

        const response = await newCandidate.save();
        console.log('Candidate data saved');

        return NextResponse.json({ response }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
