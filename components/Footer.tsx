import {Heart} from "lucide-react";
import React from "react";
import {motion} from "framer-motion";
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-16 border-t border-gray-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 to-transparent"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
                >
                    {[
                        {
                            title: "Platform",
                            links: ["Discover", "Trending", "Top Creators", "Live Streams"]
                        },
                        {
                            title: "Creators",
                            links: ["Creator Fund", "Analytics", "Monetization", "Resources"]
                        },
                        {
                            title: "Company",
                            links: ["About Us", "Careers", "Press", "Contact"]
                        },
                        {
                            title: "Support",
                            links: ["Help Center", "Safety", "Privacy", "Terms"]
                        }
                    ].map((section, sectionIndex) => (
                        <motion.div
                            key={sectionIndex}
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: sectionIndex * 0.1, duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="text-lg font-semibold mb-6 text-pink-300">{section.title}</h3>
                            <ul className="space-y-3">
                                {section.links.map((link, linkIndex) => (
                                    <motion.li key={linkIndex}>
                                        <motion.a
                                            href={`/${link.toLowerCase().replace(' ', '-')}`}
                                            whileHover={{ x: 5 }}
                                            className="text-gray-400 hover:text-pink-400 transition-all duration-200 cursor-pointer"
                                        >
                                            {link}
                                        </motion.a>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="pt-8 border-t border-gray-800"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center mb-4 md:mb-0"
                        >
                            <div
                                className="h-12 w-12 bg-gradient-to-br from-pink-500 to-red-400 rounded-xl flex items-center justify-center">
                                <img src="/amize.png" alt="Amize Logo"/>
                            </div>
                        </motion.div>

                        <div className="flex space-x-6">
                            {["twitter", "instagram", "tiktok"].map((social, index) => (
                                <motion.a
                                    key={social}
                                    href={`https://${social}.com/amizeapp`}
                                    initial={{ scale: 0, rotate: 180 }}
                                    whileInView={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                                    whileHover={{
                                        scale: 1.2,
                                        rotate: 15,
                                        transition: { duration: 0.2 }
                                    }}
                                    viewport={{ once: true }}
                                    className="w-12 h-12 bg-gray-800/70 hover:bg-gradient-to-br hover:from-pink-500 hover:to-red-400 rounded-xl flex items-center justify-center transition-all duration-300 group"
                                >
                                    <Image src={`/images/${social}.png`} alt={`${social} icon`} width={40} height={40} className="group-hover:scale-110 rounded-full transition-transform duration-200" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        viewport={{ once: true }}
                        className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"
                    >
                        <div>
                            &copy; {new Date().getFullYear()} Amize, Inc. All rights reserved.
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="mt-4 md:mt-0 flex items-center"
                        >
                            <Heart className="h-4 w-4 text-pink-500 mr-2 animate-pulse" />
                            Made for creators worldwide
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </footer>
    )
}

export default Footer