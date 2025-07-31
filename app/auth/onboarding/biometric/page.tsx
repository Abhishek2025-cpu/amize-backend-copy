'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Fingerprint, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const BiometricPage = () => {
    const [step, setStep] = useState<'setup' | 'scanning' | 'success'>('setup');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (step === 'scanning') {
            // Simulate fingerprint scanning progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStep('success');
                        return 100;
                    }
                    return prev + 10;
                });
            }, 200);

            return () => clearInterval(interval);
        }
    }, [step]);

    const handleSetupBiometric = async () => {
        setStep('scanning');
        setProgress(0);
    };

    const handleContinue = async () => {
        setLoading(true);

        try {
            // Update user biometric preference via API
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    useFingerprint: true
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Complete onboarding and redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                console.error('Failed to update biometric settings:', result.message);
                // Continue anyway
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error('Network error:', err);
            // Continue anyway
            window.location.href = '/dashboard';
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        window.location.href = '/dashboard';
    };

    const renderSetupStep = () => (
        <div className="text-center">
            {/* Fingerprint Icon */}
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8">
                <div className="w-32 h-32 bg-pink-500/20 rounded-full flex items-center justify-center">
                    <Fingerprint className="h-16 w-16 text-pink-500" />
                </div>

                {/* Animated rings */}
                <div className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping"></div>
                <div className="absolute inset-4 rounded-full border-2 border-pink-500/20 animate-pulse"></div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
                Set Your Fingerprint
            </h2>

            <p className="text-gray-400 mb-8 px-4">
                Add a fingerprint to make your account more secure and sign in faster
            </p>

            <button
                onClick={handleSetupBiometric}
                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg flex items-center justify-center mb-4"
            >
                Add Fingerprint
                <ArrowRight className="ml-2 h-5 w-5" />
            </button>

            <button
                onClick={handleSkip}
                className="w-full text-gray-400 py-4 font-medium hover:text-white transition-colors"
            >
                Skip for now
            </button>
        </div>
    );

    const renderScanningStep = () => (
        <div className="text-center">
            {/* Fingerprint Scanning Animation */}
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8">
                <div className="w-32 h-32 bg-pink-500/20 rounded-full flex items-center justify-center">
                    <Fingerprint className="h-16 w-16 text-pink-500" />
                </div>

                {/* Progress overlay */}
                <div
                    className="absolute inset-0 rounded-full bg-pink-500/10"
                    style={{
                        background: `conic-gradient(from 0deg, #ec4899 ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`
                    }}
                />

                {/* Multiple animated rings */}
                <div className="absolute inset-0 rounded-full border-2 border-pink-500 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full border-2 border-pink-400/50 animate-ping"></div>
                <div className="absolute inset-4 rounded-full border-2 border-pink-300/30 animate-pulse"></div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
                Scanning...
            </h2>

            <p className="text-gray-400 mb-8 px-4">
                Place your finger on the sensor and hold still
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="text-pink-400 text-sm">
                {progress}% Complete
            </p>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="text-center">
            {/* Success Animation */}
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8">
                <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="h-16 w-16 text-green-500" />
                </div>

                {/* Success particles */}
                <div className="absolute inset-0">
                    <Sparkles className="absolute top-2 right-8 h-6 w-6 text-pink-500 animate-bounce" />
                    <Sparkles className="absolute bottom-4 left-6 h-4 w-4 text-yellow-500 animate-pulse" />
                    <Sparkles className="absolute top-8 left-2 h-5 w-5 text-blue-500 animate-ping" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
                Congratulations!
            </h2>

            <p className="text-gray-400 mb-8 px-4">
                Your fingerprint has been successfully added. You can now use it to sign in quickly and securely.
            </p>

            <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        Continue to Amize
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                )}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    {step === 'setup' && (
                        <Link
                            href="/auth/onboarding/pin"
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6 text-white" />
                        </Link>
                    )}

                    {step === 'scanning' && (
                        <button
                            onClick={() => setStep('setup')}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6 text-white" />
                        </button>
                    )}

                    {step === 'success' && <div className="w-10"></div>}

                    <h1 className="text-xl font-semibold text-white">
                        {step === 'setup' && 'Set Your Fingerprint'}
                        {step === 'scanning' && 'Scanning Fingerprint'}
                        {step === 'success' && 'Setup Complete'}
                    </h1>

                    {step === 'setup' && (
                        <button
                            onClick={handleSkip}
                            className="text-pink-400 font-medium hover:text-pink-300 transition-colors"
                        >
                            Skip
                        </button>
                    )}

                    {(step === 'scanning' || step === 'success') && <div className="w-10"></div>}
                </div>

                {/* Progress Indicator */}
                <div className="px-6 mb-6 w-md mx-auto">
                    <div className="flex space-x-2">
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-2">Step 4 of 4</p>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center px-6">
                    <div className="max-w-md mx-auto">
                        {step === 'setup' && renderSetupStep()}
                        {step === 'scanning' && renderScanningStep()}
                        {step === 'success' && renderSuccessStep()}
                    </div>
                </div>

                {/* Footer */}
                {step === 'setup' && (
                    <div className="px-6 pb-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Your fingerprint data is stored securely on your device and never shared
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiometricPage;