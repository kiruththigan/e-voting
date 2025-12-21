'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface Candidate {
    _id: string;
    name: string;
    party: string;
}

export default function VoterDashboard() {
    const { user, logout, refreshUser, loading: authLoading } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [candidateForm, setCandidateForm] = useState({
        party: '',
        manifesto: '',
    });

    const router = useRouter();

    const isFaceRecentlyVerified = () => {
        if (!user?.lastFaceVerifiedAt) return false;
        const verifiedTime = new Date(user.lastFaceVerifiedAt as any).getTime();
        const diffMs = Date.now() - verifiedTime;
        const fiveMinutes = 5 * 60 * 1000;
        return diffMs <= fiveMinutes;
    };

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'voter')) {
            router.push('/');
            return;
        }

        if (user) {
            fetchCandidates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    const fetchCandidates = async () => {
        try {
            const response = await axios.get('/api/candidate');
            setCandidates(response.data);
        } catch (err) {
            console.error('Failed to load candidates:', err);
        }
    };

    const handleLogout = async () => {
        try {
            console.log('🚪 Voter logout initiated...');
            await logout?.();
        } catch (err) {
            console.warn('Logout error (continuing redirect):', err);
        } finally {
            router.push('/');
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await axios.put('/api/user/profile/password', passwordForm);
            setMessage('Password updated successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '' });
            setShowPasswordForm(false);
        } catch (err: any) {
            setMessage(err?.response?.data?.error || 'Password update failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCandidateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await axios.post('/api/candidate/apply', candidateForm);
            setMessage('Candidate application submitted successfully! Wait for admin approval.');
            setCandidateForm({ party: '', manifesto: '' });
            setShowCandidateForm(false);
            await refreshUser?.();
        } catch (err: any) {
            setMessage(err?.response?.data?.error || 'Application submission failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (candidateId: string) => {
        if (user?.isVoted) {
            alert('You have already voted!');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`/api/candidate/vote/${candidateId}`);
            alert('Vote submitted successfully!');
            await refreshUser?.();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Voting failed.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!user || user.role !== 'voter') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Redirecting...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome, Voter</h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-medium">{user.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Aadhaar Number</p>
                            <p className="font-medium">{user.aadharCardNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Role</p>
                            <p className="font-medium capitalize">{user.role}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Vote Status</p>
                            <p className={`font-medium ${user.isVoted ? 'text-green-600' : 'text-orange-600'}`}>
                                {user.isVoted ? '✅ You have already voted.' : '🟡 You have not voted yet.'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Face Verification</p>
                            <p
                                className={`font-medium ${isFaceRecentlyVerified() ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {isFaceRecentlyVerified()
                                    ? '✅ Face is verified'
                                    : '🟡 Face not verified'}
                            </p>
                        </div>

                    </div>

                    <div className="mt-4 flex gap-4">
                        <button
                            onClick={() => setShowPasswordForm(prev => !prev)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Update Password
                        </button>
                        <button
                            onClick={() => router.push('/voter-dashboard/face')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Verify Face
                        </button>
                    </div>

                    {/* Password Update Form */}
                    {showPasswordForm && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div>
                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={passwordForm.currentPassword}
                                        onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Submit'}
                                </button>
                            </form>
                            {message && (
                                <div className={`mt-2 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Run for Election</h2>

                    {user.isCandidateApplicant && (
                        <div className="mb-4 p-4 rounded-md bg-blue-50">
                            <p className="text-sm text-gray-600">Candidacy Application Status</p>
                            <p
                                className={`font-medium ${user.candidateApplicationStatus === 'pending'
                                    ? 'text-yellow-600'
                                    : user.candidateApplicationStatus === 'approved'
                                        ? 'text-green-600'
                                        : user.candidateApplicationStatus === 'rejected'
                                            ? 'text-red-600'
                                            : ''
                                    }`}
                            >
                                {user.candidateApplicationStatus === 'pending' && '⏳ Application pending approval'}
                                {user.candidateApplicationStatus === 'approved' && '✅ Application approved - You are now a candidate!'}
                                {user.candidateApplicationStatus === 'rejected' && '❌ Application rejected'}
                            </p>
                            {user.candidateParty && <p className="text-sm text-gray-600 mt-1">Party: {user.candidateParty}</p>}
                        </div>
                    )}

                    {(!user.isCandidateApplicant || user.candidateApplicationStatus === 'rejected') && !user.isVoted && (
                        <div>
                            <p className="text-gray-600 mb-4">
                                Want to run for election? Apply to become a candidate and get your name on the ballot!
                            </p>
                            <button
                                onClick={() => setShowCandidateForm(prev => !prev)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                Apply as Candidate
                            </button>
                        </div>
                    )}

                    {user.isVoted && !user.isCandidateApplicant && (
                        <div className="p-4 bg-gray-100 rounded-md">
                            <p className="text-gray-600">You cannot apply as a candidate after voting.</p>
                        </div>
                    )}

                    {showCandidateForm && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-4">Candidate Application Form</h3>
                            <form onSubmit={handleCandidateApplication} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your party name"
                                        value={candidateForm.party}
                                        onChange={e => setCandidateForm(prev => ({ ...prev, party: e.target.value }))}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
                                    <textarea
                                        placeholder="Describe your campaign promises and vision (minimum 50 characters)"
                                        value={candidateForm.manifesto}
                                        onChange={e => setCandidateForm(prev => ({ ...prev, manifesto: e.target.value }))}
                                        required
                                        minLength={50}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCandidateForm(false)}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>

                            {message && (
                                <div className={`mt-2 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Candidates Section */}
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Candidates</h2>
                    <div className="space-y-4">
                        {candidates.map(candidate => (
                            <div key={candidate._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-lg">{candidate.name}</p>
                                        <p className="text-gray-600">Party: {candidate.party}</p>
                                    </div>
                                    <button
                                        onClick={() => handleVote(candidate._id)}
                                        disabled={user.isVoted || loading}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {user.isVoted ? 'Already Voted' : 'Vote'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {candidates.length === 0 && <p className="text-gray-600">No candidates available yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
