import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { userId, otp } = await request.json();

        if (!userId || !otp) {
            return NextResponse.json(
                { error: 'UserID and OTP are required' },
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

        if (user.isEmailVerified) {
            return NextResponse.json(
                { error: 'User already verified' },
                { status: 400 }
            );
        }

        if (!user.otp || String(user.otp) !== String(otp)) {
            return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 400 }
            );
        }

        if (user.otpExpires && user.otpExpires < new Date()) {
            return NextResponse.json(
                { error: 'OTP expired' },
                { status: 400 }
            );
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken({
            id: String(user._id),
        });

        return NextResponse.json(
            {
                message: 'Email verified successfully',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
