'use client'

import React, {useState} from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight, CarFront, Flower,
  Footprints,
  Gamepad2,
  Gem, GraduationCap, Ham, LaptopMinimal,
  Laugh,
  Music, PawPrint, PenTool, Plane,
  Sparkles,
  Trophy,
  WandSparkles, X
} from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";

const InterestsPage = () => {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const interests = [
        {
            name: 'Music',
            icon: <Music className="h-6 w-6"/>,
            color: 'from-purple-500 to-pink-500'
        },
        {
            name: 'Dance',
            icon: <WandSparkles className="h-6 w-6"/>,
            color: 'from-pink-500 to-red-500'
        },
        {
            name: 'Comedy',
            icon: <Laugh className="h-6 w-6"/>,
            color: 'from-yellow-500 to-orange-500'
        },
        {
            name: 'Sports',
            icon: <Trophy className="h-6 w-6"/>,
            color: 'from-green-500 to-blue-500'
        },
        {
            name: 'Gaming',
            icon: <Gamepad2 className="h-6 w-6"/>,
            color: 'from-blue-500 to-purple-500'
        },
        {
            name: 'Beauty',
            icon: <Gem className="h-6 w-6"/>,
            color: 'from-pink-500 to-purple-500'
        },
        {
            name: 'Fashion',
            icon: <Footprints className="h-6 w-6"/>,
            color: 'from-purple-500 to-indigo-500'
        },
        {
            name: 'Food',
            icon: <Ham className="h-6 w-6"/>,
            color: 'from-orange-500 to-red-500'
        },
        {
            name: 'Travel',
            icon: <Plane className="h-6 w-6"/>,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            name: 'Education',
            icon: <GraduationCap className="h-6 w-6"/>,
            color: 'from-indigo-500 to-blue-500'
        },
        {
            name: 'Technology',
            icon: <LaptopMinimal className="h-6 w-6"/>,
            color: 'from-gray-500 to-blue-500'
        },
        {
            name: 'Art',
            icon: <PenTool className="h-6 w-6"/>,
            color: 'from-pink-500 to-orange-500'
        },
        {
            name: 'Fitness',
            icon: <Activity className="h-6 w-6"/>,
            color: 'from-green-500 to-teal-500'
        },
        {
            name: 'Pets',
            icon: <PawPrint className="h-6 w-6"/>,
            color: 'from-yellow-500 to-green-500'
        },
        {
            name: 'Cars',
            icon: <CarFront className="h-6 w-6"/>,
            color: 'from-red-500 to-gray-500'
        },
        {
            name: 'Nature',
            icon: <Flower className="h-6 w-6"/>,
            color: 'from-green-500 to-emerald-500'
        }
    ];

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleContinue = async () => {
        if (selectedInterests.length === 0) {
            // Allow users to skip this step
            window.location.href = '/auth/onboarding/profile';
            return;
        }

        setLoading(true);

        try {
            // Update user interests via API
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    interests: selectedInterests
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Continue to next step
                window.location.href = '/auth/onboarding/profile';
            } else {
                console.error('Failed to update interests:', result.message);
                // Continue anyway
                window.location.href = '/auth/onboarding/profile';
            }
        } catch (err) {
            console.error('Network error:', err);
            // Continue anyway
            window.location.href = '/auth/onboarding/profile';
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div
                className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div
                className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <Link
                        href="/auth/verify"
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-white"/>
                    </Link>
                    <h1 className="text-xl font-semibold text-white">Choose Your Interest</h1>
                    <button
                        onClick={handleContinue}
                        className="text-pink-400 font-medium hover:text-pink-300 transition-colors"
                    >
                        Skip
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="px-6 mb-6 w-md mx-auto">
                    <div className="flex space-x-2">
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-2">Step 1 of 4</p>
                </div>

                {/* Content */}
                <div className="flex-1 px-6">
                    <div className="max-w-md mx-auto">
                        {/* Icon and Description */}
                        <div className="text-center mb-8">
                            <div
                                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mb-6">
                              <Image src="/amize.png" width={80} height={80} alt="Amize Logo"/>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4">
                                Tell Us About Yourself
                            </h2>

                            <p className="text-gray-400">
                                Choose your interests and we'll show you the best videos
                            </p>
                        </div>

                        {/* Interest Selection */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {interests.map((interest) => (
                                <button
                                    key={interest.name}
                                    onClick={() => toggleInterest(interest.name)}
                                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                                        selectedInterests.includes(interest.name)
                                            ? 'border-pink-500 bg-pink-500/20'
                                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                    }`}
                                >
                                    <div className="flex flex-col items-center space-y-2">
                                        <div
                                            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${interest.color} flex items-center justify-center text-2xl`}>
                                            {interest.icon}
                                        </div>
                                        <div className="text-white font-medium text-sm">
                                            {interest.name}
                                        </div>
                                    </div>

                                    {selectedInterests.includes(interest.name) && (
                                        <div
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                            <X className="h-3 w-3 text-white"/>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Selected Count */}
                        {selectedInterests.length > 0 && (
                            <div className="text-center mb-6">
                                <p className="text-gray-400 text-sm">
                                    {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Continue Button */}
                <div className="px-6 pb-8">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleContinue}
                            disabled={loading}
                            className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="ml-2 h-5 w-5"/>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterestsPage;