import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Candidate from '@/models/Candidate';
import VotingConfig from '@/models/VotingConfig';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const config = await VotingConfig.findOne();
        const isResultDeclared = config?.isResultDeclared;

        if (!isResultDeclared) {
            const cookieToken = request.cookies.get('token')?.value;
            const authHeader = request.headers.get('authorization');
            const bearerToken = authHeader ? authHeader.replace(/^Bearer\s*/i, '') : undefined;
            const token = cookieToken || bearerToken;

            let isAdmin = false;
            if (token) {
                const decoded: any = verifyToken(token);
                if (decoded && decoded.id) {
                    const user = await User.findById(decoded.id);
                    if (user && user.role === 'admin') {
                        isAdmin = true;
                    }
                }
            }

            if (!isAdmin) {
                return NextResponse.json(
                    { message: 'Results have not been declared yet' },
                    { status: 403 }
                );
            }
        }

        const candidates = await Candidate.find().sort({ voteCount: -1 });

        const voteRecord = candidates.map((data) => ({
            party: data.party,
            name: data.name,
            voteCount: data.voteCount,
            id: data._id?.toString?.() ?? data._id,
        }));

        return NextResponse.json(voteRecord, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
