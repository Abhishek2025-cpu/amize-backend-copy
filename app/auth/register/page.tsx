// 'use client'

// import React, {useState} from 'react';
// import {ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar, Loader2} from 'lucide-react';
// import Link from 'next/link';
// import Image from "next/image";

// const RegisterPage = () => {
//     const [formData, setFormData] = useState({
//         firstName: '',
//         lastName: '',
//         username: '',
//         email: '',
//         password: '',
//         confirmPassword: '',
//         dateOfBirth: ''
//     });
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [acceptTerms, setAcceptTerms] = useState(false);

//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const {name, value} = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const validateForm = () => {
//         if (!formData.firstName || !formData.lastName || !formData.username ||
//             !formData.email || !formData.password || !formData.confirmPassword ||
//             !formData.dateOfBirth) {
//             setError('Please fill in all fields');
//             return false;
//         }

//         if (formData.password !== formData.confirmPassword) {
//             setError('Passwords do not match');
//             return false;
//         }

//         if (formData.password.length < 8) {
//             setError('Password must be at least 8 characters long');
//             return false;
//         }

//         if (!acceptTerms) {
//             setError('Please accept the terms and conditions');
//             return false;
//         }

//         // Check if user is at least 13 years old
//         const birthDate = new Date(formData.dateOfBirth);
//         const today = new Date();
//         const age = today.getFullYear() - birthDate.getFullYear();
//         if (age < 13) {
//             setError('You must be at least 13 years old to register');
//             return false;
//         }

//         return true;
//     };

//     const handleSubmit = async () => {
//         if (!validateForm()) return;

//         setLoading(true);
//         setError('');

//         try {
//             const response = await fetch('https://amize-backend-copy.onrender.com/api/auth/register', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(formData),
//             });

//             const result = await response.json();

//             if (result.success) {
//                 // Store tokens temporarily
//                 localStorage.setItem('authToken', result.token);
//                 localStorage.setItem('refreshToken', result.refreshToken);
//                 localStorage.setItem('verificationEmail', formData.email);

//                 // Redirect to email verification
//                 window.location.href = '/auth/verify';
//             } else {
//                 setError(result.message || 'Registration failed');
//             }
//         } catch (err) {
//             setError('Network error. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div
//             className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-br via-gray-900 to-gray-950">
//             {/* Background decorations */}
//             <div
//                 className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
//             <div
//                 className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

//             <div className="z-10 flex flex-col my-auto items-center justify-center">
//                 <div
//                     className="absolute top-4 left-4 md:top-6 md:left-6 h-10 w-10 p-2 bg-gray-800/70 rounded-full hover:bg-gray-700 transition-colors">
//                     <Link
//                         href="/auth/welcome"
//                         className="rounded-full transition-colors"
//                     >
//                         <ArrowLeft className="h-6 w-6 text-white"/>
//                     </Link>
//                 </div>

//                 {/* Header */}
//                 <div className="text-center mb-6">
//                     <div className="relative inline-flex items-center justify-center mb-6">
//                         <div className="animate-spin w-24 h-24 bg-gradient-to-br from-pink-500 to-red-400 rounded-full">
//                         </div>
//                         <Image width={100} height={100} src="/amize.png" alt="Amize Logo" className="absolute w-[100px] h-[100px] rounded-full object-cover top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
//                     </div>

//                     <h1 className="text-4xl font-bold text-white mb-4">
//                         Amize Sign Up
//                     </h1>

//                     <p className="text-gray-400 text-lg max-w-sm mx-auto">
//                         Join millions of creators sharing amazing videos worldwide
//                     </p>
//                 </div>

//                 {/* Form */}
//                 <div className="flex-1 px-6 py-4">
//                     <div className="max-w-sm mx-auto space-y-4">
//                         {/* Error Message */}
//                         {error && (
//                             <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
//                                 {error}
//                             </div>
//                         )}

