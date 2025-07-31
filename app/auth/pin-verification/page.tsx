'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, X, User } from 'lucide-react';
import Link from 'next/link';

const PinVerificationPage = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [userInfo, setUserInfo] = useState<any>(null);
    const maxAttempts = 3;

    useEffect(() => {
        // Get user info from localStorage or API
        const email = localStorage.getItem('verificationEmail') || localStorage.getItem('userEmail');
        if (email) {
            setUserInfo({ email });
        }
    }, []);

    const handleNumberPress = (number: string) => {
        if (pin.length < 4 && !loading) {
            const newPin = pin + number;
            setPin(newPin);

            if (newPin.length === 4) {
                // Auto-verify PIN when complete
                setTimeout(() => {
                    verifyPin(newPin);
                }, 300);
            }
        }
    };

    const handleBackspace = () => {
        if (!loading) {
            setPin(prev => prev.slice(0, -1));
            setError('');
        }
    };

    const verifyPin = async (pinToVerify: string) => {
        setLoading(true);
        setError('');

        try {
            // In a real app, you would verify the PIN against the stored hash
            // For demo purposes, we'll simulate the verification

            const response = await fetch('/api/auth/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userInfo?.email,
                    pin: pinToVerify
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Store tokens and redirect
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('refreshToken', result.refreshToken);
                window.location.href = '/dashboard';
            } else {
                setError('Incorrect PIN. Please try again.');
                setAttempts(prev => prev + 1);
                setPin('');

                if (attempts + 1 >= maxAttempts) {
                    setError('Too many failed attempts. Please use password instead.');
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 3000);
                }
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    const renderPinDots = () => {
        return (
            <div className="flex space-x-4 justify-center mb-8">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                            index < pin.length
                                ? 'bg-pink-500 scale-110'
                                : 'bg-gray-700 border-2 border-gray-600'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const numbers = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'backspace']
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <Link
                        href="/auth/login"
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-semibold text-white">Enter PIN</h1>
                    <Link
                        href="/auth/login"
                        className="text-pink-400 font-medium hover:text-pink-300 transition-colors text-sm"
                    >
                        Use Password
                    </Link>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center px-6">
                    <div className="max-w-md mx-auto text-center">
                        {/* User Avatar */}
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-4">
                                <User className="h-10 w-10 text-gray-400" />
                            </div>
                            {userInfo?.email && (
                                <p className="text-gray-400 text-sm">
                                    Welcome back!
                                </p>
                            )}
                        </div>

                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-500/20 rounded-3xl mb-8">
                            <Shield className="h-10 w-10 text-pink-500" />
                        </div>

                        {/* Title and Description */}
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Enter Your PIN
                        </h2>

                        <p className="text-gray-400 mb-8">
                            Please enter your 4-digit PIN to continue
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">
                                {error}
                                {attempts > 0 && attempts < maxAttempts && (
                                    <p className="mt-1 text-xs">
                                        {maxAttempts - attempts} attempt(s) remaining
                                    </p>
                                )}
                            </div>
                        )}

                        {/* PIN Dots */}
                        {renderPinDots()}

                        {/* Loading State */}
                        {loading && (
                            <div className="mb-8">
                                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-400 text-sm mt-2">Verifying PIN...</p>
                            </div>
                        )}

                        {/* Number Pad */}
                        {!loading && (
                            <div className="max-w-xs mx-auto">
                                <div className="grid grid-cols-3 gap-4">
                                    {numbers.map((row, rowIndex) =>
                                        row.map((num, colIndex) => {
                                            if (num === '') {
                                                return <div key={`${rowIndex}-${colIndex}`} className="w-16 h-16" />;
                                            }

                                            if (num === 'backspace') {
                                                return (
                                                    <button
                                                        key={`${rowIndex}-${colIndex}`}
                                                        onClick={handleBackspace}
                                                        className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center disabled:opacity-50"
                                                        disabled={pin.length === 0}
                                                    >
                                                        <X className="h-6 w-6 text-white" />
                                                    </button>
                                                );
                                            }

                                            return (
                                                <button
                                                    key={`${rowIndex}-${colIndex}`}
                                                    onClick={() => handleNumberPress(num)}
                                                    className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center text-white text-xl font-semibold"
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Biometric Option */}
                        <div className="mt-8">
                            <button
                                onClick={() => {
                                    // In a real app, this would trigger biometric authentication
                                    alert('Biometric authentication would be triggered here');
                                }}
                                className="flex items-center justify-center space-x-2 text-pink-400 hover:text-pink-300 transition-colors mx-auto"
                            >
                                <Shield className="h-5 w-5" />
                                <span className="text-sm font-medium">Use Fingerprint</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Options */}
                <div className="px-6 pb-8 text-center space-y-4">
                    <p className="text-gray-500 text-sm">
                        Forgot your PIN?
                    </p>
                    <div className="flex justify-center space-x-6">
                        <Link
                            href="/auth/forgot-password"
                            className="text-pink-400 hover:text-pink-300 transition-colors text-sm font-medium"
                        >
                            Reset Password
                        </Link>
                        <Link
                            href="/auth/login"
                            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Use Password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinVerificationPage;