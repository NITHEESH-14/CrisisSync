'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        aadhar: '',
        phone: '',
        email: '',
        password: '',
        address: '',
        bloodGroup: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (isLogin) {
            if (!formData.aadhar?.trim()) newErrors.aadhar = "Identity is required";
            if (!formData.password?.trim()) newErrors.password = "Password is required";
        } else {
            if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
            if (!formData.dob) newErrors.dob = "Date of Birth is required";
            if (!/^\d{12}$/.test(formData.aadhar)) newErrors.aadhar = "Aadhar must be exactly 12 digits";
            if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
            if (!formData.email.trim()) newErrors.email = "Email is required";
            if (!formData.password || formData.password.length < 6) newErrors.password = "Password must be at least 6 chars";
            if (!formData.address.trim()) newErrors.address = "Address is required";
            if (!formData.bloodGroup) newErrors.bloodGroup = "Blood Group is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            if (isLogin && formData.aadhar.toLowerCase() === 'nitsxcreation@gmail.com' && formData.password === 'admin@01') {
                localStorage.setItem('user_profile', JSON.stringify({
                    fullName: 'Admin',
                    role: 'admin',
                    id: 'admin_master',
                    aadhar: '000000000000'
                }));
                router.push('/');
                return;
            }

            if (isLogin) {
                const input = formData.aadhar.trim();
                let q;

                if (input.includes('@')) {
                    q = query(collection(db, 'users'), where('email', '==', input));
                } else if (/^\d{12}$/.test(input)) {
                    q = query(collection(db, 'users'), where('aadhar', '==', input));
                } else if (/^\d{10}$/.test(input)) {
                    q = query(collection(db, 'users'), where('phone', '==', input));
                } else {
                    q = query(collection(db, 'users'), where('email', '==', input));
                }

                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    alert("User not found.");
                    setLoading(false);
                    return;
                }

                const userDoc = snapshot.docs[0];
                const userData = userDoc.data();

                if (userData.password !== formData.password) {
                    alert("Incorrect Password.");
                    setLoading(false);
                    return;
                }

                localStorage.setItem('user_profile', JSON.stringify({ ...userData, id: userDoc.id }));
                router.push('/');

            } else {
                const qAadhar = query(collection(db, 'users'), where('aadhar', '==', formData.aadhar));
                const snapAadhar = await getDocs(qAadhar);

                if (!snapAadhar.empty) {
                    alert("User with this Aadhar already exists.");
                    setLoading(false);
                    return;
                }

                await addDoc(collection(db, 'users'), {
                    ...formData,
                    role: 'user',
                    timestamp: new Date().toISOString()
                });

                localStorage.setItem('user_profile', JSON.stringify(formData));
                router.push('/');
            }
        } catch (error) {
            console.error("Error Auth:", error);
            alert("Authentication failed. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (!isLogin) {
            if (name === 'aadhar' && !/^\d*$/.test(value)) return;
            if (name === 'phone' && !/^\d*$/.test(value)) return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-center mb-6">
                <div className="bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg inline-flex">
                    <button
                        type="button"
                        onClick={() => { setIsLogin(false); setErrors({}); setFormData(prev => ({ ...prev, password: '' })); }}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!isLogin ? 'bg-white dark:bg-neutral-700 shadow text-orange-600' : 'text-neutral-500'}`}
                    >
                        Register
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(true); setErrors({}); setFormData(prev => ({ ...prev, password: '' })); }}
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

                {isLogin ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Identity</label>
                            <input
                                name="aadhar"
                                type="text"
                                value={formData.aadhar}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.aadhar ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="Aadhar Number, Email, or Phone"
                            />
                            {errors.aadhar && <p className="text-xs text-red-500 mt-1">{errors.aadhar}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.password ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="Enter Password"
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Full Name</label>
                            <input
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.fullName ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="John Doe"
                            />
                            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Aadhar Number</label>
                            <input
                                name="aadhar"
                                type="text"
                                maxLength={12}
                                value={formData.aadhar}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.aadhar ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="12 Digit Aadhar Number"
                            />
                            {errors.aadhar && <p className="text-xs text-red-500 mt-1">{errors.aadhar}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Phone Number</label>
                            <input
                                name="phone"
                                type="text"
                                maxLength={10}
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.phone ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="10 Digit Mobile Number"
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.email ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="example@email.com"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Password</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.password ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="Create a secure password"
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Date of Birth</label>
                                <input
                                    name="dob"
                                    type="date"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.dob ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                />
                                {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Blood Group</label>
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all ${errors.bloodGroup ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                                {errors.bloodGroup && <p className="text-xs text-red-500 mt-1">{errors.bloodGroup}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                className={`w-full p-3 rounded-lg border bg-neutral-50 dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none ${errors.address ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-600'}`}
                                placeholder="Current Address"
                            />
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>
                    </>
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