//                         {/* Name Fields */}
//                         <div className="grid grid-cols-2 gap-4">
//                             <div className="space-y-2">
//                                 <label className="block text-sm font-medium text-gray-300">
//                                     First Name
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         type="text"
//                                         name="firstName"
//                                         value={formData.firstName}
//                                         onChange={handleInputChange}
//                                         className="w-full pl-6 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                         placeholder="First name"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="space-y-2">
//                                 <label className="block text-sm font-medium text-gray-300">
//                                     Last Name
//                                 </label>
//                                 <div className="relative">
//                                     <input
//                                         type="text"
//                                         name="lastName"
//                                         value={formData.lastName}
//                                         onChange={handleInputChange}
//                                         className="w-full pl-6 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                         placeholder="Last name"
//                                     />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Username Field */}
//                         <div className="space-y-2">
//                             <label className="block text-sm font-medium text-gray-300">
//                                 Username
//                             </label>
//                             <div className="relative">
//                                 <User
//                                     className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
//                                 <input
//                                     type="text"
//                                     name="username"
//                                     value={formData.username}
//                                     onChange={handleInputChange}
//                                     className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                     placeholder="Choose username"
//                                 />
//                             </div>
//                         </div>

//                         {/* Email Field */}
//                         <div className="space-y-2">
//                             <label className="block text-sm font-medium text-gray-300">
//                                 Email
//                             </label>
//                             <div className="relative">
//                                 <Mail
//                                     className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
//                                 <input
//                                     type="email"
//                                     name="email"
//                                     value={formData.email}
//                                     onChange={handleInputChange}
//                                     className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                     placeholder="Enter your email"
//                                 />
//                             </div>
//                         </div>

//                         {/* Date of Birth */}
//                         <div className="space-y-2">
//                             <label className="block text-sm font-medium text-gray-300">
//                                 Date of Birth
//                             </label>
//                             <div className="relative">
//                                 <Calendar
//                                     className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
//                                 <input
//                                     type="date"
//                                     name="dateOfBirth"
//                                     value={formData.dateOfBirth}
//                                     onChange={handleInputChange}
//                                     className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                 />
//                             </div>
//                         </div>

//                         {/* Password Field */}
//                         <div className="space-y-2">
//                             <label className="block text-sm font-medium text-gray-300">
//                                 Password
//                             </label>
//                             <div className="relative">
//                                 <Lock
//                                     className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
//                                 <input
//                                     type={showPassword ? 'text' : 'password'}
//                                     name="password"
//                                     value={formData.password}
//                                     onChange={handleInputChange}
//                                     className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                     placeholder="Create password"
//                                 />
//                                 <button
//                                     type="button"
//                                     onClick={() => setShowPassword(!showPassword)}
//                                     className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
//                                 >
//                                     {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Confirm Password Field */}
//                         <div className="space-y-2">
//                             <label className="block text-sm font-medium text-gray-300">
//                                 Confirm Password
//                             </label>
//                             <div className="relative">
//                                 <Lock
//                                     className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
//                                 <input
//                                     type={showConfirmPassword ? 'text' : 'password'}
//                                     name="confirmPassword"
//                                     value={formData.confirmPassword}
//                                     onChange={handleInputChange}
//                                     className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                                     placeholder="Confirm password"
//                                 />
//                                 <button
//                                     type="button"
//                                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                                     className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
//                                 >
//                                     {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Terms and Conditions */}
//                         <div className="flex items-start space-x-3 py-2">
//                             <input
//                                 type="checkbox"
//                                 id="terms"
//                                 checked={acceptTerms}
//                                 onChange={(e) => setAcceptTerms(e.target.checked)}
//                                 className="w-4 h-4 mt-1 text-pink-500 bg-gray-800 border-gray-600 rounded focus:ring-pink-500 focus:ring-2"
//                             />
//                             <label htmlFor="terms" className="text-sm text-gray-300">
//                                 I agree to the{' '}
//                                 <Link href="/terms" className="text-pink-400 hover:text-pink-300">
//                                     Terms of Service
//                                 </Link>
//                                 {' '}and{' '}
//                                 <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
//                                     Privacy Policy
//                                 </Link>
//                             </label>
//                         </div>

//                         {/* Sign Up Button */}
//                         <button
//                             onClick={handleSubmit}
//                             disabled={loading}
//                             className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                         >
//                             {loading ? (
//                                 <Loader2 className="h-5 w-5 animate-spin"/>
//                             ) : (
//                                 'Sign Up'
//                             )}
//                         </button>
//                     </div>
//                 </div>

//                 {/* Social Login Options */}
//                 <div className="px-6 pb-4">
//                     <div className="max-w-sm mx-auto">
//                         <div className="flex items-center mb-6">
//                             <div className="flex-1 border-t border-gray-700"></div>
//                             <span className="px-4 text-gray-500 text-sm">or continue with</span>
//                             <div className="flex-1 border-t border-gray-700"></div>
//                         </div>

//                         <div className="flex justify-center space-x-6">
//                             <button
//                                 className="p-4 bg-gray-800 border border-gray-700 rounded-2xl hover:bg-gray-700 transition-colors">
//                                 <svg className="w-6 h-6" viewBox="0 0 24 24">
//                                     <path fill="#1877F2"
//                                           d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
//                                 </svg>
//                             </button>

//                             <button
//                                 className="p-4 bg-gray-800 border border-gray-700 rounded-2xl hover:bg-gray-700 transition-colors">
//                                 <svg className="w-6 h-6" viewBox="0 0 24 24">
//                                     <path fill="#4285F4"
//                                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                                     <path fill="#34A853"
//                                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                                     <path fill="#FBBC05"
//                                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                                     <path fill="#EA4335"
//                                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//                                 </svg>
//                             </button>

//                             <button
//                                 className="p-4 bg-gray-800 border border-gray-700 rounded-2xl hover:bg-gray-700 transition-colors">
//                                 <svg className="w-6 h-6" fill="#fff" height="200px" width="200px" version="1.1"
//                                      id="Layer_1" viewBox="0 0 512 512">
//                                     <g id="SVGRepo_bgCarrier"></g>
//                                     <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
//                                     <g id="SVGRepo_iconCarrier">
//                                         <path
//                                             d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M265.1,142.1 c9.4-11.4,25.4-20.1,39.1-21.1c2.3,15.6-4.1,30.8-12.5,41.6c-9,11.6-24.5,20.5-39.5,20C249.6,167.7,256.6,152.4,265.1,142.1z M349.4,339.9c-10.8,16.4-26,36.9-44.9,37.1c-16.8,0.2-21.1-10.9-43.8-10.8c-22.7,0.1-27.5,11-44.3,10.8 c-18.9-0.2-33.3-18.7-44.1-35.1c-30.2-46-33.4-99.9-14.7-128.6c13.2-20.4,34.1-32.3,53.8-32.3c20,0,32.5,11,49.1,11 c16,0,25.8-11,48.9-11c17.5,0,36,9.5,49.2,26c-43.2,23.7-36.2,85.4,7.5,101.9C360,322.1,357.1,328.1,349.4,339.9z"></path>
//                                     </g>
//                                 </svg>
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Sign In Link */}
//                 <div className="px-6 pb-8 text-center">
//                     <span className="text-gray-400">Already have an account? </span>
//                     <Link
//                         href="/auth/login"
//                         className="text-pink-400 font-medium hover:text-pink-300 transition-colors"
//                     >
//                         Sign in
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default RegisterPage;




// RegisterPage.tsx

// RegisterPage.tsx

'use client'

import React, { useState, FormEvent, ChangeEvent } from 'react'; // <-- Import specific event types
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Calendar, Loader2, KeyRound } from 'lucide-react';

// --- TYPE ADDED ---
// Props for the VerificationStep component are now clearly defined.
interface VerificationStepProps {
    onSubmit: (otp: string) => void;
    email: string;
    loading: boolean;
    error: string;
    setError: (error: string) => void;
}

