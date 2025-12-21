import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { jwtAuthMiddleware } from '@/lib/jwt';

export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult: any = await jwtAuthMiddleware(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId } = authResult;
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Both currentPassword and newPassword are required' },
                { status: 400 }
            );
        }

        const user = await User.findById(userId);

        if (!user || !(await user.comparePassword(currentPassword))) {
            return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
        }

        user.password = newPassword;
        await user.save();

        return NextResponse.json({ message: 'Password updated' }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
