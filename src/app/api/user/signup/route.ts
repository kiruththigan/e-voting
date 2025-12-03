import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const data: any = await request.json();
        const { name, age, email, mobile, address, aadharCardNumber, password, role } = data ?? {};

        if (!email || !mobile || !aadharCardNumber) {
            return NextResponse.json(
                { error: 'Email, Mobile, and AadharCardNumber are required' },
                { status: 400 }
            );
        }

        if (!/^\d{12}$/.test(String(aadharCardNumber))) {
            return NextResponse.json(
                { error: 'AadharCardNumber must be exactly 12 digits' },
                { status: 400 }
            );
        }

        // Validate age
        if (typeof age === 'number' && age < 18) {
            return NextResponse.json(
                { error: 'You must be at least 18 years old to register' },
                { status: 400 }
            );
        }

        // Hash Aadhar number
        const aadharHash = crypto.createHash('sha256').update(String(aadharCardNumber)).digest('hex');
        const aadharLast4 = String(aadharCardNumber).slice(-4);

        // Check for duplicates
        const existEmail = await User.findOne({ email });
        if (existEmail) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const existMobile = await User.findOne({ mobile });
        if (existMobile) {
            return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 });
        }

        const existAadhar = await User.findOne({ aadharHash });
        if (existAadhar) {
            return NextResponse.json(
                { error: 'User with this Aadhar Card Number already exists' },
                { status: 400 }
            );
        }

        if (role === 'admin') {
            const adminUser = await User.findOne({ role: 'admin' });
            if (adminUser) {
                return NextResponse.json({ error: 'Admin user already exists' }, { status: 400 });
            }
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log(`OTP for ${email}: ${otp}`);

        await sendEmail({
            email,
            subject: 'E-Voting App Verification Code',
            message: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
        });

        const newUser = new User({
            name,
            age,
            email,
            mobile,
            address,
            aadharHash,
            aadharLast4,
            password,
            role,
            otp,
            otpExpires,
            isEmailVerified: false,
        });

        const response = await newUser.save();
        console.log('User data saved');

        return NextResponse.json(
            {
                message: 'User registered successfully. Please verify OTP.',
                userId: response._id,
                email: response.email,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
