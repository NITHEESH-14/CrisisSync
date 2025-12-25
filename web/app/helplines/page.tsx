'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { useRouter } from 'next/navigation';
import { collection, query, onSnapshot, writeBatch, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Contact = {
    id: string;
    name: string;
    number: string;
    category: 'police' | 'fire' | 'medical' | 'disaster' | 'support' | 'other';
};

const OFFICIAL_TN_CONTACTS = [
    { name: 'Police Control Room', number: '100', category: 'police' },
    { name: 'Fire & Rescue Services', number: '101', category: 'fire' },
    { name: 'Emergency Response (Ambulance)', number: '108', category: 'medical' },
    { name: 'Ambulance', number: '102', category: 'medical' },
    { name: 'State Disaster Control', number: '1070', category: 'disaster' },
    { name: 'District Disaster Control', number: '1077', category: 'disaster' },
    { name: 'Women Helpline', number: '181', category: 'support' },
    { name: 'Child Helpline', number: '1098', category: 'support' },
    { name: 'Cyber Crime', number: '1930', category: 'police' },
    { name: 'Coastal Security', number: '1093', category: 'police' },
    { name: 'Senior Citizen Helpline', number: '14567', category: 'support' },
    { name: 'Traffic Police', number: '103', category: 'police' },
    { name: 'Railway Protection Force', number: '182', category: 'police' },
];

export default function HelpLinesPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', number: '', category: 'support' });

    useEffect(() => {
        const stored = localStorage.getItem('user_profile');
        if (stored) {
            const user = JSON.parse(stored);
            setIsAdmin(user.role === 'admin' || user.email === 'nitsxcreation@gmail.com');
        }
    }, []);

    const handleAddContact = async () => {
        if (!newContact.name || !newContact.number) return;
        try {
            await addDoc(collection(db, 'helplines'), newContact);
            setNewContact({ name: '', number: '', category: 'support' });
        } catch (e) {
            console.error("Add failed:", e);
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (!confirm('Admin: Delete this contact?')) return;
        try {
            await deleteDoc(doc(db, 'helplines', id));
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'helplines'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                console.log("Seeding helplines data...");
                try {
                    const batch = writeBatch(db);
                    OFFICIAL_TN_CONTACTS.forEach((contact) => {
                        const docRef = doc(collection(db, 'helplines'));
                        batch.set(docRef, contact);
                    });
                    await batch.commit();
                } catch (e) {
                    console.error("Error seeding helplines:", e);
                    setLoading(false);
                }
            } else {
                const fetchedContacts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Contact[];
                setContacts(fetchedContacts);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching helplines:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredContacts = contacts
        .filter(contact =>
            contact.name.toLowerCase().includes(search.toLowerCase()) ||
            contact.number.includes(search)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const getIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );

    const getColor = (category: string) => {
        return 'bg-purple-100 text-purple-600 dark:bg-[#4c1d56] dark:text-[#dba6f0]';
    };

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-4 font-[family-name:var(--font-sans)]">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6" /></svg>
                        Back
                    </Button>
                    <h1 className="text-xl font-bold dark:text-white">Help Lines</h1>
                    <div className="w-16"></div>
                </div>

                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl border-none shadow-sm bg-white dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {isAdmin && (
                    <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/40">
                        <h3 className="font-bold mb-3 dark:text-white">Admin: Add Helpline</h3>
                        <div className="space-y-3">
                            <input
                                placeholder="Contact Name"
                                className="w-full p-2 rounded border dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-sm"
                                value={newContact.name}
                                onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <input
                                    placeholder="Number"
                                    className="flex-1 p-2 rounded border dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-sm"
                                    value={newContact.number}
                                    onChange={e => setNewContact({ ...newContact, number: e.target.value })}
                                />

                            </div>
                            <Button size="sm" onClick={handleAddContact} className="w-full bg-orange-600 text-white">Add Contact</Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider ml-2">Tamil Nadu Emergency Contacts</h2>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-10 text-neutral-400">
                            No contacts found.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                            {filteredContacts.map((contact) => (
                                <div key={contact.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer active:bg-neutral-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColor(contact.category)}`}>
                                            {getIcon()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-neutral-900 dark:text-white">{contact.name}</p>
                                            <p className="text-sm text-neutral-500">{contact.number}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                                className="p-3 rounded-full bg-red-100 text-red-600 dark:bg-[#3f1616] dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        )}
                                        <a href={`tel:${contact.number}`} className="p-3 rounded-full bg-green-100 text-green-600 dark:bg-[#122b1c] dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
