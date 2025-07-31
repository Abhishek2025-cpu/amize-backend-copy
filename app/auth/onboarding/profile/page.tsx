'use client'

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, User } from 'lucide-react';
import Link from 'next/link';

const ProfilePage = () => {
    const [formData, setFormData] = useState({
        bio: '',
        phoneNumber: '',
        address: '',
        profilePhotoUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);

        try {
            // In a real app, you would upload to your image service
            // For demo purposes, we'll use a data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    profilePhotoUrl: e.target?.result as string
                }));
                setUploadingImage(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadingImage(false);
        }
    };

    const handleContinue = async () => {
        setLoading(true);

        try {
            // Update user profile via API
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                // Continue to next step
                window.location.href = '/auth/onboarding/pin';
            } else {
                console.error('Failed to update profile:', result.message);
                // Continue anyway
                window.location.href = '/auth/onboarding/pin';
            }
        } catch (err) {
            console.error('Network error:', err);
            // Continue anyway
            window.location.href = '/auth/onboarding/pin';
        } finally {
            setLoading(false);
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
                        href="/auth/onboarding/interests"
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-semibold text-white">Fill Your Profile</h1>
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
                        <div className="flex-1 h-2 bg-pink-500 rounded-full"></div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full"></div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-2">Step 2 of 4</p>
                </div>

                {/* Content */}
                <div className="flex-1 px-6">
                    <div className="max-w-md mx-auto">
                        {/* Profile Photo Upload */}
                        <div className="text-center mb-8">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-700 overflow-hidden mb-4 relative">
                                    {formData.profilePhotoUrl ? (
                                        <img
                                            src={formData.profilePhotoUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}

                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="profile-photo"
                                />

                                <label
                                    htmlFor="profile-photo"
                                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-600 transition-colors shadow-lg"
                                >
                                    <Camera className="h-5 w-5 text-white" />
                                </label>
                            </div>

                            <p className="text-gray-400 text-sm">
                                Add a profile photo
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={3}
                                    maxLength={80}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                                <p className="text-gray-500 text-xs text-right">
                                    {formData.bio.length}/80
                                </p>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Phone Number (Optional)
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Location (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>
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
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;