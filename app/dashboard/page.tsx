'use client'
import React, { useState, useEffect } from 'react';
import { User, Construction, Clock, WandSparkles } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface UserData {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    bio?: string;
    profilePhotoUrl?: string;
    verified: boolean;
    creatorVerified: boolean;
    role: string;
}

const Dashboard = () => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await fetch('https://amize-backend-copy.onrender.com//api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            if (data.success) {
                setUser(data.user);
            } else {
                setError(data.message || 'Failed to fetch user data');
            }
        } catch (err) {
            setError('Error loading user data');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin loading loading-ring loading-lg"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.href = '/auth/login'}
                        className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <div>
                <Navbar />
            </div>

            <div className="min-h-[80vh] z-10">
                {/* Main Content */}
                <div className="max-w-6xl mx-auto mt-12 px-6 py-12">
                    {/* Welcome Card */}
                    <div className="mb-8">
                        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 text-center">
                            <div className="mb-6">
                                {user?.profilePhotoUrl ? (
                                    <img
                                        src={user.profilePhotoUrl}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover border-4 border-pink-500 mx-auto"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-400 rounded-full flex items-center justify-center mx-auto">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                )}
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-2">
                                Welcome back, {user?.firstName || user?.username}!
                            </h2>

                            <div className="flex items-center justify-center space-x-4 text-gray-400 mb-4">
                                <span>@{user?.username}</span>
                                <span>•</span>
                                <span className="capitalize">{user?.role?.toLowerCase() || 'User'}</span>
                                {user?.verified && (
                                    <>
                                        <span>•</span>
                                        <div className="flex items-center text-blue-400">
                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-1">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            Verified
                                        </div>
                                    </>
                                )}
                                {user?.creatorVerified && (
                                    <>
                                        <span>•</span>
                                        <div className="flex items-center text-pink-400">
                                            <WandSparkles className="w-4 h-4 mr-1" />
                                            Creator
                                        </div>
                                    </>
                                )}
                            </div>

                            {user?.bio && (
                                <p className="text-gray-300 max-w-md mx-auto">{user.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* Development Notice */}
                    <div className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 border border-slate-500/30 rounded-2xl p-8 text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-2xl mb-4">
                                <Construction className="w-8 h-8 text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Dashboard Under Development</h3>
                            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                                We're working hard to build an amazing dashboard experience for you. This page will soon include
                                analytics, content management, creator tools, and much more!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-700/50">
                                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <WandSparkles className="w-6 h-6 text-pink-400" />
                                </div>
                                <h4 className="font-semibold text-white mb-2">Content Creation</h4>
                                <p className="text-gray-400 text-sm">Upload and manage your videos with advanced editing tools</p>
                            </div>

                            <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-700/50">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <User className="w-6 h-6 text-blue-400" />
                                </div>
                                <h4 className="font-semibold text-white mb-2">Analytics</h4>
                                <p className="text-gray-400 text-sm">Track your content performance and audience engagement</p>
                            </div>

                            <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-700/50">
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-6 h-6 text-green-400" />
                                </div>
                                <h4 className="font-semibold text-white mb-2">Coming Soon</h4>
                                <p className="text-gray-400 text-sm">Monetization tools, live streaming, and creator resources</p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-400 text-white rounded-xl font-medium hover:from-pink-600 hover:to-red-500 transition-all duration-200"
                            >
                                Explore Amize
                            </button>
                            <button
                                onClick={() => window.location.href = '/profile/settings'}
                                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors border border-gray-700"
                            >
                                Profile Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Dashboard;