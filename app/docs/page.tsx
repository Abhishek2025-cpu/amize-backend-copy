'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css'; // Default Swagger UI styles
import {
    Loader2,
    AlertCircle,
    BookOpen,
    Code,
    FileText,
    Lock,
    Fingerprint,
    UserCircle,
    Server,
    HelpCircle,
    ArrowLeft,
    Search,
    Heart,
    Shield,
    Bell,
    MessageSquare
} from 'lucide-react';

import './swagger-custom.css'; // Custom styles for Swagger UI

// Dynamically import SwaggerUI with SSR disabled
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-pink-500" />
            <span className="ml-2 text-gray-600">Loading API documentation...</span>
        </div>
    )
});

export default function DocsPage() {
    const [spec, setSpec] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState<{[key: string]: boolean}>({});
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        async function fetchSwaggerSpec() {
            try {
                const res = await fetch('/api/swagger.json');
                if (!res.ok) {
                    throw new Error('Failed to fetch API specification');
                }
                const spec = await res.json();
                setSpec(spec);

                // Initialize expanded state for all sections
                if (spec && spec.tags) {
                    const expanded = spec.tags.reduce((acc: any, tag: any) => {
                        acc[tag.name] = true;
                        return acc;
                    }, {});
                    setIsExpanded(expanded);
                }
            } catch (err: any) {
                setError(err.message);
            }
        }

        fetchSwaggerSpec();
    }, []);

    const toggleSection = (section: string) => {
        setIsExpanded(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const filterBySection = (section: string) => {
        setActiveSection(section);
    };

    // Error State
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center text-red-500 text-center text-lg p-8 border border-red-300 rounded-lg bg-red-50">
                    <AlertCircle className="mr-2" />
                    {error}
                </div>
            </div>
        );
    }

    // Loading State
    if (!spec || !isClient) {
        return (
            <div className="container h-screen flex justify-center items-center mx-auto p-4">
                <div className="flex flex-col justify-center items-center">
                    <Loader2 className="animate-spin h-10 w-10 text-pink-500" />
                    <p className="ml-2 text-gray-600">Loading API documentation...</p>
                </div>
            </div>
        );
    }

    // Main Content
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <a href="/" className="flex items-center mr-8">
                                <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-400 text-transparent bg-clip-text">03</span>
                                <span className="ml-2 text-xl font-bold text-gray-900">Amize</span>
                            </a>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                                <BookOpen className="mr-2 text-pink-500" />
                                API Documentation
                            </h1>
                        </div>
                        <a
                            href="/"
                            className="flex items-center text-gray-600 hover:text-pink-500 transition"
                        >
                            <ArrowLeft className="mr-1" />
                            Back to Home
                        </a>
                    </div>
                    <p className="text-gray-600 max-w-xl mt-2">
                        Comprehensive reference for the Amize API. Use these endpoints to implement authentication, user management, and personalization in your application.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-6 relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search endpoints..."
                            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            onChange={(e) => setSearchTerm(e.target.value)}
                            value={searchTerm}
                        />
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex overflow-x-auto pb-1 space-x-2">
                        <button
                            onClick={() => filterBySection('all')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap ${
                                activeSection === 'all'
                                    ? 'bg-pink-100 text-pink-800 font-medium'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Endpoints
                        </button>

                        <button
                            onClick={() => filterBySection('Authentication')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center ${
                                activeSection === 'Authentication'
                                    ? 'bg-pink-100 text-pink-800 font-medium'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Lock className="w-4 h-4 mr-1" /> Authentication
                        </button>

                        <button
                            onClick={() => filterBySection('Biometrics')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center ${
                                activeSection === 'Biometrics'
                                    ? 'bg-pink-100 text-pink-800 font-medium'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Fingerprint className="w-4 h-4 mr-1" /> Biometrics
                        </button>

                        <button
                            onClick={() => filterBySection('Users')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center ${
                                activeSection === 'Users'
                                    ? 'bg-pink-100 text-pink-800 font-medium'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <UserCircle className="w-4 h-4 mr-1" /> Users
                        </button>

                        <button
                            onClick={() => filterBySection('Security')}
                            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center ${
                                activeSection === 'Security'
                                    ? 'bg-pink-100 text-pink-800 font-medium'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Shield className="w-4 h-4 mr-1" /> Security
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Container */}
            <div className="container mx-auto p-4 md:p-8">
                {/* Introduction */}
                <div className="mb-8 bg-white shadow-sm rounded-lg p-6 border">
                    <h2 className="text-xl text-gray-800 font-semibold mb-3 flex items-center">
                        <HelpCircle className="mr-2 text-pink-500" />
                        Getting Started
                    </h2>
                    <p className="text-gray-600 mb-4">
                        This documentation provides all the information you need to integrate with the Amize API.
                        Every request requires an API key, which you can obtain from your developer dashboard.
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-700 mb-2">Base URL</h3>
                        <code className="block bg-gray-900 text-white p-3 rounded-md">
                            https://api.amize.com/api/v1
                        </code>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                            <div className="flex items-center text-pink-700 font-medium mb-2">
                                <Lock className="w-5 h-5 mr-2" /> Authentication
                            </div>
                            <p className="text-sm text-gray-600">Secure JWT-based authentication with biometric verification</p>
                        </div>

                        <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                            <div className="flex items-center text-rose-700 font-medium mb-2">
                                <Fingerprint className="w-5 h-5 mr-2" /> Biometrics
                            </div>
                            <p className="text-sm text-gray-600">Implement fingerprint and face ID authentication</p>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center text-red-700 font-medium mb-2">
                                <UserCircle className="w-5 h-5 mr-2" /> User Profiles
                            </div>
                            <p className="text-sm text-gray-600">Manage user data, preferences, and personalized experiences</p>
                        </div>
                    </div>
                </div>

                {/* API Reference Header */}
                <div className="mb-4">
                    <h2 className="text-2xl text-gray-800 font-bold flex items-center">
                        <Code className="mr-2 text-pink-500" />
                        API Reference
                    </h2>
                    <p className="text-gray-600">
                        Detailed information about all available endpoints, parameters, and responses.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow transition">
                        <div className="text-pink-500 mb-3">
                            <Lock className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Authentication</h3>
                        <p className="text-gray-600 mb-3">
                            JWT-based authentication, API keys, and session management
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• User login and registration</li>
                            <li>• JWT token generation and refresh</li>
                            <li>• OAuth integration</li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow transition">
                        <div className="text-pink-500 mb-3">
                            <Fingerprint className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Biometrics</h3>
                        <p className="text-gray-600 mb-3">
                            Secure biometric authentication flows
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Fingerprint authentication</li>
                            <li>• Face ID verification</li>
                            <li>• Multi-factor security</li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow transition">
                        <div className="text-pink-500 mb-3">
                            <UserCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">User Management</h3>
                        <p className="text-gray-600 mb-3">
                            Complete user profile and preferences APIs
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Profile data management</li>
                            <li>• Interest-based personalization</li>
                            <li>• User settings and configurations</li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow transition">
                        <div className="text-pink-500 mb-3">
                            <Shield className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Security</h3>
                        <p className="text-gray-600 mb-3">
                            Advanced security features for your app
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• PIN management</li>
                            <li>• Device history and management</li>
                            <li>• Rate limiting and protection</li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow transition">
                        <div className="text-pink-500 mb-3">
                            <Bell className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Notifications</h3>
                        <p className="text-gray-600 mb-3">
                            User notification and alert systems
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Push notification delivery</li>
                            <li>• In-app notifications</li>
                            <li>• Notification preferences</li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow transition">
                        <div className="text-pink-500 mb-3">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Social Features</h3>
                        <p className="text-gray-600 mb-3">
                            APIs for social connections and interactions
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Follow/connection systems</li>
                            <li>• Messaging and interactions</li>
                            <li>• Activity tracking</li>
                        </ul>
                    </div>
                </div>

                {/* Swagger UI Container with custom styling */}
                <div className="bg-white shadow-sm rounded-lg p-6 border swagger-wrapper">
                    {isClient && (
                        <SwaggerUI
                            spec={spec}
                            docExpansion="list"
                            filter={searchTerm !== ''}
                        />
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-400 text-transparent bg-clip-text">03</span>
                            <span className="ml-2 text-lg font-bold text-gray-900">Amize</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <a href="/" className="hover:text-pink-500 transition">Home</a>
                            <span>•</span>
                            <a href="/pricing" className="hover:text-pink-500 transition">Pricing</a>
                            <span>•</span>
                            <a href="/contact" className="hover:text-pink-500 transition">Contact</a>
                            <span>•</span>
                            <a href="/terms" className="hover:text-pink-500 transition">Terms</a>
                        </div>

                        <div className="flex items-center mt-4 md:mt-0 text-gray-500 text-sm">
                            <Heart className="h-4 w-4 text-pink-500 mr-2" />
                            Made for developers
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}