import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, UserPlus, AlertCircle, Car, Users } from 'lucide-react';

export const SignupPage = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('RIDER');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signup({ name, phone, password, role });
            navigate('/login');
        } catch (err) {
            setError('Signup failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Signup Card */}
            <div className="relative w-full max-w-md">
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl"></div>

                <div className="relative bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-300 hover:scale-[1.02]">
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-4 shadow-lg">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Create Account
                        </h2>
                        <p className="text-gray-600 mt-2">Join us and start your journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 placeholder:text-gray-400"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Phone Number
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 placeholder:text-gray-400"
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-200" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 placeholder:text-gray-400"
                                    placeholder="Create a password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                I want to be a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('RIDER')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${role === 'RIDER'
                                            ? 'border-emerald-600 bg-emerald-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-lg ${role === 'RIDER' ? 'bg-emerald-600' : 'bg-gray-100'}`}>
                                            <Users className={`w-5 h-5 ${role === 'RIDER' ? 'text-white' : 'text-gray-600'}`} />
                                        </div>
                                        <span className={`font-semibold text-sm ${role === 'RIDER' ? 'text-emerald-700' : 'text-gray-700'}`}>
                                            Rider
                                        </span>
                                    </div>
                                    {role === 'RIDER' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole('DRIVER')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${role === 'DRIVER'
                                            ? 'border-emerald-600 bg-emerald-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-lg ${role === 'DRIVER' ? 'bg-emerald-600' : 'bg-gray-100'}`}>
                                            <Car className={`w-5 h-5 ${role === 'DRIVER' ? 'text-white' : 'text-gray-600'}`} />
                                        </div>
                                        <span className={`font-semibold text-sm ${role === 'DRIVER' ? 'text-emerald-700' : 'text-gray-700'}`}>
                                            Driver
                                        </span>
                                    </div>
                                    {role === 'DRIVER' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-6"
                        >
                            <UserPlus className="w-5 h-5" />
                            Create Account
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-semibold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
