'use client'

import React, { useState } from 'react';
import { ArrowLeft, Mail, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (result.success) {
                setEmailSent(true);
            } else {
                setError(result.message || 'Failed to send reset email');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
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
                        <h1 className="text-xl font-semibold text-white">Password Reset</h1>
                        <div className="w-10"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center px-6">
                        <div className="max-w-sm mx-auto text-center">
                            {/* Success Icon */}
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl mb-8">
                                <MessageCircle className="h-10 w-10 text-green-500" />
                            </div>

                            {/* Title and Description */}
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Check your email
                            </h2>

                            <p className="text-gray-400 mb-2">
                                We've sent a password reset link to
                            </p>

                            <p className="text-white font-medium mb-8">
                                {email}
                            </p>

                            <p className="text-gray-400 text-sm mb-8">
                                Click the link in the email to reset your password. If you don't see it, check your spam folder.
                            </p>

                            {/* Back to Login */}
                            <Link
                                href="/auth/login"
                                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg flex items-center justify-center"
                            >
                                Back to Login
                            </Link>

                            {/* Resend Email */}
                            <button
                                onClick={() => setEmailSent(false)}
                                className="w-full text-gray-400 py-4 font-medium hover:text-white transition-colors mt-4"
                            >
                                Didn't receive it? Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-xl font-semibold text-white">Forgot Password</h1>
                    <div className="w-10"></div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center px-6">
                    <div className="max-w-sm mx-auto text-center">
                        {/* Illustration */}
                        <div className="mb-8">
                            <div className="relative w-48 h-32 mx-auto">
                                {/* Sad person illustration */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
                                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                                            <Image width={40} height={40} src="/amize.png" alt="Amize Logo" className="absolute w-[40px] h-[40px] rounded-full object-cover top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Question marks */}
                                <div className="absolute top-2 right-8 w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-500 font-bold animate-bounce">
                                    ?
                                </div>
                                <div className="absolute bottom-4 left-4 w-6 h-6 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-500 font-bold animate-pulse">
                                    ?
                                </div>
                            </div>
                        </div>

                        {/* Title and Description */}
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Forgot Password?
                        </h2>

                        <p className="text-gray-400 mb-8">
                            Don't worry! It happens. Please enter the email address associated with your account.
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300 text-left">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Remember your password?{' '}
                        <Link
                            href="/auth/login"
                            className="text-pink-400 font-medium hover:text-pink-300 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;