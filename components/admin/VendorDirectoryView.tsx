

import React, { useState } from 'react';
import Button from '../Button';
import { Vendor } from '../../types';

interface VendorDirectoryViewProps {
    vendors: Vendor[];
    onUpdateSettings: (settings: { vendors: Vendor[] }) => void;
    availableLocations?: string[];
    availableJobRoles?: string[];
    onAddNewVendorClick: () => void;
    onEditVendorClick: (vendor: Vendor) => void;
}

export const VendorDirectoryView: React.FC<VendorDirectoryViewProps> = ({ 
    vendors, 
    onUpdateSettings,
    onAddNewVendorClick,
    onEditVendorClick
}) => {
    const handleDelete = (id: string) => {
        if(window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
             const currentVendors = Array.isArray(vendors) ? vendors : [];
             onUpdateSettings({ vendors: currentVendors.filter(v => v.id !== id) });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Vendor Directory</h2>
                <Button variant="primary" onClick={onAddNewVendorClick} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Vendor
                </Button>
            </div>

            {(!vendors || vendors.length === 0) ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center shadow-sm min-h-[400px]">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No vendors found</h3>
                    <p className="text-gray-500">Get started by adding a new vendor to the directory.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Brand Name(s)</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{Array.isArray(vendor.brandNames) ? vendor.brandNames.join(', ') : ''}</div>
                                            <div className="text-xs text-gray-500">{vendor.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">{vendor.partnerName || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{vendor.phone}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]" title={vendor.address}>{vendor.address || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {vendor.locations ? vendor.locations.join(', ') : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => onEditVendorClick(vendor)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                            <button onClick={() => handleDelete(vendor.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};