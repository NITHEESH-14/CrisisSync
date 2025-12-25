'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRouter } from 'next/navigation';

type SettingsView = 'menu' | 'org' | 'volunteer' | 'profile';

export function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<SettingsView>('menu');
    const [profileData, setProfileData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('user_profile');
            if (stored) {
                setProfileData(JSON.parse(stored));
            }
        }
    }, [isOpen]);

    const handleUpdateProfile = async () => {
        if (!profileData || !profileData.aadhar) {
            alert("Aadhar number is required to update profile.");
            return;
        }
        try {
            const q = query(collection(db, 'users'), where('aadhar', '==', profileData.aadhar));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'users', userDoc.id), {
                    phone: profileData.phone,
                    address: profileData.address,
                    bloodGroup: profileData.bloodGroup || ''
                });
            } else {
                await addDoc(collection(db, 'users'), {
                    aadhar: profileData.aadhar,
                    phone: profileData.phone,
                    address: profileData.address,
                    bloodGroup: profileData.bloodGroup || '',
                    timestamp: new Date().toISOString()
                });
            }

            localStorage.setItem('user_profile', JSON.stringify(profileData));
            alert('Profile Updated Successfully!');
            setView('menu');
        } catch (error) {
            alert("Failed to update profile.");
        }
    };

    const handleLogout = () => {
        if (confirm("Are you sure you want to log out?")) {
            localStorage.removeItem('user_profile');
            router.push('/login');
        }
    };

    const [orgData, setOrgData] = useState({ id: '', name: '', owner: '', societyRegNo: '', address: '' });
    const [volData, setVolData] = useState({ id: '', name: '', age: '', blood: '', state: '', district: '', address: '' });
    const [hasOrg, setHasOrg] = useState(false);
    const [hasVol, setHasVol] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored === 'light') {
                setTheme('light');
            } else {
                setTheme('dark');
            }
        }
    }, [isOpen]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        if (isOpen && profileData?.fullName) {
            const fetchData = async () => {
                const orgQ = query(collection(db, 'organizations'), where('owner', '==', profileData.fullName));
                const orgSnap = await getDocs(orgQ);
                if (!orgSnap.empty) {
                    setHasOrg(true);
                    const data = orgSnap.docs[0].data();
                    setOrgData({ id: orgSnap.docs[0].id, name: data.name, owner: data.owner, societyRegNo: data.societyRegNo, address: data.address });
                }

                const volQ = query(collection(db, 'volunteers'), where('name', '==', profileData.fullName));
                const volSnap = await getDocs(volQ);
                if (!volSnap.empty) {
                    setHasVol(true);
                    const data = volSnap.docs[0].data();
                    setVolData({
                        id: volSnap.docs[0].id,
                        name: data.name,
                        age: data.age,
                        blood: data.blood,
                        state: data.state,
                        district: data.district,
                        address: data.address
                    });
                }
            };
            fetchData();
        }
    }, [isOpen, profileData]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setTimeout(() => setView('menu'), 300);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleRegisterOrg = async () => {
        if (!orgData.name || !orgData.owner || !orgData.societyRegNo || !orgData.address) {
            alert("Please fill in all fields before submitting.");
            return;
        }
        try {
            if (hasOrg && orgData.id) {
                await updateDoc(doc(db, 'organizations', orgData.id), {
                    name: orgData.name,
                    owner: orgData.owner,
                    societyRegNo: orgData.societyRegNo,
                    address: orgData.address
                });
                alert('Organization Details Updated!');
            } else {
                await addDoc(collection(db, 'organizations'), {
                    name: orgData.name,
                    owner: orgData.owner,
                    societyRegNo: orgData.societyRegNo,
                    address: orgData.address,
                    timestamp: new Date().toISOString()
                });
                alert('Organization Registration Submitted!');
                setHasOrg(true);
            }
            setView('menu');
        } catch (e) {
            console.error("Error saving org:", e);
        }
    };

    const handleRegisterVol = async () => {
        if (!volData.name || !volData.age || !volData.blood || !volData.state || !volData.district || !volData.address) {
            alert("Please fill in all details before registering.");
            return;
        }
        try {
            if (hasVol && volData.id) {
                await updateDoc(doc(db, 'volunteers', volData.id), {
                    name: volData.name,
                    age: volData.age,
                    blood: volData.blood,
                    state: volData.state,
                    district: volData.district,
                    address: volData.address
                });
                alert('Volunteer Profile Updated!');
            } else {
                await addDoc(collection(db, 'volunteers'), {
                    name: volData.name,
                    age: volData.age,
                    blood: volData.blood,
                    state: volData.state,
                    district: volData.district,
                    address: volData.address,
                    timestamp: new Date().toISOString()
                });
                alert('Volunteer Registration Submitted!');
                setHasVol(true);
            }
            setView('menu');
        } catch (e) {
            console.error("Error registering volunteer:", e);
        }
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    const handleOpenVolunteer = () => {
        if (!hasVol && profileData) {
            setVolData({
                ...volData,
                name: profileData.fullName || '',
                blood: profileData.bloodGroup || '',
                address: profileData.address || '',
                age: calculateAge(profileData.dob)
            });
        }
        setView('volunteer');
    };

    const handleOpenOrg = () => {
        if (!hasOrg && profileData) {
            setOrgData({
                ...orgData,
                owner: profileData.fullName || ''
            });
        }
        setView('org');
    }

    return (
        <>
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-3 rounded-full bg-neutral-100/80 dark:bg-white/10 backdrop-blur-sm border border-neutral-200 dark:border-white/20 hover:bg-neutral-200 dark:hover:bg-white/20 transition-all active:scale-95 text-neutral-900 dark:text-white"
                    title="Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-neutral-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="pl-6 py-6 pr-1 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-8 pr-4">
                        {view === 'menu' ? (
                            <h2 className="text-xl font-bold dark:text-white">Settings</h2>
                        ) : (
                            <button
                                onClick={() => setView('menu')}
                                className="flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors"
                            >
                                ← Back
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600">
                        {view === 'menu' && (
                            <div className="space-y-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setView('profile')}
                                    className="w-full h-[46px] flex items-center justify-center text-center text-sm bg-transparent border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors focus:ring-0 focus:ring-offset-0 active:border-neutral-400 active:bg-transparent"
                                    style={{ borderRadius: '6px', outline: 'none', boxShadow: 'none' }}
                                >
                                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Your Account</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-[46px] flex items-center justify-center text-center text-sm bg-transparent border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors focus:ring-0 focus:ring-offset-0 active:border-neutral-400 active:bg-transparent"
                                    onClick={handleOpenOrg}
                                    style={{ borderRadius: '6px', outline: 'none', boxShadow: 'none' }}
                                >
                                    <span className="font-medium text-neutral-600 dark:text-neutral-400">
                                        {hasOrg ? "Manage Organization" : "Register Organization"}
                                    </span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-[46px] flex items-center justify-center text-center text-sm bg-transparent border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors focus:ring-0 focus:ring-offset-0 active:border-neutral-400 active:bg-transparent"
                                    onClick={() => handleOpenVolunteer()}
                                    style={{ borderRadius: '6px', outline: 'none', boxShadow: 'none' }}
                                >
                                    <span className="font-medium text-neutral-600 dark:text-neutral-400">
                                        {hasVol ? "Volunteer Profile" : "Register as a Volunteer"}
                                    </span>
                                </Button>

                                <h3 className="font-bold text-neutral-400 text-xs uppercase mb-3 text-left">Preferences</h3>
                                <div className="space-y-4">
                                    <div
                                        className="w-full h-[46px] flex items-center justify-between px-4 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-pointer rounded-md select-none"
                                        onClick={toggleTheme}
                                        role="button"
                                        tabIndex={0}
                                        style={{ borderRadius: '6px' }}
                                    >
                                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Dark Mode</span>
                                        <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 border border-transparent flex-shrink-0 ${theme === 'dark' ? 'bg-orange-500' : 'bg-neutral-200'}`}>
                                            <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${theme === 'dark' ? 'left-[calc(100%-1.15rem)]' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>

                                    <div
                                        className="w-full h-[46px] flex items-center justify-between px-4 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-pointer rounded-md select-none"
                                        onClick={async () => {
                                            const current = localStorage.getItem('notifications_enabled') !== 'false';
                                            const newState = !current;
                                            localStorage.setItem('notifications_enabled', newState.toString());

                                            if (newState) {
                                                if (!("Notification" in window)) {
                                                    alert("This browser does not support desktop notifications");
                                                } else if (Notification.permission !== "granted") {
                                                    const permission = await Notification.requestPermission();
                                                    if (permission === "granted") {
                                                        new Notification("CrisisSync Alerts Activated", {
                                                            body: "You will now receive emergency alerts even if the tab is inactive.",
                                                            icon: "/favicon.ico"
                                                        });
                                                    }
                                                }
                                            }

                                            const btn = document.getElementById('notif-toggle-knob');
                                            const track = document.getElementById('notif-toggle-track');
                                            if (btn && track) {
                                                if (newState) {
                                                    track.classList.remove('bg-neutral-200');
                                                    track.classList.add('bg-orange-500');
                                                    btn.style.left = 'calc(100% - 1.15rem)';
                                                } else {
                                                    track.classList.remove('bg-orange-500');
                                                    track.classList.add('bg-neutral-200');
                                                    btn.style.left = '0.125rem';
                                                }
                                            }
                                            alert(`Notifications ${newState ? 'Enabled' : 'Disabled'}`);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        style={{ borderRadius: '6px' }}
                                    >
                                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Live Notifications</span>
                                        <div id="notif-toggle-track" className={`w-11 h-6 rounded-full relative transition-colors duration-200 border border-transparent flex-shrink-0 ${localStorage.getItem('notifications_enabled') !== 'false' ? 'bg-orange-500' : 'bg-neutral-200'}`}>
                                            <div id="notif-toggle-knob" className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${localStorage.getItem('notifications_enabled') !== 'false' ? 'left-[calc(100%-1.15rem)]' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-2 border-t border-neutral-200 dark:border-white/10">
                                    <Button
                                        variant="ghost"
                                        className="w-full h-[46px] flex items-center justify-center text-center text-sm bg-red-50 dark:bg-red-900/10 border border-neutral-300 dark:border-neutral-700 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors outline-none focus:outline-none focus:ring-0 active:bg-red-100"
                                        onClick={handleLogout}
                                        style={{ borderRadius: '6px', outline: 'none', boxShadow: 'none' }}
                                    >
                                        Log Out
                                    </Button>
                                </div>
                            </div>
                        )}

                        {view === 'org' && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-200">
                                <h3 className="font-bold text-lg dark:text-white mb-4">
                                    {hasOrg ? "Manage Organization" : "Register Organization"}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Organization Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                            placeholder="e.g. Red Cross Local"
                                            value={orgData.name}
                                            onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Owner / Representative</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                            placeholder="Full Name"
                                            value={orgData.owner}
                                            onChange={(e) => setOrgData({ ...orgData, owner: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Society Registration Number</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                            placeholder="Registration No."
                                            value={orgData.societyRegNo}
                                            onChange={(e) => setOrgData({ ...orgData, societyRegNo: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Address</label>
                                        <textarea
                                            className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm h-20 transition-all resize-none appearance-none outline-none"
                                            placeholder="Office Address"
                                            value={orgData.address}
                                            onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                                        />
                                    </div>
                                    <Button className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg !border-0 border-none" onClick={handleRegisterOrg}>
                                        {hasOrg ? "Update Details" : "Submit Registration"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {view === 'volunteer' && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-200">
                                <h3 className="font-bold text-lg dark:text-white mb-4">
                                    {hasVol ? "Volunteer Details" : "New Volunteer Registration"}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                            placeholder="Your Name"
                                            value={volData.name}
                                            onChange={(e) => setVolData({ ...volData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Age</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={3}
                                                value={volData.age}
                                                onInput={(e) => {
                                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                                }}
                                                onChange={(e) => setVolData({ ...volData, age: e.target.value })}
                                                className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                                placeholder="25"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">Blood Group</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                                placeholder="O+"
                                                value={volData.blood}
                                                onChange={(e) => setVolData({ ...volData, blood: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">State</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                                placeholder="e.g. California"
                                                value={volData.state}
                                                onChange={(e) => setVolData({ ...volData, state: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-500 mb-1">District</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm transition-all appearance-none outline-none"
                                                placeholder="e.g. Central"
                                                value={volData.district}
                                                onChange={(e) => setVolData({ ...volData, district: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-neutral-500 mb-1">Address</label>
                                        <textarea
                                            className="w-full p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-600 focus:ring-0 focus:border-orange-500 text-sm h-20 transition-all resize-none appearance-none outline-none"
                                            placeholder="Home Address"
                                            value={volData.address}
                                            onChange={(e) => setVolData({ ...volData, address: e.target.value })}
                                        />
                                    </div>
                                    <Button className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg !border-0 border-none" onClick={handleRegisterVol}>
                                        {hasVol ? "Update Details" : "Register"}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {view === 'profile' && profileData && (
                            <div className="space-y-4 animate-in slide-in-from-right pb-6">
                                <h3 className="text-xl font-semibold mb-4 dark:text-white">Your Profile</h3>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Full Name</label>
                                    <input
                                        disabled
                                        value={profileData.fullName || ''}
                                        className="w-full p-3 rounded bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 border-none opacity-70 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Date of Birth</label>
                                    <input
                                        disabled
                                        value={profileData.dob || ''}
                                        className="w-full p-3 rounded bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 border-none opacity-70 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Aadhar Number</label>
                                    <input
                                        disabled
                                        value={profileData.aadhar || ''}
                                        className="w-full p-3 rounded bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 border-none opacity-70 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Blood Group</label>
                                    <select
                                        value={profileData.bloodGroup || ''}
                                        onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                                        className="w-full p-3 pr-10 rounded border dark:bg-neutral-800 dark:text-white dark:border-neutral-600 focus:border-orange-500 outline-none"
                                    >
                                        <option value="">Select Blood Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Phone Number</label>
                                    <input
                                        value={profileData.phone || ''}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        maxLength={10}
                                        className="w-full p-3 rounded border dark:bg-neutral-800 dark:text-white dark:border-neutral-600 focus:border-orange-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileData.email || ''}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full p-3 rounded border dark:bg-neutral-800 dark:text-white dark:border-neutral-600 focus:border-orange-500 outline-none"
                                        placeholder="example@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-neutral-500 font-bold">Address</label>
                                    <textarea
                                        value={profileData.address || ''}
                                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                        rows={3}
                                        className="w-full p-3 rounded border dark:bg-neutral-800 dark:text-white dark:border-neutral-600 focus:border-orange-500 outline-none resize-none"
                                    />
                                </div>

                                <Button
                                    onClick={handleUpdateProfile}
                                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-8 border-t border-neutral-100 dark:border-neutral-800">


                    </div>
                </div>
            </div>
        </>
    );
}
