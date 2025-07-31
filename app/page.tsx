'use client'
import React, {useState, useEffect} from 'react';
import {
    Play,
    Users,
    Camera,
    Music,
    TrendingUp,
    Crown,
    Download,
    Star,
    Globe,
    Video,
    Zap,
    WandSparkles,
    Gem,
    ArrowRight, Airplay,
} from 'lucide-react';
import {motion} from 'framer-motion';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AnimatedCounter = ({end, duration = 2000}: { end: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        const timer = setTimeout(() => {
            requestAnimationFrame(animate);
        }, 500);

        return () => clearTimeout(timer);
    }, [end, duration]);

    return <span>{count}</span>;
};

const Home = () => {
    const [activeTab, setActiveTab] = useState("discover");
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: Airplay,
            title: "Short-Form Videos",
            description: "Create captivating 15-60 second videos with our intuitive editing tools and effects.",
            delay: 0
        },
        {
            icon: Music,
            title: "Music Library",
            description: "Access millions of songs and sounds to make your videos more engaging and viral.",
            delay: 0.1
        },
        {
            icon: WandSparkles,
            title: "AI Effects",
            description: "Transform your videos with cutting-edge AI filters, beauty effects, and animations.",
            delay: 0.2
        },
        {
            icon: Zap,
            title: "Live Streaming",
            description: "Connect with your audience in real-time through high-quality live streaming.",
            delay: 0.3
        },
        {
            icon: Users,
            title: "Community",
            description: "Follow creators, interact through comments, and build meaningful connections.",
            delay: 0.4
        },
        {
            icon: Gem,
            title: "Creator Rewards",
            description: "Monetize your content and earn rewards for creating engaging videos.",
            delay: 0.5
        }
    ];

    const creatorSteps = [
        {
            number: 1,
            icon: Camera,
            title: "Create",
            description: "Use our advanced editing tools to create stunning videos that captivate your audience.",
            color: "from-pink-500 to-red-400"
        },
        {
            number: 2,
            icon: TrendingUp,
            title: "Grow",
            description: "Reach millions of viewers with our powerful discovery algorithm and trending features.",
            color: "from-purple-500 to-pink-400"
        },
        {
            number: 3,
            icon: Crown,
            title: "Earn",
            description: "Monetize your content through subscriptions, tips, and brand partnerships.",
            color: "from-blue-500 to-purple-400"
        }
    ];

    return (
        <div className="min-h-screen font-sans bg-gray-950 text-gray-100 overflow-x-hidden">
            {/* Navigation */}
            <Navbar/>

            {/* Hero Section */}
            <section
                className="relative pt-32 pb-24 min-h-screen bg-gradient-to-br via-gray-900 to-gray-950 overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div
                        className="absolute top-20 left-20 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div
                        className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                        style={{animationDelay: '1s'}}></div>
                    <div
                        className="absolute bottom-20 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
                        style={{animationDelay: '2s'}}></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
                        <motion.div
                            initial={{x: -100, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{duration: 0.8}}
                            className="space-y-8"
                        >
                            <motion.div
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.2, duration: 0.6}}
                            >
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
                                    Create, Share &{' '}
                                    <span
                                        className="bg-gradient-to-r from-pink-500 to-red-400 bg-clip-text text-transparent">
                                        Discover
                                    </span>
                                </h1>
                            </motion.div>

                            <motion.p
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.4, duration: 0.6}}
                                className="text-xl text-gray-300 max-w-xl leading-relaxed"
                            >
                                Join creators on Amize - the ultimate platform for short-form videos, live
                                streaming, and connecting with your audience worldwide.
                            </motion.p>

                            <motion.div
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.6, duration: 0.6}}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <motion.a
                                    href="/auth/register"
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: "0 20px 25px -5px rgba(236, 72, 153, 0.4), 0 10px 10px -5px rgba(236, 72, 153, 0.3)"
                                    }}
                                    whileTap={{scale: 0.95}}
                                    className="group flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-400 text-white rounded-xl font-medium text-lg shadow-lg transition-all duration-200"
                                >
                                    Start Creating
                                    <Camera className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform"/>
                                </motion.a>

                                <motion.a
                                    href="/discover"
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    className="group flex items-center justify-center px-8 py-4 border-2 border-gray-700 text-gray-200 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 rounded-xl font-medium text-lg transition-all duration-200"
                                >
                                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform"/>
                                    Watch Now
                                </motion.a>
                            </motion.div>

                            <motion.div
                                initial={{y: 20, opacity: 0}}
                                animate={{y: 0, opacity: 1}}
                                transition={{delay: 0.8, duration: 0.6}}
                                className="flex flex-wrap items-center gap-6 text-gray-400 text-sm"
                            >
                                {[
                                    {icon: Users, text: "10M+ Users", color: "text-pink-500"},
                                    {icon: Video, text: "100M+ Videos", color: "text-purple-500"},
                                    {icon: Globe, text: "Worldwide", color: "text-blue-500"}
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{delay: 1 + index * 0.1, type: "spring"}}
                                        className="flex items-center"
                                    >
                                        <item.icon className={`h-4 w-4 mr-2 ${item.color}`}/>
                                        {item.text}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{x: 100, opacity: 0, rotateY: 20}}
                            animate={{x: 0, opacity: 1, rotateY: 0}}
                            transition={{duration: 1, delay: 0.4}}
                            className="relative flex justify-center"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        y: [0, -20, 0],
                                        rotateY: [0, 5, 0]
                                    }}
                                    transition={{
                                        duration: 6,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="relative z-10"
                                >
                                    <div
                                        className="w-[300px] h-[630px] bg-gradient-to-b from-gray-300 to-gray-50 rounded-[3rem] p-2 shadow-2xl">
                                        <div
                                            className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
                                            <img
                                                src="/images/Simulator Screenshot - iPhone 16 - 2025-06-14 at 09.28.36.png"
                                                alt="Hero Video Thumbnail"
                                                className="w-full h-full object-cover rounded-[2.5rem]"
                                            />
                                            <div
                                                className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[2.5rem]">
                                                <Play className="w-12 h-12 text-white"/>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Floating elements */}
                                <motion.div
                                    animate={{
                                        y: [0, -15, 0],
                                        x: [0, 10, 0]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 1
                                    }}
                                    className="absolute -top-8 -left-10 w-16 h-16 bg-gradient-to-br from-pink-500 to-red-400 rounded-2xl flex items-center justify-center shadow-lg"
                                >
                                    <Camera className="w-8 h-8 text-white"/>
                                </motion.div>

                                <motion.div
                                    animate={{
                                        y: [0, 15, 0],
                                        x: [0, -10, 0]
                                    }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: 2
                                    }}
                                    className="absolute -bottom-8 -right-8 w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-400 rounded-3xl flex items-center justify-center shadow-lg"
                                >
                                    <Play className="w-10 h-10 text-white"/>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gray-900/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <motion.div
                        initial={{y: 50, opacity: 0}}
                        whileInView={{y: 0, opacity: 1}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    >
                        {[
                            {value: 10, suffix: "M+", label: "Active Users", color: "from-pink-500 to-red-400"},
                            {value: 100, suffix: "M+", label: "Videos Created", color: "from-purple-500 to-pink-400"},
                            {value: 1, suffix: "B+", label: "Video Views", color: "from-blue-500 to-purple-400"},
                            {value: 190, suffix: "+", label: "Countries", color: "from-green-500 to-blue-400"}
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{scale: 0, rotateY: 180}}
                                whileInView={{scale: 1, rotateY: 0}}
                                transition={{
                                    delay: index * 0.1,
                                    duration: 0.6,
                                    type: "spring"
                                }}
                                viewport={{once: true}}
                                className="text-center group"
                            >
                                <motion.div
                                    whileHover={{scale: 1.1}}
                                    className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                                >
                                    <AnimatedCounter end={stat.value}/>{stat.suffix}
                                </motion.div>
                                <div className="text-gray-400 text-sm mt-2 group-hover:text-gray-300 transition-colors">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-gray-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <motion.div
                        initial={{y: 50, opacity: 0}}
                        whileInView={{y: 0, opacity: 1}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Everything You Need to{' '}
                            <span className="bg-gradient-to-r from-pink-500 to-red-400 bg-clip-text text-transparent">
                                Create
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Powerful tools and features to help you create, share, and grow your audience
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{y: 50, opacity: 0}}
                                whileInView={{y: 0, opacity: 1}}
                                transition={{delay: feature.delay, duration: 0.6}}
                                viewport={{once: true}}
                                whileHover={{
                                    y: -10,
                                    transition: {duration: 0.2}
                                }}
                                className="group relative"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                                <div
                                    className="relative bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800/50 group-hover:border-pink-500/30 transition-all duration-300 shadow-lg">
                                    <motion.div
                                        whileHover={{rotate: 10, scale: 1.1}}
                                        transition={{duration: 0.3}}
                                        className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-500 mb-6 group-hover:shadow-lg"
                                    >
                                        <feature.icon className="h-8 w-8 text-white/80"/>
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-pink-300 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Creator Section */}
            <section id="creators" className="py-32 bg-gray-900 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5"></div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <motion.div
                        initial={{y: 50, opacity: 0}}
                        whileInView={{y: 0, opacity: 1}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Built for{' '}
                            <span className="bg-gradient-to-r from-pink-500 to-red-400 bg-clip-text text-transparent">
                                Creators
                            </span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Turn your passion into profit with powerful creator tools
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {creatorSteps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{y: 100, opacity: 0, scale: 0.8}}
                                whileInView={{y: 0, opacity: 1, scale: 1}}
                                transition={{
                                    delay: index * 0.2,
                                    duration: 0.8,
                                    type: "spring",
                                    bounce: 0.4
                                }}
                                viewport={{once: true}}
                                whileHover={{
                                    y: -15,
                                    transition: {duration: 0.3}
                                }}
                                className="relative group"
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-xl`}></div>
                                <div
                                    className="relative bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-700/50 group-hover:border-pink-500/30 transition-all duration-300 shadow-xl">
                                    {/* Step number */}
                                    <motion.div
                                        whileHover={{scale: 1.2, rotate: 360}}
                                        transition={{duration: 0.5}}
                                        className={`absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r ${step.color} text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg`}
                                    >
                                        {step.number}
                                    </motion.div>

                                    <motion.div
                                        whileHover={{scale: 1.1, rotateY: 180}}
                                        transition={{duration: 0.6}}
                                        className={`flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-r ${step.color} bg-opacity-20 text-pink-500 mb-6 mx-auto`}
                                    >
                                        <step.icon className="h-10 text-white w-10"/>
                                    </motion.div>

                                    <h3 className="text-2xl font-bold text-center mb-4 text-white group-hover:text-pink-300 transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-400 text-center leading-relaxed group-hover:text-gray-300 transition-colors">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Call to action */}
                    <motion.div
                        initial={{y: 50, opacity: 0}}
                        whileInView={{y: 0, opacity: 1}}
                        transition={{delay: 0.8, duration: 0.6}}
                        viewport={{once: true}}
                        className="text-center mt-16"
                    >
                        <motion.a
                            href="/auth/register"
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.4)"
                            }}
                            whileTap={{scale: 0.95}}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-400 text-white rounded-xl font-semibold text-lg shadow-lg transition-all duration-200"
                        >
                            Start Your Creator Journey
                            <ArrowRight className="ml-2 h-5 w-5"/>
                        </motion.a>
                    </motion.div>
                </div>
            </section>

            {/* App Download Section */}
            <section className="py-32 bg-gray-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div
                        className="absolute top-20 left-20 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div
                        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                        style={{animationDelay: '2s'}}></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <motion.div
                        initial={{y: 50, opacity: 0}}
                        whileInView={{y: 0, opacity: 1}}
                        transition={{duration: 0.6}}
                        viewport={{once: true}}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Download{' '}
                            <span className="bg-gradient-to-r from-pink-500 to-red-400 bg-clip-text text-transparent">
                                Amize
                            </span>{' '}
                            Today
                        </h2>
                        <p className="text-xl text-gray-300 mb-12">
                            Available on all your favorite devices. Start creating and sharing amazing videos now!
                        </p>

                        <motion.div
                            initial={{y: 30, opacity: 0}}
                            whileInView={{y: 0, opacity: 1}}
                            transition={{delay: 0.2, duration: 0.6}}
                            viewport={{once: true}}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto"
                        >
                            {[
                                {
                                    icon: "/images/appstore.png",
                                    title: "App Store",
                                    subtitle: "Download on the",
                                    color: "from-blue-500 to-blue-600"
                                },
                                {
                                    icon: "/images/playstore.png",
                                    title: "Google Play",
                                    subtitle: "Get it on",
                                    color: "from-green-500 to-green-600"
                                },
                                {
                                    icon: "/amize.png",
                                    title: "Web Browser",
                                    subtitle: "Use on",
                                    color: "from-purple-500 to-purple-600"
                                }
                            ].map((platform, index) => (
                                <motion.a
                                    key={index}
                                    href={index === 2 ? "/discover" : "#"}
                                    initial={{scale: 0, rotateY: 180}}
                                    whileInView={{scale: 1, rotateY: 0}}
                                    transition={{
                                        delay: 0.1 * index,
                                        duration: 0.6,
                                        type: "spring"
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        y: -10,
                                        transition: {duration: 0.2}
                                    }}
                                    viewport={{once: true}}
                                    className="group relative"
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-r ${platform.color} rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-lg`}></div>
                                    <div
                                        className="relative flex items-center gap-3 justify-center p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl group-hover:border-pink-500/30 transition-all duration-300">
                                        <img
                                            src={platform.icon}
                                            alt={platform.title}
                                            className="h-12 w-12 group-hover:scale-110 transition-transform"
                                        />
                                        <div className="text-left">
                                            <div
                                                className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{platform.subtitle}</div>
                                            <div
                                                className="text-lg font-semibold text-white group-hover:text-pink-300 transition-colors">{platform.title}</div>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{y: 30, opacity: 0}}
                            whileInView={{y: 0, opacity: 1}}
                            transition={{delay: 0.4, duration: 0.6}}
                            viewport={{once: true}}
                            className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm"
                        >
                            {[
                                {icon: Star, text: "4.8 Rating", color: "text-yellow-500"},
                                {icon: Download, text: "10M+ Downloads", color: "text-pink-500"},
                                {icon: Gem, text: "#1 Entertainment", color: "text-purple-500"}
                            ].map((achievement, index) => (
                                <motion.div
                                    key={index}
                                    initial={{scale: 0}}
                                    whileInView={{scale: 1}}
                                    transition={{
                                        delay: 0.6 + index * 0.1,
                                        type: "spring",
                                        bounce: 0.6
                                    }}
                                    viewport={{once: true}}
                                    className="flex items-center group cursor-pointer"
                                >
                                    <achievement.icon
                                        className={`h-5 w-5 mr-2 ${achievement.color} group-hover:scale-110 transition-transform`}/>
                                    <span
                                        className="group-hover:text-gray-300 transition-colors">{achievement.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <Footer/>
        </div>
    );
};

export default Home;