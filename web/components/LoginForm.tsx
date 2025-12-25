'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(false); // Toggle state

    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        aadhar: '', // Acts as 'Email' for Admin
        phone: '',  // Acts as 'Password' for Admin
        email: '',  // Optional email
        address: '',
        bloodGroup: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // If Login, we check if it looks like an Admin Email First
        if (isLogin && formData.aadhar.includes('@')) {
            if (!formData.aadhar) newErrors.aadhar = "Email required";
            if (!formData.phone) newErrors.phone = "Password required";
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        }

        // Common User Validations
        if (!/^\d{12}$/.test(formData.aadhar) && !isLogin) newErrors.aadhar = "Aadhar must be exactly 12 digits";
        // Allow Email in Aadhar field for Login
        if (isLogin && !formData.aadhar.includes('@') && !/^\d{12}$/.test(formData.aadhar)) {
            newErrors.aadhar = "Enter valid 12-digit Aadhar or Admin Email";
        }

        if (!/^\d{10}$/.test(formData.phone) && !isLogin) newErrors.phone = "Phone number must be 10 digits";
        // Allow Password in Phone field for Login (no regex check if it looks like admin, but if user...)
        // Actually, for user login, phone MUST be 10 digits.
        if (isLogin && jUstIsUserLogin()) {
            if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
        }

        if (!isLogin) {
            // Register-only validations
            if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
            if (!formData.dob) newErrors.dob = "Date of Birth is required";
            if (!formData.address.trim()) newErrors.address = "Address is required";
            if (!formData.bloodGroup) newErrors.bloodGroup = "Blood Group is required";
            if (!/^\d{12}$/.test(formData.aadhar)) newErrors.aadhar = "Aadhar must be exactly 12 digits";
            if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const jUstIsUserLogin = () => {
        // Helper to decide if we are validating as a user
        return !formData.aadhar.includes('@');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            // Admin Check
            if (isLogin && formData.aadhar.toLowerCase() === 'nitsxcreation@gmail.com' && formData.phone === 'admin@01') {
                localStorage.setItem('user_profile', JSON.stringify({
                    fullName: 'Admin',
                    role: 'admin',
                    aadhar: '000000000000'
                }));
                router.push('/');
                return;
            } else if (isLogin && formData.aadhar.includes('@')) {
                alert("Invalid Admin Credentials");
                setLoading(false);
                return;
            }

            if (isLogin) {
                // LOGIN LOGIC (User)
                const q = query(
                    collection(db, 'users'),
                    where('aadhar', '==', formData.aadhar),
                    where('phone', '==', formData.phone)
                );
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    alert("User not found or credentials mismatch.");
                    setLoading(false);
                    return;
                }

                // Login Success
                const user = snapshot.docs[0].data();
                localStorage.setItem('user_profile', JSON.stringify(user));
                router.push('/');

            } else {
                // REGISTER LOGIC
                // Check if already exists
                const q = query(collection(db, 'users'), where('aadhar', '==', formData.aadhar));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    alert("A user with this Aadhar already exists. Please login.");
                    setIsLogin(true);
                    setLoading(false);
                    return;
                }

                await addDoc(collection(db, 'users'), {
                    ...formData,
                    timestamp: new Date().toISOString()
                });

                localStorage.setItem('user_profile', JSON.stringify(formData));
                router.push('/');
            }
        } catch (error) {
            console.error("Error Auth:", error);
            alert("Authentication failed. Check your internet.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Limit numeric inputs ONLY if NOT Admin flow (checking if it looks like email/password?)
        // Actually, for Register mode, strict. For Login mode, relaxed.

        if (!isLogin) {
            if ((name === 'aadhar' || name === 'phone') && !/^\d*$/.test(value)) return;
        } else {
            // Login Mode: Aadhar can be anything (email). Phone can be anything (password).
            // But if user starts typing numbers in aadhar, keep strict? 
            // Best to relax input restriction in Login mode completely to allow typing email.
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-center mb-6">
                <div className="bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!isLogin ? 'bg-white dark:bg-neutral-700 shadow text-orange-600' : 'text-neutral-500'}`}
                    >
                        Register
                    </button>
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${isLogin ? 'bg-white dark:bg-neutral-700 shadow text-orange-600' : 'text-neutral-500'}`}
                    >
                        Login
                    </button>
                </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-center text-neutral-500 mb-8">
                {isLogin ? 'Enter your credentials to access.' : 'Please enter your details to continue.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-neutral-300">
                        {isLogin ? 'Identity (Aadhar Number or Admin Email)' : 'Aadhar Number'}
                    </label>
                    <input
                        name="aadhar"
                        type={isLogin && formData.aadhar.includes('@') ? 'email' : 'text'}
                        maxLength={isLogin ? 100 : 12}
                        value={formData.aadhar}
                        onChange={handleChange}
                        className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.aadhar ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                        placeholder={isLogin ? "Enter Aadhar Number or Email" : "12 Digit Aadhar Number"}
                    />
                    {errors.aadhar && <p className="text-xs text-red-500 mt-1">{errors.aadhar}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-neutral-300">
                        {isLogin ? 'Authentication (Phone Number or Password)' : 'Phone Number'}
                    </label>
                    <input
                        name="phone"
                        type={isLogin && formData.aadhar.includes('@') ? 'password' : 'text'}
                        maxLength={isLogin ? 100 : 10}
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.phone ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                        placeholder={isLogin ? "Enter Phone or Password" : "10 Digit Mobile Number"}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {!isLogin && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Email Address (Optional)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.email ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="example@email.com"
                            />
                        </div>
                    </>
                )}

                {!isLogin && (
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none ${errors.address ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                            placeholder="Current Address"
                        />
                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    </div>
                )}

                <Button
                    className="w-full py-4 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg mt-4"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Enter CrisisSync')}
                </Button>
            </form>
        </div >
    );
}
