import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, MapPin, Zap, Shield, Clock, ArrowRight, LogIn, UserPlus } from 'lucide-react';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-600 to-indigo-900">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 container mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <Car className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-2xl font-bold text-white">LastMile</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2.5 text-white font-semibold hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-2.5 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto px-6 py-20 md:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Share Rides,
                        <br />
                        <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Save Money</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
                        Connect with riders and drivers for the last mile of your metro journey. Safe, affordable, and eco-friendly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            I Have an Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
                        Why Choose LastMile?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-gradient-to-br from-white to-yellow-50 backdrop-blur-xl p-8 rounded-3xl border border-yellow-200 hover:from-yellow-50 hover:to-white transition-all duration-300 transform hover:-translate-y-2 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(251,191,36,0.5)]">
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Fast Matching</h3>
                            <p className="text-gray-700 text-lg">
                                Get matched with riders or drivers instantly based on your metro station and destination.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-gradient-to-br from-white to-purple-50 backdrop-blur-xl p-8 rounded-3xl border border-purple-200 hover:from-purple-50 hover:to-white transition-all duration-300 transform hover:-translate-y-2 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(168,85,247,0.5)]">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Safe & Secure</h3>
                            <p className="text-gray-700 text-lg">
                                Verified users, real-time tracking, and secure payment options for peace of mind.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-gradient-to-br from-white to-emerald-50 backdrop-blur-xl p-8 rounded-3xl border border-emerald-200 hover:from-emerald-50 hover:to-white transition-all duration-300 transform hover:-translate-y-2 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)]">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Time</h3>
                            <p className="text-gray-700 text-lg">
                                No more waiting for cabs or buses. Share rides and reach your destination faster.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
                        How It Works
                    </h2>
                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="flex items-start gap-6 bg-gradient-to-r from-white to-purple-50 backdrop-blur-xl p-8 rounded-3xl border border-purple-200 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(168,85,247,0.5)] transition-all duration-300">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                1
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign Up</h3>
                                <p className="text-gray-700 text-lg">
                                    Create an account as a rider or driver in seconds.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-6 bg-gradient-to-r from-white to-orange-50 backdrop-blur-xl p-8 rounded-3xl border border-orange-200 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.5)] transition-all duration-300">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                2
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Your Route</h3>
                                <p className="text-gray-700 text-lg">
                                    Enter your metro station and destination. We'll find the perfect match.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-6 bg-gradient-to-r from-white to-emerald-50 backdrop-blur-xl p-8 rounded-3xl border border-emerald-200 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] transition-all duration-300">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                3
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Share & Save</h3>
                                <p className="text-gray-700 text-lg">
                                    Meet your match, share the ride, and save money on your commute!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 container mx-auto px-6 py-20 mb-20">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-blue-50 backdrop-blur-xl p-12 rounded-3xl border border-blue-200 text-center shadow-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Ready to Start?
                    </h2>
                    <p className="text-xl text-gray-700 mb-8">
                        Join thousands of commuters making their last mile journey easier.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1"
                    >
                        Get Started Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                <Car className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-lg font-bold text-white">LastMile</span>
                        </div>
                        <p className="text-white/70">
                            © 2025 LastMile. Making commutes better, together.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