const VerificationStep = ({ onSubmit, email, loading, error, setError }: VerificationStepProps) => {
    const [otp, setOtp] = useState('');

    // --- TYPE ADDED ---
    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a 6-digit verification code.');
            return;
        }
        onSubmit(otp);
    };

    return (
        <form onSubmit={handleFormSubmit} className="max-w-sm mx-auto space-y-4">
            <p className="text-center text-gray-300">
                A verification code has been sent to <br />
                <span className="font-bold text-white">{email}</span>.
            </p>
             {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Verification Code
                </label>
                <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                    <input
                        type="text"
                        value={otp}
                        // --- TYPE ADDED ---
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                        maxLength={6}
                        className="w-full text-center tracking-[1em] pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="______"
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Verify and Complete'}
            </button>
        </form>
    );
};


// The Main Registration Page Component
const RegisterPage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', username: '', email: '',
        password: '', confirmPassword: '', dateOfBirth: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // --- TYPE ADDED ---
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    // --- TYPE ADDED ---
    const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!formData.firstName || !formData.email || !formData.password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!acceptTerms) {
            setError('You must accept the terms and conditions.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed. Please try again.');
            }

            setStep(2);

        } catch (err: any) { // <-- TYPE ADDED for `err`
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // --- TYPE ADDED ---
    const handleVerifySubmit = async (otp: string) => {
        setError('');
        setLoading(true);
        try {
             const response = await fetch(`${API_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, code: otp }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Verification failed. Please try again.');
            }

            alert('Registration successful! Welcome to Amize.');
            router.push('/auth/login');

        } catch (err: any) { // <-- TYPE ADDED for `err`
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-br from-gray-900 to-black">
            {/* ... Background decorations ... */}
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="z-10 flex flex-col my-auto items-center justify-center">
                <div className="absolute top-4 left-4 md:top-6 md:left-6 h-10 w-10 p-2 bg-gray-800/70 rounded-full hover:bg-gray-700 transition-colors">
                    <Link href="/auth/welcome" className="rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-white"/>
                    </Link>
                </div>

                <div className="text-center mb-6">
                     <div className="relative inline-flex items-center justify-center mb-6">
                        <div className="animate-spin w-24 h-24 bg-gradient-to-br from-pink-500 to-red-400 rounded-full"></div>
                        <Image width={100} height={100} src="/amize.png" alt="Amize Logo" className="absolute w-[100px] h-[100px] rounded-full object-cover top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
                    </h1>
                    <p className="text-gray-400 text-lg max-w-sm mx-auto">
                        {step === 1 ? 'Join millions of creators sharing amazing videos worldwide.' : 'Check your inbox for your 6-digit code.'}
                    </p>
                </div>

                <div className="flex-1 px-6 py-4 w-full max-w-sm">
                    {step === 1 ? (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            {error && (
                                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                               <div className="relative">
                                     <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full pl-6 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="First name" required />
                                </div>
                                <div className="relative">
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full pl-6 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Last name" required />
                                </div>
                            </div>
                            
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white" placeholder="Choose username" required />
                            </div>
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-white" placeholder="Enter your email" required />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white" required />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white" placeholder="Create password" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white" placeholder="Confirm password" required />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                </button>
                            </div>
                            
                            <div className="flex items-start space-x-3 py-2">
                                {/* --- TYPE ADDED --- */}
                                <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e: ChangeEvent<HTMLInputElement>) => setAcceptTerms(e.target.checked)} className="w-4 h-4 mt-1 text-pink-500 bg-gray-800 border-gray-600 rounded focus:ring-pink-500" />
                                <label htmlFor="terms" className="text-sm text-gray-300">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-pink-400 hover:text-pink-300">Terms</Link>
                                    {' & '}<Link href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</Link>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-semibold hover:bg-pink-600 transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Sign Up'}
                            </button>
                        </form>
                    ) : (
                        <VerificationStep 
                            onSubmit={handleVerifySubmit} 
                            email={formData.email} 
                            loading={loading}
                            error={error}
                            setError={setError}
                        />
                    )}
                </div>

                 {step === 1 && (
                    <>
                        {/* ... Social Login and Sign in link ... */}
                    </>
                 )}
            </div>
        </div>
    );
};

export default RegisterPage;


