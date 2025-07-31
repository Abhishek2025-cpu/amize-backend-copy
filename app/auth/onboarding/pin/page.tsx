'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Shield, X } from 'lucide-react';
import Link from 'next/link';

const PinPage = () => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNumberPress = (number: string) => {
        if (step === 'create') {
            if (pin.length < 4) {
                const newPin = pin + number;
                setPin(newPin);

                if (newPin.length === 4) {
                    // Auto-advance to confirm step
                    setTimeout(() => {
                        setStep('confirm');
                    }, 300);
                }
            }
        } else {
            if (confirmPin.length < 4) {
                const newConfirmPin = confirmPin + number;
                setConfirmPin(newConfirmPin);

                if (newConfirmPin.length === 4) {
                    // Auto-verify PIN
                    setTimeout(() => {
                        verifyPin(pin, newConfirmPin);
                    }, 300);
                }
            }
        }
    };

    const handleBackspace = () => {
        if (step === 'create') {
            setPin(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
        }
        setError('');
    };

    const verifyPin = async (originalPin: string, confirmedPin: string) => {
        if (originalPin !== confirmedPin) {
            setError('PINs do not match');
            setConfirmPin('');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Save PIN via API
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    pin: originalPin
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Continue to next step
                window.location.href = '/auth/onboarding/biometric';
            } else {
                setError('Failed to save PIN');
                setConfirmPin('');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setConfirmPin('');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setPin('');
        setConfirmPin('');
        setStep('create');
        setError('');
    };

    const renderPinDots = (currentPin: string) => {
        return (
            <div className="flex space-x-4 justify-center mb-8">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                            index < currentPin.length
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
                        href="/auth/onboarding/profile"
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-semibold text-white">Create New PIN</h1>
                    <button
                        onClick={() => window.location.href = '/auth/onboarding/biometric'}
                        className="text-pink-400 font-medium hover:text-pink-300 transition-colors"
                    >
                        Skip
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="px-6 mb-6 w-md mx-auto">
                    <div className="flex space-x-2">
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-2">Step 3 of 4</p>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center px-6">
                    <div className="max-w-md mx-auto text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-500/20 rounded-3xl mb-8">
                            <Shield className="h-10 w-10 text-pink-500" />
                        </div>

                        {/* Title and Description */}
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
                        </h2>

                        <p className="text-gray-400 mb-8">
                            {step === 'create'
                                ? 'Add a PIN number to make your account more secure'
                                : 'Please enter your PIN again to confirm'
                            }
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">
                                {error}
                                <button
                                    onClick={handleReset}
                                    className="ml-2 text-pink-400 hover:text-pink-300 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* PIN Dots */}
                        {renderPinDots(step === 'create' ? pin : confirmPin)}

                        {/* Loading State */}
                        {loading && (
                            <div className="mb-8">
                                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-400 text-sm mt-2">Saving PIN...</p>
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
                                                        className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center"
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

                        {/* Help Text */}
                        <p className="text-gray-500 text-sm mt-8">
                            {step === 'create'
                                ? 'Choose a 4-digit PIN that you can easily remember'
                                : 'Enter the same PIN you just created'
                            }
                        </p>
                    </div>
                </div>

                {/* Continue Button (when PIN is complete) */}
                {((step === 'create' && pin.length === 4) || (step === 'confirm' && confirmPin.length === 4)) && !loading && (
                    <div className="px-6 pb-8">
                        <div className="max-w-md mx-auto">
                            <button
                                onClick={() => {
                                    if (step === 'create') {
                                        setStep('confirm');
                                    } else {
                                        verifyPin(pin, confirmPin);
                                    }
                                }}
                                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg flex items-center justify-center"
                            >
                                {step === 'create' ? 'Continue' : 'Confirm PIN'}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PinPage;