'use client'

import React, { useState } from 'react';
import {
    Mail,
    MessageSquare,
    Phone,
    MapPin,
    Send,
    UserX,
    HelpCircle,
    Bug,
    Star,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const contactCategories = [
        { value: 'general', label: 'General Inquiry', icon: MessageSquare },
        { value: 'technical', label: 'Technical Support', icon: HelpCircle },
        { value: 'bug', label: 'Bug Report', icon: Bug },
        { value: 'deletion', label: 'Account/Profile Deletion', icon: UserX },
        { value: 'feedback', label: 'Feedback & Suggestions', icon: Star },
        { value: 'other', label: 'Other', icon: Mail }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.subject || !formData.category || !formData.message) {
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setSubmitStatus('success');
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    category: '',
                    message: ''
                });
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Navigation */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="fixed w-full top-0 bg-gray-900 backdrop-blur-lg z-50 border-b border-gray-800/50"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center"
                        >
                            <a href="/" className="flex items-center group">
                                <div className="h-8 w-8 bg-gradient-to-br from-pink-500 to-red-400 rounded-lg flex items-center justify-center">
                                    <Image src="/amize.png" width={40} height={40} alt="Amize Logo"/>
                                </div>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center space-x-4"
                        >
                            <a
                                href="/"
                                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800/50"
                            >
                                Back to Home
                            </a>
                        </motion.div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                            Get in{' '}
                            <span className="bg-gradient-to-r from-pink-500 to-red-400 bg-clip-text text-transparent">
                                Touch
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Have questions, feedback, or need help? We're here to support you every step of the way.
                        </p>
                    </motion.div>

                    {/* Contact Methods */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
                    >
                        {[
                            {
                                icon: Mail,
                                title: "Email Support",
                                description: "Get help within 24 hours",
                                value: "amize2026@gmail.com",
                                color: "from-pink-500 to-red-400"
                            },
                            {
                                icon: MessageSquare,
                                title: "Live Chat",
                                description: "Real-time assistance",
                                value: "Not available yet",
                                color: "from-purple-500 to-pink-400"
                            },
                            {
                                icon: HelpCircle,
                                title: "Help Center",
                                description: "Find answers instantly",
                                value: "Browse FAQs & Guides",
                                color: "from-blue-500 to-purple-400"
                            }
                        ].map((method, index) => (
                            <motion.div
                                key={index}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                                whileHover={{ y: -10 }}
                                className="group relative"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${method.color} rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-xl`}></div>
                                <div className="relative bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800/50 group-hover:border-pink-500/30 transition-all duration-300 text-center">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                        className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r ${method.color} bg-opacity-20 text-pink-500 mb-6`}
                                    >
                                        <method.icon className="h-8 w-8 text-white" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-2">{method.title}</h3>
                                    <p className="text-gray-400 mb-2">{method.description}</p>
                                    <p className="text-pink-400 font-medium">{method.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-16 bg-gray-900/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Form */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-8">Send us a Message</h2>

                            {submitStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center"
                                >
                                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                                    <span className="text-green-300">Your message has been sent successfully! We'll get back to you soon.</span>
                                </motion.div>
                            )}

                            {submitStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center"
                                >
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                                    <span className="text-red-300">Something went wrong. Please try again or email us directly.</span>
                                </motion.div>
                            )}

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all duration-200"
                                    >
                                        <option value="">Select a category</option>
                                        {contactCategories.map((category) => (
                                            <option key={category.value} value={category.value}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                                        placeholder="Brief description of your inquiry"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 resize-none"
                                        placeholder="Please provide as much detail as possible..."
                                    />
                                </div>

                                <motion.button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleSubmit}
                                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                    className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="loading loading-spinner text-white mr-2"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                            <Send className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Quick Actions & Info */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
                                <div className="space-y-4">
                                    {contactCategories.map((category, index) => (
                                        <motion.div
                                            key={category.value}
                                            initial={{ x: 20, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.1, duration: 0.4 }}
                                            viewport={{ once: true }}
                                            whileHover={{ x: 10 }}
                                            className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-pink-500/30 transition-all duration-200 cursor-pointer"
                                            onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                                        >
                                            <category.icon className="h-6 w-6 text-pink-400 mr-4" />
                                            <span className="text-white font-medium">{category.label}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Profile Deletion Notice */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                viewport={{ once: true }}
                                className="bg-gray-800/80 border border-gray-700/50 rounded-2xl p-6"
                            >
                                <div className="flex items-center mb-4">
                                    <UserX className="h-6 w-6 text-red-400 mr-3" />
                                    <h4 className="text-lg font-semibold text-white">Account Deletion</h4>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                    Need to delete your account or profile? We understand privacy is important.
                                    Contact us and we'll help you remove your data safely and securely.
                                </p>
                                <div className="text-xs text-gray-400">
                                    <p className="mb-1">• Account deletion is permanent and irreversible</p>
                                    <p className="mb-1">• All your videos and data will be removed</p>
                                    <p>• Process typically takes 24-48 hours</p>
                                </div>
                            </motion.div>

                            {/* Response Time */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-6"
                            >
                                <h4 className="text-lg font-semibold text-white mb-3">Response Times</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">General Inquiries:</span>
                                        <span className="text-pink-400 font-medium">24 hours</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Technical Support:</span>
                                        <span className="text-pink-400 font-medium">12 hours</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Account Issues:</span>
                                        <span className="text-pink-400 font-medium">6 hours</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16 border-t border-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-red-400 rounded-xl flex items-center justify-center mr-4">
                                <Image src="/amize.png" width={48} height={48} alt="Amize Logo"/>
                            </div>
                            <span className="text-2xl font-bold">Amize</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            © {new Date().getFullYear()} Amize, Inc. All rights reserved.
                        </p>
                        <div className="flex justify-center space-x-6 text-sm">
                            <a href="/privacy" className="text-gray-400 hover:text-pink-400 transition-colors">Privacy</a>
                            <a href="/terms" className="text-gray-400 hover:text-pink-400 transition-colors">Terms</a>
                            <a href="/help" className="text-gray-400 hover:text-pink-400 transition-colors">Help</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ContactPage;