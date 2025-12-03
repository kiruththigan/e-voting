import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { aadharCardNumber, password } = await request.json();
        console.log('Log in attempt for Aadhar (last4):', String(aadharCardNumber ?? '').slice(-4));

        if (!aadharCardNumber || !password) {
            console.log('Missing credentials');
            return NextResponse.json(
                { error: 'AadharCardNumber and password are required' },
                { status: 400 }
            );
        }

        const aadharHash = crypto.createHash('sha256').update(String(aadharCardNumber)).digest('hex');

        const user = await User.findOne({ aadharHash });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('User not found with provided Aadhar');
            return NextResponse.json(
                { error: 'Invalid AadharCardNumber or Password' },
                { status: 401 }
            );
        }

        if (!user.isEmailVerified) {
            return NextResponse.json(
                { error: 'Email not verified. Please verify your email first.' },
                { status: 403 }
            );
        }

        const passwordMatch = await user.comparePassword(password);
        console.log('Password match:', passwordMatch ? 'Yes' : 'No');

        if (!passwordMatch) {
            return NextResponse.json(
                { error: 'Invalid AadharCardNumber or Password' },
                { status: 401 }
            );
        }

        const token = generateToken({
            id: String(user._id),
        });
        return NextResponse.json(
            { token, role: user.role },
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
