
import React, { useState, useMemo } from 'react';
import { WarningLetter } from '../../types';
import Button from '../Button';
import Modal from '../Modal';
import Input from '../Input';
import StatCard from './StatCard';

const WarningLettersView: React.FC = () => {
    // Initial state matching the screenshot (empty)
    const [letters, setLetters] = useState<WarningLetter[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        employeeName: '',
        reason: '',
        description: '',
        issueDate: new Date().toISOString().split('T')[0],
    });

    const summary = useMemo(() => {
        return {
            total: letters.length,
            active: letters.filter(l => l.status === 'Active').length,
            resolved: letters.filter(l => l.status === 'Resolved').length
        };
    }, [letters]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIssueLetter = (e: React.FormEvent) => {
        e.preventDefault();
        const newLetter: WarningLetter = {
            ticketNo: `WL-${new Date().getFullYear()}-${(letters.length + 1).toString().padStart(3, '0')}`,
            employeeName: formData.employeeName,
            reason: formData.reason,
            description: formData.description,
            issueDate: formData.issueDate,
            issuedBy: 'Admin', // Dynamic in real app
            status: 'Active'
        };
        setLetters([newLetter, ...letters]);
        setIsModalOpen(false);
        setFormData({
            employeeName: '',
            reason: '',
            description: '',
            issueDate: new Date().toISOString().split('T')[0],
        });
    };

    const handleResolve = (ticketNo: string) => {
        if (window.confirm('Are you sure you want to mark this warning as resolved?')) {
            setLetters(letters.map(l => l.ticketNo === ticketNo ? { ...l, status: 'Resolved' } : l));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Warning Letters</h2>
                <Button variant="primary" onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    + Issue New Letter
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Letters Issued" 
                    value={summary.total} 
                    valueColor="text-gray-900" 
                />
                <StatCard 
                    title="Active Warnings" 
                    value={summary.active} 
                    valueColor="text-red-600" 
                />
                <StatCard 
                    title="Resolved" 
                    value={summary.resolved} 
                    valueColor="text-green-600" 
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Employee Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {letters.length > 0 ? (
                                letters.map((letter) => (
                                    <tr key={letter.ticketNo} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{letter.ticketNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">{letter.employeeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{letter.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(letter.issueDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                letter.status === 'Active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {letter.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {letter.status === 'Active' && (
                                                <button 
                                                    onClick={() => handleResolve(letter.ticketNo)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center text-gray-500 text-base">
                                        No warning letters issued.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Issue Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Warning Letter" maxWidth="max-w-lg">
                <form onSubmit={handleIssueLetter} className="space-y-4">
                    <Input 
                        id="employeeName" 
                        name="employeeName" 
                        label="Employee Name" 
                        value={formData.employeeName} 
                        onChange={handleInputChange} 
                        required 
                    />
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select 
                            id="reason" 
                            name="reason" 
                            value={formData.reason} 
                            onChange={handleInputChange} 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        >
                            <option value="">Select Reason</option>
                            <option value="Misconduct">Misconduct</option>
                            <option value="Poor Performance">Poor Performance</option>
                            <option value="Attendance Issue">Attendance Issue</option>
                            <option value="Policy Violation">Policy Violation</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            id="description" 
                            name="description" 
                            rows={4} 
                            value={formData.description} 
                            onChange={handleInputChange} 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Detailed explanation of the incident..."
                            required
                        />
                    </div>
                    <Input 
                        id="issueDate" 
                        name="issueDate" 
                        label="Issue Date" 
                        type="date" 
                        value={formData.issueDate} 
                        onChange={handleInputChange} 
                        required 
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700">Issue Letter</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WarningLettersView;
