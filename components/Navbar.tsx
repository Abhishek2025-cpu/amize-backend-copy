'use client'
import React, {useState} from "react";
import {motion} from "framer-motion";
import Image from "next/image";

const Navbar = () => {
    const [activeTab, setActiveTab] = useState("discover");
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    return (
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
                            <div
                                className="h-8 w-8 bg-gradient-to-br from-pink-500 to-red-400 rounded-lg flex items-center justify-center">
                                <Image src="/amize.png" width={40} height={40} alt="Amize Logo"/>
                            </div>
                        </a>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:flex items-center space-x-1"
                    >
                        {["Features", "For Creators", "Discover"].map((item, index) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800/50"
                            >
                                {item}
                            </motion.a>
                        ))}
                        <motion.a
                            href="/auth/welcome"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800/50"
                        >
                            Login
                        </motion.a>
                        <motion.a
                            href="/auth/register"
                            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(236, 72, 153, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-pink-500 to-red-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg"
                        >
                            Join Amize
                        </motion.a>
                    </motion.div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus:outline-none transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800"
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {["Features", "For Creators", "Discover", "Login"].map((item, index) => (
                            <motion.a
                                key={item}
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                            >
                                {item}
                            </motion.a>
                        ))}
                        <motion.a
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            href="/auth/register"
                            className="bg-gradient-to-r from-pink-500 to-red-400 text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
                        >
                            Join Amize
                        </motion.a>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    )
}

export default Navbar