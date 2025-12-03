'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface VoteResult {
    party: string;
    name: string;
    voteCount: number;
    id: string;
}

export default function ResultsPage() {
    const [results, setResults] = useState<VoteResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchResults = async () => {
        try {
            const response = await axios.get('/api/candidate/vote/count');
            const data = response.data;
            setResults(data);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('Results have not been declared yet.');
            } else {
                setError('Failed to load results.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading results...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <div className="text-5xl mb-4">🗳️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Election Results</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
    const winner = results.length > 0 ? results[0] : null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Election Results</h1>
                            <p className="text-gray-600 mt-1">Total Votes Cast: {totalVotes}</p>
                        </div>
                        <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>

                {/* Winner Card */}
                {winner && (
                    <div className="bg-white shadow-md rounded-lg p-6 mb-6 border-2 border-green-500">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">🏆</span>
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="text-sm font-medium text-green-600 uppercase tracking-wide">Winner</div>
                                <h2 className="text-2xl font-bold text-gray-900">{winner.name}</h2>
                                <p className="text-gray-600">{winner.party}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-green-600">{winner.voteCount}</div>
                                <div className="text-sm text-gray-600">votes</div>
                                <div className="text-sm text-gray-500">
                                    {totalVotes > 0 ? ((winner.voteCount / totalVotes) * 100).toFixed(1) : '0'}%
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Results */}
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">All Candidates</h2>
                    <div className="space-y-4">
                        {results.map((result, index) => {
                            const percentage = totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0;
                            const isWinner = index === 0;

                            return (
                                <div
                                    key={result.id}
                                    className={`border rounded-lg p-4 ${isWinner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isWinner ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{result.name}</div>
                                                <div className="text-sm text-gray-600">{result.party}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-gray-900">{result.voteCount}</div>
                                            <div className="text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                                        </div>
                                    </div>

                                    {/* ProgressBar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${isWinner ? 'bg-green-600' : 'bg-blue-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Candidates</div>
                        <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                    </div>
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-sm text-gray-600">Total Votes</div>
                        <div className="text-2xl font-bold text-gray-900">{totalVotes}</div>
                    </div>
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-sm text-gray-600">Winning Margin</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {results.length >= 2 ? results[0].voteCount - results[1].voteCount : '-'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
