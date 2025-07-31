'use client'

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

const VerifyPage = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Get email from localStorage (set during registration)
        const verificationEmail = localStorage.getItem('verificationEmail');
        if (verificationEmail) {
            setEmail(verificationEmail);
        }

        // Start resend timer
        setResendTimer(60);
        const timer = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return; // Prevent multiple characters

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
            handleVerifyCode(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyCode = async (verificationCode?: string) => {
        const codeToVerify = verificationCode || code.join('');

        if (codeToVerify.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    code: codeToVerify
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('Email verified successfully!');

                // Update tokens
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('refreshToken', result.refreshToken);
                localStorage.removeItem('verificationEmail');

                // Redirect to onboarding or dashboard
                setTimeout(() => {
                    window.location.href = '/auth/onboarding/interests';
                }, 1500);
            } else {
                setError(result.message || 'Invalid verification code');
                // Clear the code on error
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/resend-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('New verification code sent!');
                setResendTimer(60);

                // Start timer again
                const timer = setInterval(() => {
                    setResendTimer(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to resend code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <Link
                        href="/auth/register"
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-semibold text-white">Verify Email</h1>
                    <div className="w-10"></div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center px-6">
                    <div className="max-w-sm mx-auto text-center">
                        {/* Email Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-500/20 rounded-3xl mb-8">
                            <Mail className="h-10 w-10 text-pink-500" />
                        </div>

                        {/* Title and Description */}
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Check your email
                        </h2>

                        <p className="text-gray-400 mb-2">
                            We've sent a verification code to
                        </p>

                        <p className="text-white font-medium mb-8">
                            {email || 'your email address'}
                        </p>

                        {/* Success Message */}
                        {success && (
                            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm mb-6">
                                {success}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {/* Code Input */}
                        <div className="flex justify-center space-x-3 mb-8">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => {inputRefs.current[index] = el}}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {/* Verify Button */}
                        <button
                            onClick={() => handleVerifyCode()}
                            disabled={loading || code.some(digit => !digit)}
                            className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-6"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        {/* Resend Code */}
                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-2">
                                Didn't receive the code?
                            </p>

                            {resendTimer > 0 ? (
                                <p className="text-gray-500 text-sm">
                                    Resend code in {resendTimer}s
                                </p>
                            ) : (
                                <button
                                    onClick={handleResendCode}
                                    disabled={resendLoading}
                                    className="text-pink-400 font-medium hover:text-pink-300 transition-colors disabled:opacity-50"
                                >
                                    {resendLoading ? 'Sending...' : 'Resend Code'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <div className="px-6 pb-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Check your spam folder if you don't see the email
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyPage;