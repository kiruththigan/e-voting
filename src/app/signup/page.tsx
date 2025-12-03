'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

type FormData = {
    name: string;
    age: string;
    email: string;
    mobile: string;
    address: string;
    aadharCardNumber: string;
    password: string;
    role: 'voter' | 'admin';
};

export default function SignupPage() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        age: '',
        email: '',
        mobile: '',
        address: '',
        aadharCardNumber: '',
        password: '',
        role: 'voter',
    });

    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'signup' | 'otp'>('signup');
    const [userId, setUserId] = useState('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/user/signup', {
                ...formData,
                age: Number(formData.age) || 0,
                aadharCardNumber: formData.aadharCardNumber,
            });

            setUserId(response.data.userId);
            setStep('otp');
            alert('Signup successful! Please check your email for the OTP.');
        } catch (err: any) {
            const errText = err?.response?.data?.error || err.message || 'Signup failed.';
            setError(errText);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/user/verify-otp', {
                userId,
                otp,
            });

            const { token, user } = response.data;

            login(token, user);

            alert('OTP verified successfully! Redirecting...');

            if (user?.role === 'admin') {
                router.push('/admin-dashboard');
            } else {
                router.push('/voter-dashboard');
            }
        } catch (err: any) {
            const errText = err?.response?.data?.error || err.message || 'Verification failed.';
            setError(errText);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 'signup' ? 'Sign Up' : 'Verify OTP'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'signup' ? 'Create your account for E-Voting App' : 'Enter the OTP sent to your email'}
                    </p>
                </div>

                {step === 'signup' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <input
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Full Name"
                            />

                            <input
                                name="age"
                                type="number"
                                required
                                value={formData.age}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Age"
                            />

                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Email"
                            />

                            <input
                                name="mobile"
                                type="text"
                                required
                                value={formData.mobile}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Mobile"
                            />

                            <input
                                name="address"
                                type="text"
                                required
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Address"
                            />

                            <input
                                name="aadharCardNumber"
                                type="text"
                                required
                                value={formData.aadharCardNumber}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Aadhaar Number (12 digits)"
                                maxLength={12}
                            />

                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
                        <div>
                            <input
                                name="otp"
                                type="text"
                                required
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center tracking-widest text-xl"
                                placeholder="Enter OTP"
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                            Log in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
