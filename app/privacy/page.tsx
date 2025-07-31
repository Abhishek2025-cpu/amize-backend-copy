'use client'
import React from 'react';
import {
    ArrowLeft,
    Shield,
    Eye,
    Users,
    Lock,
    Globe,
    Cookie,
    Trash2,
    Settings,
    Mail,
    Database,
    FileBox
} from 'lucide-react';
import Image from "next/image";

const PrivacyPolicy = () => {
    const sections = [
        {
            id: 'information-collection',
            title: '1. Information We Collect',
            icon: Database,
            content: [
                'Account Information: Name, username, email address, phone number, date of birth, and profile information.',
                'Content: Videos, photos, comments, messages, and other content you create or share on our platform.',
                'Usage Data: How you interact with our service, including videos watched, search queries, and engagement metrics.',
                'Device Information: Device type, operating system, browser type, IP address, and mobile device identifiers.',
                'Location Data: Approximate location based on IP address and precise location if you grant permission.',
                'Communication Data: Messages you send through our platform and customer support interactions.'
            ]
        },
        {
            id: 'information-use',
            title: '2. How We Use Your Information',
            icon: Settings,
            content: [
                'Provide and improve our services and develop new features.',
                'Personalize your experience and show you relevant content and advertisements.',
                'Communicate with you about our services, updates, and promotional offers.',
                'Ensure safety and security, including detecting and preventing fraud and abuse.',
                'Comply with legal obligations and enforce our Terms of Service.',
                'Conduct research and analytics to understand how our service is used.',
                'Process payments and manage creator monetization programs.'
            ]
        },
        {
            id: 'information-sharing',
            title: '3. Information Sharing and Disclosure',
            icon: Users,
            content: [
                'Public Content: Your profile information and public content are visible to other users.',
                'Service Providers: We share information with third-party vendors who help us operate our service.',
                'Business Partners: We may share information with partners for joint services or promotions.',
                'Legal Requirements: We may disclose information when required by law or to protect our rights.',
                'Business Transfers: Information may be transferred if we undergo a merger, acquisition, or sale.',
                'With Your Consent: We may share information for other purposes with your explicit consent.',
                'Analytics: We share aggregated, non-identifying information with analytics providers.'
            ]
        },
        {
            id: 'data-security',
            title: '4. Data Security',
            icon: Lock,
            content: [
                'We implement appropriate technical and organizational measures to protect your personal information.',
                'Data is encrypted in transit and at rest using industry-standard encryption protocols.',
                'Access to personal information is restricted to authorized personnel only.',
                'We regularly review and update our security practices and technologies.',
                'We conduct security audits and vulnerability assessments.',
                'In the event of a data breach, we will notify affected users as required by law.',
                'However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.'
            ]
        },
        {
            id: 'user-rights',
            title: '5. Your Rights and Choices',
            icon: Shield,
            content: [
                'Access: You can request access to the personal information we have about you.',
                'Correction: You can update or correct your personal information through your account settings.',
                'Deletion: You can request deletion of your personal information, subject to certain exceptions.',
                'Portability: You can request a copy of your personal information in a portable format.',
                'Objection: You can object to certain processing of your personal information.',
                'Restriction: You can request that we restrict the processing of your personal information.',
                'Withdraw Consent: You can withdraw consent for processing based on consent at any time.'
            ]
        },
        {
            id: 'cookies-tracking',
            title: '6. Cookies and Tracking Technologies',
            icon: Cookie,
            content: [
                'Essential Cookies: Required for the basic functionality of our service.',
                'Analytics Cookies: Help us understand how users interact with our platform.',
                'Advertising Cookies: Used to show you relevant advertisements.',
                'Social Media Cookies: Enable sharing and social media features.',
                'Preference Cookies: Remember your settings and preferences.',
                'You can control cookies through your browser settings, but this may affect functionality.',
                'We also use pixels, web beacons, and similar tracking technologies.'
            ]
        },
        {
            id: 'childrens-privacy',
            title: '7. Children\'s Privacy',
            icon: Users,
            content: [
                'Our service is not intended for children under 13 years of age.',
                'We do not knowingly collect personal information from children under 13.',
                'If we learn that we have collected information from a child under 13, we will delete it promptly.',
                'Parents or guardians can contact us to review, update, or delete their child\'s information.',
                'For users between 13-17, we provide additional privacy protections.',
                'We comply with applicable children\'s privacy laws, including COPPA.',
                'If you believe we have collected information from a child under 13, please contact us immediately.'
            ]
        },
        {
            id: 'international-transfers',
            title: '8. International Data Transfers',
            icon: Globe,
            content: [
                'Your information may be transferred to and processed in countries other than your own.',
                'We ensure appropriate safeguards are in place for international transfers.',
                'We comply with applicable data protection laws for cross-border transfers.',
                'For EU users, we ensure adequate protection through standard contractual clauses or adequacy decisions.',
                'We may transfer data to countries with different privacy laws than your own.',
                'By using our service, you consent to the transfer of your information as described.',
                'We will notify you of any significant changes to our international transfer practices.'
            ]
        },
        {
            id: 'data-retention',
            title: '9. Data Retention',
            icon: Trash2,
            content: [
                'We retain your information for as long as necessary to provide our services.',
                'Account information is retained until you delete your account.',
                'Content may be retained even after account deletion for legal and safety reasons.',
                'Usage data is typically retained for analytics purposes for a limited period.',
                'We may retain certain information longer if required by law.',
                'You can request deletion of specific information through your account settings.',
                'Some information may be retained in backup systems for a limited time after deletion.'
            ]
        },
        {
            id: 'third-party-services',
            title: '10. Third-Party Services',
            icon: Globe,
            content: [
                'Our service may contain links to third-party websites and services.',
                'We are not responsible for the privacy practices of third-party services.',
                'We encourage you to review the privacy policies of any third-party services you use.',
                'Social media integrations are governed by the respective platform\'s privacy policies.',
                'Third-party analytics providers may collect information about your usage.',
                'Advertising partners may use cookies and similar technologies.',
                'Payment processors have their own privacy policies for financial transactions.'
            ]
        },
        {
            id: 'policy-changes',
            title: '11. Changes to This Privacy Policy',
            icon: Eye,
            content: [
                'We may update this Privacy Policy from time to time.',
                'We will notify you of any material changes through our service or by email.',
                'Changes will be effective immediately upon posting unless otherwise specified.',
                'Your continued use of our service after changes constitutes acceptance.',
                'We encourage you to review this policy periodically.',
                'The date of the last update will always be displayed at the top of this policy.',
                'For significant changes, we may provide additional notice or seek your consent.'
            ]
        },
        {
            id: 'contact-us',
            title: '12. Contact Us',
            icon: Mail,
            content: `If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@amize.com or through our in-app support channels. We are committed to addressing your privacy concerns promptly and thoroughly.`
        }
    ];

    const dataTypes = [
        {
            name: 'Account Data',
            description: 'Profile information and settings',
            color: 'from-blue-500 to-blue-600',
            icon: <Users className="w-6 h-6 text-blue-50"/>
        },
        {
            name: 'Content Data',
            description: 'Videos, photos, and messages',
            color: 'from-purple-500 to-purple-600',
            icon: <FileBox className="w-6 h-6 text-purple-50"/>
        },
        {
            name: 'Usage Data',
            description: 'App interactions and preferences',
            color: 'from-pink-500 to-pink-600',
            icon: <Settings className="w-6 h-6 text-pink-50"/>
        },
        {
            name: 'Device Data',
            description: 'Technical device information',
            color: 'from-green-500 to-green-600',
            icon: <Lock className="w-6 h-6 text-green-50"/>
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-8 -left-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
                <div
                    className="absolute -bottom-8 -right-8 w-64 h-64 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"
                    style={{animationDelay: '2s'}}></div>
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"
                    style={{animationDelay: '4s'}}></div>
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
                                <ArrowLeft className="h-5 w-5 text-white"/>
                            </button>
                            <div className="flex items-center">
                                <div
                                    className="h-8 w-8 mr-3 bg-gradient-to-br from-pink-500 to-red-400 rounded-lg flex items-center justify-center">
                                    <Image src="/amize.png" width={40} height={40} alt="Amize Logo"/>
                                </div>
                                <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Introduction */}
                    <div className="mb-12 text-center">
                        <div
                            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl mb-6">
                            <Shield className="w-10 h-10 text-pink-500"/>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Your Privacy Matters</h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                            At Amize, we're committed to protecting your privacy and being transparent about how we
                            collect, use, and share your information. This policy explains our privacy practices in
                            detail.
                        </p>
                        <p className="text-gray-400 text-sm mt-4">
                            Last updated: {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                        </p>
                    </div>

                    {/* Data Types Overview */}
                    <div className="mb-16">
                        <h3 className="text-2xl font-bold text-white mb-8 text-center">Types of Data We Collect</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {dataTypes.map((type, index) => (
                                <div
                                    key={type.name}
                                    className="group relative"
                                    style={{
                                        animation: `fadeInUp 0.6s ease-out forwards`,
                                        animationDelay: `${index * 0.1}s`,
                                        opacity: 0
                                    }}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r ${type.color} rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-lg`}></div>
                                    <div
                                        className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 group-hover:border-pink-500/30 transition-all duration-300 text-center">
                                        <div
                                            className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${type.color} bg-opacity-20 rounded-xl mb-4`}>
                                            {type.icon}
                                        </div>
                                        <h4 className="font-bold text-white mb-2">{type.name}</h4>
                                        <p className="text-gray-400 text-sm">{type.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Privacy Sections */}
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
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                                <div
                                    className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 group-hover:border-pink-500/30 transition-all duration-300">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div
                                                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl">
                                                <section.icon className="w-6 h-6 text-pink-50"/>
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
                                                                <div
                                                                    className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
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

                    {/* Quick Actions */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                            <div
                                className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl mb-4">
                                <Settings className="w-6 h-6 text-blue-500"/>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Manage Your Data</h3>
                            <p className="text-gray-300 text-sm mb-4">
                                Access, update, or delete your personal information through your account settings.
                            </p>
                            <button
                                className="w-full bg-blue-500/20 text-blue-400 py-2 rounded-lg font-medium hover:bg-blue-500/30 transition-all duration-200">
                                Go to Settings
                            </button>
                        </div>

                        <div
                            className="bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/20 rounded-2xl p-6">
                            <div
                                className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-xl mb-4">
                                <Mail className="w-6 h-6 text-pink-500"/>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Privacy Questions?</h3>
                            <p className="text-gray-300 text-sm mb-4">
                                Contact our privacy team for any questions about your data or this policy.
                            </p>
                            <a
                                href="mailto:privacy@amize.com"
                                className="block w-full bg-pink-500/20 text-pink-400 py-2 rounded-lg font-medium hover:bg-pink-500/30 transition-all duration-200 text-center"
                            >
                                Contact Privacy Team
                            </a>
                        </div>
                    </div>

                    {/* Trust Message */}
                    <div className="mt-12 text-center">
                        <div
                            className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-8">
                            <div
                                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl mb-4">
                                <Shield className="w-8 h-8 text-pink-500"/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Your Trust is Our Priority</h3>
                            <p className="text-gray-300 max-w-md mx-auto">
                                We're committed to earning and maintaining your trust through transparent privacy
                                practices and strong data protection measures.
                            </p>
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

export default PrivacyPolicy;