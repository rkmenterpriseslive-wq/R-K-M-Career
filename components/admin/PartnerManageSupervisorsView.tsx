

import React, { useState, useMemo, FC, useEffect } from 'react';
import { StoreSupervisor, UserType } from '../../types';
import { createSecondaryUser } from '../../services/firebaseService';
import { onStoreSupervisorsChange, createStoreSupervisor, updateStoreSupervisor, deleteStoreSupervisor } from '../../services/firestoreService'; // Import new Firestore services
import { auth } from '../../services/firebaseService'; // Import auth for current user UID
import Button from '../Button';
import Input from '../Input';
import Modal from '../Modal';
import { usePopup } from '../../contexts/PopupContext'; // Import usePopup
import StatCard from '../admin/StatCard'; // Import StatCard

// --- SUB-COMPONENTS ---
const SupervisorForm: FC<{
    supervisor: Partial<StoreSupervisor> | null;
    onSave: (data: Omit<StoreSupervisor, 'id'>) => Promise<void>; // Modified for add/edit
    onClose: () => void;
    isSubmitting?: boolean;
    stores: { id: string; name: string; location: string }[];
}> = ({ supervisor, onSave, onClose, isSubmitting, stores }) => {
    const [formData, setFormData] = useState<Partial<StoreSupervisor>>(
        supervisor || { name: '', email: '', phone: '', storeLocation: '', status: 'Active' }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.name || !formData.email || !formData.phone || !formData.storeLocation) {
            alert('Please fill all required fields.');
            return;
        }
        await onSave(formData as Omit<StoreSupervisor, 'id'>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="name" name="name" label="Full Name" value={formData.name || ''} onChange={handleChange} required />
            <Input id="email" name="email" label="Email Address" type="email" value={formData.email || ''} onChange={handleChange} required disabled={!!supervisor} /> {/* Email disabled if editing */}
            <Input id="phone" name="phone" label="Phone Number" type="tel" value={formData.phone || ''} onChange={handleChange} required />
            
            <div>
                <label htmlFor="storeLocation" className="block text-sm font-medium text-gray-700 mb-1">Store Location</label>
                <select 
                    id="storeLocation" 
                    name="storeLocation" 
                    value={formData.storeLocation || ''} 
                    onChange={handleChange} 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    required
                >
                    <option value="">Select Store</option>
                    {stores.map(store => (
                        <option key={store.id} value={`${store.name} - ${store.location}`}>
                            {store.name} - {store.location}
                        </option>
                    ))}
                </select>
                {stores.length === 0 && <p className="text-xs text-red-500 mt-1">No stores configured. Please add stores in Settings first.</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>Save Supervisor</Button>
            </div>
        </form>
    );
};

interface PartnerManageSupervisorsViewProps {
    stores?: { id: string; name: string; location: string }[];
}

const PartnerManageSupervisorsView: FC<PartnerManageSupervisorsViewProps> = ({ stores = [] }) => {
    const [supervisors, setSupervisors] = useState<StoreSupervisor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupervisor, setEditingSupervisor] = useState<StoreSupervisor | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showPopup } = usePopup();

    const currentPartnerId = auth.currentUser?.uid; // Get current partner's UID

    useEffect(() => {
        if (!currentPartnerId) {
            setSupervisors([]);
            return;
        }
        // Use the real-time listener for live updates, filtered by partner ID.
        const unsubscribe = onStoreSupervisorsChange((data) => {
            setSupervisors(data);
        }, currentPartnerId);

        // Cleanup the listener when the component unmounts or partnerId changes
        return () => unsubscribe();
    }, [currentPartnerId]);
    
    const ICONS = {
        total: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        active: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        inactive: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
    };

    const summary = useMemo(() => ({
        total: supervisors.length,
        active: supervisors.filter(s => s.status === 'Active').length,
        inactive: supervisors.filter(s => s.status === 'Inactive').length,
    }), [supervisors]);

    const filteredSupervisors = useMemo(() => {
        return supervisors.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.storeLocation.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [supervisors, searchTerm]);
    
    const openAddModal = () => {
        setEditingSupervisor(null);
        setIsModalOpen(true);
    };

    const openEditModal = (supervisor: StoreSupervisor) => {
        setEditingSupervisor(supervisor);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<StoreSupervisor, 'id'>) => {
        if (!currentPartnerId) {
            showPopup({ type: 'error', title: 'Error', message: 'Partner ID not found. Please log in again.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingSupervisor) { // Update existing supervisor
                await updateStoreSupervisor(editingSupervisor.id, data);
                showPopup({ type: 'success', title: 'Success', message: `Supervisor "${data.name}" updated.` });
            } else { // Add new supervisor
                // 1. Create Firebase Auth user and initial profile in 'users' collection
                const authSuccess = await createSecondaryUser(data.email, "password", {
                    email: data.email,
                    userType: UserType.STORE_SUPERVISOR,
                    fullName: data.name,
                    phone: data.phone,
                    storeLocation: data.storeLocation,
                    partnerId: currentPartnerId, // Link to the current partner
                });

                if (!authSuccess) {
                    throw new Error("Failed to create supervisor login account.");
                }

                // 2. Create supervisor document in 'store_supervisors' collection
                const newSupervisorData: Omit<StoreSupervisor, 'id'> = { 
                    ...data, 
                    partnerId: currentPartnerId, // Associate with the current partner
                };
                await createStoreSupervisor(newSupervisorData);
                showPopup({ type: 'success', title: 'Success', message: `Supervisor "${data.name}" added. Login password is "password".` });
            }
            setIsModalOpen(false);
            setEditingSupervisor(null);
            // No need to manually refresh; real-time listener will update the list.
        } catch (error: any) {
            console.error("Error saving supervisor:", error);
            showPopup({ type: 'error', title: 'Error', message: error.message || 'Failed to save supervisor. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleToggleStatus = async (supervisor: StoreSupervisor) => {
        const newStatus = supervisor.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await updateStoreSupervisor(supervisor.id, { status: newStatus });
            // Real-time listener will handle UI update
            showPopup({ type: 'success', title: 'Status Updated', message: `Supervisor "${supervisor.name}" is now ${newStatus}.` });
        } catch (error) {
            console.error("Error toggling supervisor status:", error);
            showPopup({ type: 'error', title: 'Error', message: 'Failed to update supervisor status.' });
        }
    };

    const handleDeleteSupervisor = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete supervisor "${name}"? This action cannot be undone.`)) {
            try {
                await deleteStoreSupervisor(id);
                // Real-time listener will handle UI update
                showPopup({ type: 'success', title: 'Deleted', message: `Supervisor "${name}" has been deleted.` });
            } catch (error) {
                console.error("Error deleting supervisor:", error);
                showPopup({ type: 'error', title: 'Error', message: 'Failed to delete supervisor.' });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Manage Supervisors</h2>
                <Button variant="primary" onClick={openAddModal}>+ Add New Supervisor</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Supervisors" value={summary.total.toString()} icon={ICONS.total} />
                <StatCard title="Active Supervisors" value={summary.active.toString()} valueColor="text-green-600" icon={ICONS.active} />
                <StatCard title="Inactive Supervisors" value={summary.inactive.toString()} valueColor="text-red-600" icon={ICONS.inactive} />
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Input id="search" label="Search by Name or Store Location" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSupervisors.length > 0 ? filteredSupervisors.map(sup => (
                                <tr key={sup.id}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{sup.name}</div>
                                        <div className="text-xs text-gray-500">{sup.email} | {sup.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{sup.storeLocation}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${sup.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {sup.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(sup)}>
                                            {sup.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => openEditModal(sup)}>Edit</Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteSupervisor(sup.id, sup.name)}>Delete</Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No supervisors added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}>
                <SupervisorForm 
                    supervisor={editingSupervisor} 
                    onSave={handleSave} 
                    onClose={() => setIsModalOpen(false)} 
                    isSubmitting={isSubmitting}
                    stores={stores}
                />
            </Modal>
        </div>
    );
};

export default PartnerManageSupervisorsView;