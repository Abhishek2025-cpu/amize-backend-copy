'use client'
import React from 'react';
import { ArrowLeft, Shield, Users, AlertCircle, FileText, Mail } from 'lucide-react';
import Image from "next/image";

const TermsOfService = () => {
    const sections = [
        {
            id: 'acceptance',
            title: '1. Acceptance of Terms',
            icon: Shield,
            content: `By accessing and using Amize, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
        },
        {
            id: 'description',
            title: '2. Description of Service',
            icon: FileText,
            content: `Amize is a social media platform that allows users to create, share, and discover short-form videos, live stream content, and connect with other creators worldwide. Our platform provides editing tools, music libraries, AI effects, and community features to enhance your creative experience.`
        },
        {
            id: 'user-accounts',
            title: '3. User Accounts and Responsibilities',
            icon: Users,
            content: [
                'You must be at least 13 years old to create an account on Amize.',
                'You are responsible for maintaining the confidentiality of your account and password.',
                'You agree to accept responsibility for all activities that occur under your account.',
                'You must provide accurate and complete information when creating your account.',
                'You may not create multiple accounts or impersonate others.'
            ]
        },
        {
            id: 'prohibited-uses',
            title: '4. Prohibited Uses',
            icon: AlertCircle,
            content: [
                'You may not use our service for any unlawful purpose or to solicit others to perform illegal acts.',
                'You may not post content that is defamatory, obscene, abusive, offensive, or that violates intellectual property rights.',
                'You may not transmit any worms, viruses, or any code of a destructive nature.',
                'You may not harass, threaten, or intimidate other users.',
                'You may not spam or send unsolicited communications to other users.',
                'You may not engage in any activity that interferes with or disrupts the service.'
            ]
        },
        {
            id: 'content-rights',
            title: '5. Content Ownership and Licensing',
            icon: FileText,
            content: [
                'You retain ownership of content you create and upload to Amize.',
                'By uploading content, you grant Amize a worldwide, non-exclusive, royalty-free license to use, distribute, modify, run, copy, publicly display or perform, translate, and create derivative works of your content.',
                'You represent and warrant that you own or have the necessary licenses to all content you upload.',
                'Amize reserves the right to remove any content that violates these terms or applicable laws.',
                'You may not upload content that infringes on the intellectual property rights of others.'
            ]
        },
        {
            id: 'privacy',
            title: '6. Privacy',
            icon: Shield,
            content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices regarding your personal information and how we will treat it.`
        },
        {
            id: 'disclaimers',
            title: '7. Disclaimers',
            icon: AlertCircle,
            content: [
                'The information on this platform is provided on an "as is" basis.',
                'To the fullest extent permitted by law, Amize excludes all representations, warranties, and conditions relating to our platform and the use of this platform.',
                'Amize does not guarantee the accuracy, completeness, or usefulness of any information on the platform.',
                'We do not warrant that the service will be uninterrupted or error-free.'
            ]
        },
        {
            id: 'limitation',
            title: '8. Limitation of Liability',
            icon: Shield,
            content: `In no event shall Amize, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, punitive, special, or consequential damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.`
        },
        {
            id: 'termination',
            title: '9. Termination',
            icon: AlertCircle,
            content: [
                'We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.',
                'You may terminate your account at any time by contacting us.',
                'Upon termination, your right to use the service will cease immediately.',
                'All provisions which by their nature should survive termination shall survive.'
            ]
        },
        {
            id: 'changes',
            title: '10. Changes to Terms',
            icon: FileText,
            content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.`
        },
        {
            id: 'governing-law',
            title: '11. Governing Law',
            icon: Shield,
            content: `These Terms shall be interpreted and governed by the laws of the jurisdiction in which Amize operates, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`
        },
        {
            id: 'contact',
            title: '12. Contact Information',
            icon: Mail,
            content: `If you have any questions about these Terms of Service, please contact us at legal@amize.com or through our support channels within the app.`
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800/50 z-20">
                    <div className="max-w-4xl mx-auto px-6 py-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => window.history.back()}
                                className="mr-4 p-2 bg-gray-800/70 rounded-full hover:bg-gray-700 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-white" />
                            </button>
                            <div className="flex items-center">
                                <div
                                    className="h-8 w-8 mr-3 bg-gradient-to-br from-pink-500 to-red-400 rounded-lg flex items-center justify-center">
                                    <Image src="/amize.png" width={40} height={40} alt="Amize Logo"/>
                                </div>
                                <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Introduction */}
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl mb-6">
                            <FileText className="w-10 h-10 text-pink-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Amize Terms of Service</h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                            Welcome to Amize! These terms and conditions outline the rules and regulations for the use of our platform. By using Amize, you agree to these terms in full.
                        </p>
                        <p className="text-gray-400 text-sm mt-4">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Terms Sections */}
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className="group relative"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out forwards`,
                                    animationDelay: `${index * 0.1}s`,
                                    opacity: 0
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                                <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 group-hover:border-pink-500/30 transition-all duration-300">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl">
                                                <section.icon className="w-6 h-6 text-pink-50" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-pink-300 transition-colors">
                                                {section.title}
                                            </h3>
                                            <div className="text-gray-300 leading-relaxed">
                                                {Array.isArray(section.content) ? (
                                                    <ul className="space-y-3">
                                                        {section.content.map((item, itemIndex) => (
                                                            <li key={itemIndex} className="flex items-start">
                                                                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>{section.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Section */}
                    <div className="mt-16 text-center">
                        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl mb-4">
                                <Mail className="w-8 h-8 text-pink-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Questions About These Terms?</h3>
                            <p className="text-gray-300 mb-6 max-w-md mx-auto">
                                If you have any questions about these Terms of Service, please don't hesitate to contact our legal team.
                            </p>
                            <a
                                href="mailto:legal@amize.com"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-red-400 text-white rounded-xl font-medium hover:from-pink-600 hover:to-red-500 transition-all duration-200 shadow-lg"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Contact Legal Team
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default TermsOfService;