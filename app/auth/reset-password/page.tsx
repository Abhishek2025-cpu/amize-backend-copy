'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

const ResetPasswordPage = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Get token from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('token');
        if (resetToken) {
            setToken(resetToken);
        } else {
            setError('Invalid reset link');
        }
    }, []);

    useEffect(() => {
        // Calculate password strength
        const password = formData.password;
        let strength = 0;

        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        setPasswordStrength(strength);
    }, [formData.password]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (passwordStrength < 3) {
            setError('Password is too weak. Please include uppercase, lowercase, numbers, and special characters.');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 3000);
            } else {
                setError(result.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 2) return 'Weak';
        if (passwordStrength <= 3) return 'Medium';
        return 'Strong';
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br via-gray-900 to-gray-950">
                {/* Background decorations */}
                <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 min-h-screen flex flex-col justify-center px-6">
                    <div className="max-w-sm mx-auto text-center">
                        {/* Success Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl mb-8">
                            <Check className="h-10 w-10 text-green-500" />
                        </div>

                        {/* Title and Description */}
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Password Reset Successful!
                        </h2>

                        <p className="text-gray-400 mb-8">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>

                        {/* Auto-redirect message */}
                        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm mb-6">
                            Redirecting to login page in 3 seconds...
                        </div>

                        {/* Manual redirect */}
                        <Link
                            href="/auth/login"
                            className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg flex items-center justify-center"
                        >
                            Sign In Now
                        </Link>
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
                    <h1 className="text-xl font-semibold text-white">Create New Password</h1>
                    <div className="w-10"></div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center px-6">
                    <div className="max-w-sm mx-auto">
                        {/* Icon and Description */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-500/20 rounded-3xl mb-6">
                                <Lock className="h-10 w-10 text-pink-500" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4">
                                Set New Password
                            </h2>

                            <p className="text-gray-400">
                                Your new password must be different from previously used passwords.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-6">
                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Password Strength:</span>
                                            <span className={`font-medium ${
                                                passwordStrength <= 2 ? 'text-red-400' :
                                                    passwordStrength <= 3 ? 'text-yellow-400' :
                                                        'text-green-400'
                                            }`}>
                        {getPasswordStrengthText()}
                      </span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        placeholder="Confirm new password"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Password Match Indicator */}
                                {formData.confirmPassword && (
                                    <div className="flex items-center space-x-2">
                                        {formData.password === formData.confirmPassword ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <div className="h-4 w-4 rounded-full border-2 border-red-500" />
                                        )}
                                        <span className={`text-sm ${
                                            formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'
                                        }`}>
                      {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !token}
                                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>

                        {/* Password Requirements */}
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</h4>
                            <ul className="text-xs text-gray-400 space-y-1">
                                <li className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-600'}`} />
                                    <span>At least 8 characters</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                                    <span>One uppercase letter</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                                    <span>One lowercase letter</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                                    <span>One number</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-600'}`} />
                                    <span>One special character</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;