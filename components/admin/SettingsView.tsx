import React, { useState, useEffect, lazy, Suspense } from 'react';
import Input from '../Input';
import Button from '../Button';
import { BrandingConfig, PanelConfig, AppUser, PartnerLogo, QuickLink, ContactConfig, SocialMediaConfig } from '../../types';
import Modal from '../Modal';

// Dynamically import PartnerSettingsView
const PartnerSettingsView = lazy(() => import('./PartnerSettingsView'));
// NEW: Dynamically import new settings views
const QuickLinksSettingsView = lazy(() => import('./QuickLinksSettingsView'));
const ContactSocialSettingsView = lazy(() => import('./ContactSocialSettingsView'));


// --- Sub-components ---

interface SystemRole {
    name: string;
    panel: string;
}

const RoleSettingsView: React.FC<{ 
    systemRoles: SystemRole[]; 
    onUpdateSettings: (update: any) => void;
}> = ({ systemRoles, onUpdateSettings }) => {
    // Local state to ensure immediate UI feedback if props lag
    const [roleName, setRoleName] = useState('');
    const [panel, setPanel] = useState('HR Panel');

    // Ensure we always have an array
    const rolesList = Array.isArray(systemRoles) ? systemRoles : [];

    const handleAddRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName.trim()) {
            alert("Please enter a role name.");
            return;
        }
        
        const newRole = { name: roleName.trim(), panel };
        const updatedRoles = [...rolesList, newRole];
        
        // Optimistically update settings
        onUpdateSettings({ systemRoles: updatedRoles });
        
        setRoleName('');
        setPanel('HR Panel');
    };

    const handleDeleteRole = (index: number) => {
        const updatedRoles = [...rolesList];
        updatedRoles.splice(index, 1);
        onUpdateSettings({ systemRoles: updatedRoles });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Role</h3>
                <form onSubmit={handleAddRole} className="space-y-4">
                    <Input 
                        id="roleName" 
                        label="Role Name" 
                        value={roleName} 
                        onChange={(e) => setRoleName(e.target.value)} 
                        placeholder="e.g., Senior HR"
                        wrapperClassName="mb-0"
                    />
                    <div>
                        <label htmlFor="assignPanel" className="block text-sm font-medium text-gray-700 mb-1">Assign Panel</label>
                        <select 
                            id="assignPanel" 
                            value={panel} 
                            onChange={(e) => setPanel(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="HR Panel">HR Panel</option>
                            <option value="Team Lead Panel">Team Lead Panel</option>
                            <option value="Team Member Panel">Team Member Panel</option>
                            <option value="Partner Panel">Partner Panel</option>
                            <option value="Store Supervisor Panel">Store Supervisor Panel</option>
                            <option value="Admin Panel">Admin Panel</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full justify-center bg-indigo-600 hover:bg-indigo-700">Add Role</Button>
                </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Existing Roles ({rolesList.length})</h3>
                {rolesList.length > 0 ? (
                    <div className="space-y-2">
                        {rolesList.map((role, index) => (
                            <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{role.name}</p>
                                    <p className="text-xs text-gray-500">{role.panel}</p>
                                </div>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteRole(index)}>Delete</Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        No roles added yet.
                    </div>
                )}
            </div>
        </div>
    );
};

// Reusable component for list management (Job Roles, Locations, Stores)
const ListManagementCard: React.FC<{
    title: string;
    items: any[];
    renderItem: (item: any) => React.ReactNode;
    onAddItem: () => void;
    onDeleteItem: (item: any) => void;
}> = ({ title, items, renderItem, onAddItem, onDeleteItem }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-800">{title}</h4>
            <button onClick={onAddItem} className="bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-medium rounded hover:bg-indigo-100 transition-colors">
                + Add New
            </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
            {items && items.length > 0 ? (
                <ul className="space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded group">
                            <span className="text-gray-700">{renderItem(item)}</span>
                            <button onClick={() => onDeleteItem(item)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                    No items added yet.
                </div>
            )}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{
    label: string;
    description?: string;
    enabled: boolean;
    onChange: (val: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b last:border-b-0 border-gray-100">
        <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
            <span
                className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
            />
        </button>
    </div>
);

const PanelOptionsView: React.FC<{ 
    onUpdateSettings: (update: any) => void; 
    locations: string[]; 
    stores: { id: string; name: string; location: string; interviewAddress?: string }[];
    jobRoles: string[];
    panelConfig?: PanelConfig;
}> = ({ onUpdateSettings, locations, stores, jobRoles, panelConfig }) => {
    // --- Config State ---
    const [config, setConfig] = useState<PanelConfig>(panelConfig || { emailNotifications: true, maintenanceMode: false });

    // --- Modal State for Adding Items ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'JobRole' | 'Location' | 'Store'>('JobRole');
    const [newItemValue, setNewItemValue] = useState(''); // For roles and locations
    // For stores, we might need a richer object, but keeping it simple as per screenshot implication
    const [newStoreData, setNewStoreData] = useState({ name: '', location: '', interviewAddress: '' });

    const handleConfigChange = (key: keyof PanelConfig, val: boolean) => {
        const newConfig = { ...config, [key]: val };
        setConfig(newConfig);
        onUpdateSettings({ panelConfig: newConfig });
    };

    const openAddModal = (type: 'JobRole' | 'Location' | 'Store') => {
        setModalType(type);
        setNewItemValue('');
        setNewStoreData({ name: '', location: '', interviewAddress: '' });
        setIsModalOpen(true);
    };

    const handleAddItem = () => {
        if (modalType === 'JobRole') {
            if (newItemValue.trim()) {
                onUpdateSettings({ jobRoles: [...(jobRoles || []), newItemValue.trim()] });
            }
        } else if (modalType === 'Location') {
            if (newItemValue.trim()) {
                onUpdateSettings({ locations: [...(locations || []), newItemValue.trim()] });
            }
        } else if (modalType === 'Store') {
            if (newStoreData.name.trim() && newStoreData.location.trim()) {
                const newStore = { 
                    id: Date.now().toString(), 
                    name: newStoreData.name.trim(), 
                    location: newStoreData.location.trim(),
                    interviewAddress: newStoreData.interviewAddress.trim()
                };
                onUpdateSettings({ stores: [...(stores || []), newStore] });
            }
        }
        setIsModalOpen(false);
    };

    const handleDeleteItem = (type: 'JobRole' | 'Location' | 'Store', item: any) => {
        if (type === 'JobRole') {
            onUpdateSettings({ jobRoles: (jobRoles || []).filter(r => r !== item) });
        } else if (type === 'Location') {
            onUpdateSettings({ locations: (locations || []).filter(l => l !== item) });
        } else if (type === 'Store') {
            onUpdateSettings({ stores: (stores || []).filter(s => s.id !== item.id) });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Panel Configuration</h3>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-2">
                    <ToggleSwitch 
                        label="Email Notifications" 
                        description="Receive emails for new applications."
                        enabled={config.emailNotifications} 
                        onChange={(val) => handleConfigChange('emailNotifications', val)} 
                    />
                    <ToggleSwitch 
                        label="Maintenance Mode" 
                        description="Prevent users from accessing the portal."
                        enabled={config.maintenanceMode} 
                        onChange={(val) => handleConfigChange('maintenanceMode', val)} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ListManagementCard 
                    title="Job Roles" 
                    items={jobRoles} 
                    renderItem={(item) => item}
                    onAddItem={() => openAddModal('JobRole')}
                    onDeleteItem={(item) => handleDeleteItem('JobRole', item)}
                />
                <ListManagementCard 
                    title="Locations" 
                    items={locations} 
                    renderItem={(item) => item}
                    onAddItem={() => openAddModal('Location')}
                    onDeleteItem={(item) => handleDeleteItem('Location', item)}
                />
                <ListManagementCard 
                    title="Store Names" 
                    items={stores} 
                    renderItem={(item) => (
                        <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500">{item.location}</span>
                            {item.interviewAddress && <span className="text-xs text-gray-400 mt-1 truncate" title={item.interviewAddress}>Interview: {item.interviewAddress}</span>}
                        </div>
                    )}
                    onAddItem={() => openAddModal('Store')}
                    onDeleteItem={(item) => handleDeleteItem('Store', item)}
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add New ${modalType === 'JobRole' ? 'Job Role' : modalType}`}>
                <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="space-y-4">
                    {modalType === 'Store' ? (
                        <>
                            <Input id="storeName" label="Store Name" value={newStoreData.name} onChange={(e) => setNewStoreData({...newStoreData, name: e.target.value})} required />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Location</label>
                                <select 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={newStoreData.location}
                                    onChange={(e) => setNewStoreData({...newStoreData, location: e.target.value})}
                                    required
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="interviewAddress" className="block text-sm font-medium text-gray-700 mb-1">Interview Address (Optional)</label>
                                <textarea
                                    id="interviewAddress"
                                    rows={3}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={newStoreData.interviewAddress}
                                    onChange={(e) => setNewStoreData({...newStoreData, interviewAddress: e.target.value})}
                                    placeholder="Full address for walk-in interviews at this store."
                                />
                            </div>
                        </>
                    ) : (
                        <Input 
                            id="newItem" 
                            label={`New ${modalType}`} 
                            value={newItemValue} 
                            onChange={(e) => setNewItemValue(e.target.value)} 
                            placeholder={`Enter ${modalType} name`} 
                            required 
                        />
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Add</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const BrandingSettingsView: React.FC<{
  branding: BrandingConfig;
  onUpdateBranding: (branding: BrandingConfig) => void;
  currentLogoSrc: string | null;
  onLogoUpload: (base64: string) => void;
}> = ({ branding, onUpdateBranding, currentLogoSrc, onLogoUpload }) => {
    const [currentBranding, setCurrentBranding] = useState(branding);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name.includes('.')) {
          const [section, field] = name.split('.');
          setCurrentBranding(prev => ({
            ...prev,
            [section]: { ...(prev[section as keyof BrandingConfig] as any), [field]: value },
          }));
      } else {
          setCurrentBranding(prev => ({ ...prev, [name]: value }));
      }
    };
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const [section, field] = name.split('.');
                setCurrentBranding(prev => ({
                    ...prev,
                    [section]: { ...(prev[section as keyof BrandingConfig] as any), [field]: reader.result as string },
                }));
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const handleLogoUploadInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // FIX: Corrected a typo where `files[0]` was used instead of `file` to read the uploaded logo file, causing a reference error.
                onLogoUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
      onUpdateBranding(currentBranding);
      alert('Branding settings saved!');
    };
  
    return (
      <div className="space-y-10">
        {/* Portal Logo & Name */}
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Portal Logo & Name</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portal Logo</label>
                    <div className="flex items-center gap-4">
                        <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors">
                            Choose file
                            <input type="file" accept="image/*" onChange={handleLogoUploadInternal} className="hidden" />
                        </label>
                        <span className="text-sm text-gray-500">{currentLogoSrc ? "Logo uploaded" : "No file chosen"}</span>
                        {currentLogoSrc && <img src={currentLogoSrc} alt="Preview" className="h-10 w-auto object-contain border p-1 rounded bg-white" />}
                    </div>
                </div>
                <Input id="portalName" label="Portal Name" name="portalName" value={currentBranding.portalName} onChange={handleChange} wrapperClassName="mb-0" />
            </div>
        </div>

        {/* Hire Top Talent Banner */}
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Hire Top Talent Banner</h3>
            <div className="space-y-4">
                <Input id="hire.title" name="hireTalent.title" label="Title" value={currentBranding.hireTalent.title} onChange={handleChange} wrapperClassName="mb-0" />
                <Input id="hire.description" name="hireTalent.description" label="Description" value={currentBranding.hireTalent.description} onChange={handleChange} wrapperClassName="mb-0" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                        <div className="flex items-center gap-4">
                            <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors">
                                Choose file
                                <input type="file" name="hireTalent.backgroundImage" onChange={handleFileChange} className="hidden" />
                            </label>
                            <span className="text-sm text-gray-500">{currentBranding.hireTalent.backgroundImage ? "Image selected" : "No file chosen"}</span>
                            {currentBranding.hireTalent.backgroundImage && <img src={currentBranding.hireTalent.backgroundImage} alt="Preview" className="h-10 w-20 object-cover rounded border" />}
                        </div>
                    </div>
                    <Input id="hire.link" name="hireTalent.link" label="Page Link" value={currentBranding.hireTalent.link} onChange={handleChange} wrapperClassName="mb-0" />
                </div>
            </div>
        </div>

        {/* Become a Partner Banner */}
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Become a Partner Banner</h3>
            <div className="space-y-4">
                <Input id="partner.title" name="becomePartner.title" label="Title" value={currentBranding.becomePartner.title} onChange={handleChange} wrapperClassName="mb-0" />
                <Input id="partner.description" name="becomePartner.description" label="Description" value={currentBranding.becomePartner.description} onChange={handleChange} wrapperClassName="mb-0" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                        <div className="flex items-center gap-4">
                            <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md cursor-pointer text-sm font-semibold transition-colors">
                                Choose file
                                <input type="file" name="becomePartner.backgroundImage" onChange={handleFileChange} className="hidden" />
                            </label>
                            <span className="text-sm text-gray-500">{currentBranding.becomePartner.backgroundImage ? "Image selected" : "No file chosen"}</span>
                            {currentBranding.becomePartner.backgroundImage && <img src={currentBranding.becomePartner.backgroundImage} alt="Preview" className="h-10 w-20 object-cover rounded border" />}
                        </div>
                    </div>
                    <Input id="partner.link" name="becomePartner.link" label="Page Link" value={currentBranding.becomePartner.link} onChange={handleChange} wrapperClassName="mb-0" />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">Save Branding</Button>
        </div>
      </div>
    );
};

// --- New Component for Team & Roles ---
// Updated to accept actual team members data
const TeamAndRolesView: React.FC<{ onOpenAddModal: () => void; teamMembers: any[] }> = ({ onOpenAddModal, teamMembers }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Manage Team & Roles</h3>
                <Button onClick={onOpenAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Add Team Member
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Manager</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Salary</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teamMembers.length > 0 ? teamMembers.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {member.fullName || member.teamMember}
                                        <div className="text-xs text-gray-500">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.reportingManager || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.salary || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 text-sm">
                                        No team members added yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- New Component for Permissions ---

interface PermissionRow {
    feature: string;
    hr: boolean;
    teamLead: boolean;
    teamMember: boolean;
    partner: boolean;
}

const INITIAL_PERMISSIONS: PermissionRow[] = [
    { feature: 'Manage Job Board', hr: true, teamLead: false, teamMember: false, partner: false },
    { feature: 'Vendor Directory', hr: true, teamLead: true, teamMember: false, partner: false },
    { feature: 'Demo Requests', hr: false, teamLead: false, teamMember: false, partner: false },
    { feature: 'Revenue', hr: false, teamLead: false, teamMember: false, partner: false },
];

const PermissionsSettingsView: React.FC = () => {
    // ... (unchanged)
    const [permissions, setPermissions] = useState<PermissionRow[]>(INITIAL_PERMISSIONS);

    const handleToggle = (index: number, role: keyof PermissionRow) => {
        if (role === 'feature') return;
        const newPermissions = [...permissions];
        newPermissions[index] = { ...newPermissions[index], [role]: !newPermissions[index][role] };
        setPermissions(newPermissions);
    };

    const handleSavePermissions = () => {
        alert("Permissions saved successfully!");
        // In a real app, you would save this to the backend
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Page Access Permissions</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Page / Feature</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">HR</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Team Lead</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Team Member</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Partner</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {permissions.map((row, index) => (
                                <tr key={row.feature} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.feature}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={row.hr} 
                                            onChange={() => handleToggle(index, 'hr')} 
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={row.teamLead} 
                                            onChange={() => handleToggle(index, 'teamLead')} 
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={row.teamMember} 
                                            onChange={() => handleToggle(index, 'teamMember')} 
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={row.partner} 
                                            onChange={() => handleToggle(index, 'partner')} 
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <Button onClick={handleSavePermissions} className="bg-blue-600 hover:bg-blue-700 text-white">Save Permissions</Button>
                </div>
            </div>
        </div>
    );
};

// ... (MyAccountView - unchanged)
const MyAccountView: React.FC<{ currentUser?: AppUser | null }> = ({ currentUser }) => {
    // ... (unchanged)
    // Initialization now uses data from currentUser prop
    const [profile, setProfile] = useState({
        fullName: currentUser?.fullName || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfile({
                fullName: currentUser.fullName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || ''
            });
        }
    }, [currentUser]);


    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Profile information updated (Demo).');
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert("New passwords do not match.");
            return;
        }
        alert('Password changed successfully (Demo).');
        setPasswords({ current: '', new: '', confirm: '' });
    };

    // Get initial for avatar
    const initial = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || 'U');

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
                {/* Left Column: Avatar & Photo */}
                <div className="md:col-span-1 flex flex-col items-center pt-12 px-8 border-b md:border-b-0 md:border-r border-gray-200">
                    <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-6xl font-bold border-4 border-white shadow-md mb-6">
                        {initial}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{profile.fullName}</h3>
                    <p className="text-gray-500 capitalize mb-6">{currentUser?.userType?.toLowerCase() || 'Admin'}</p>
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors text-sm">
                        Change Photo
                    </button>
                </div>

                {/* Right Column: Forms */}
                <div className="md:col-span-2 p-8 space-y-10">
                    {/* Personal Information */}
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                        <div className="space-y-4">
                            <Input 
                                id="fullName" 
                                name="fullName" 
                                label="Full Name" 
                                value={profile.fullName} 
                                onChange={handleProfileChange} 
                                wrapperClassName="mb-0"
                            />
                            <Input 
                                id="email" 
                                name="email" 
                                label="Email Address" 
                                type="email" 
                                value={profile.email} 
                                onChange={handleProfileChange} 
                                disabled 
                                className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                wrapperClassName="mb-0"
                            />
                            <Input 
                                id="phone" 
                                name="phone" 
                                label="Phone Number" 
                                type="tel" 
                                value={profile.phone} 
                                onChange={handleProfileChange} 
                                wrapperClassName="mb-0"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                        </div>
                    </form>

                    <div className="border-t border-gray-100"></div>

                    {/* Change Password */}
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                        <div className="space-y-4">
                            <Input 
                                id="currentPassword" 
                                name="current" 
                                label="Current Password" 
                                type="password" 
                                value={passwords.current} 
                                onChange={handlePasswordChange} 
                                wrapperClassName="mb-0"
                            />
                            <Input 
                                id="newPassword" 
                                name="new" 
                                label="New Password" 
                                type="password" 
                                value={passwords.new} 
                                onChange={handlePasswordChange} 
                                wrapperClassName="mb-0"
                            />
                            <Input 
                                id="confirmPassword" 
                                name="confirm" 
                                label="Confirm New Password" 
                                type="password" 
                                value={passwords.confirm} 
                                onChange={handlePasswordChange} 
                                wrapperClassName="mb-0"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Change Password</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Main Settings View ---

interface SettingsViewProps {
    branding: BrandingConfig;
    onUpdateBranding: (branding: BrandingConfig) => void;
    onUpdateSettings: (update: any) => void;
    vendors: any[];
    jobRoles: string[];
    systemRoles?: SystemRole[]; // New prop for system roles
    locations: string[];
    stores: { id: string; name: string; location: string }[];
    partnerLogos: PartnerLogo[];
    panelConfig?: PanelConfig; // New prop
    currentUser?: AppUser | null; // Added prop
    currentLogoSrc: string | null;
    onLogoUpload: (base64: string) => void;
    onOpenAddTeamMemberModal: () => void;
    teamMembers?: any[]; // New prop for team list
    // NEW: Added props for Quick Links, Contact Info, Social Media
    quickLinks: QuickLink[];
    contactInfo: ContactConfig;
    socialMedia: SocialMediaConfig;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    onUpdateBranding, branding, onUpdateSettings, vendors, jobRoles, systemRoles, locations, stores, partnerLogos, panelConfig, currentUser, currentLogoSrc, onLogoUpload, onOpenAddTeamMemberModal, teamMembers = [],
    quickLinks, contactInfo, socialMedia // NEW: Destructure new settings props
}) => {
    // NEW: Added new tabs
    const [activeTab, setActiveTab] = useState('Team & Roles');
    const tabs = ['Team & Roles', 'Permissions', 'Role', 'Panel Options', 'Quick Links', 'Contact Us & Social Media', 'Partners', 'My Account', 'Branding'];

    const renderTabContent = () => {
        switch(activeTab) {
            case 'Team & Roles': 
                return <TeamAndRolesView onOpenAddModal={onOpenAddTeamMemberModal} teamMembers={teamMembers} />;
            case 'Permissions':
                return <PermissionsSettingsView />;
            case 'Role': 
                return <RoleSettingsView onUpdateSettings={onUpdateSettings} systemRoles={systemRoles || []} />;
            case 'Panel Options':
                return <PanelOptionsView 
                    onUpdateSettings={onUpdateSettings} 
                    locations={locations} 
                    stores={stores} 
                    jobRoles={jobRoles} 
                    panelConfig={panelConfig}
                />;
            case 'Quick Links': // NEW: Render QuickLinksSettingsView
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <QuickLinksSettingsView quickLinks={quickLinks} onUpdateSettings={onUpdateSettings} />
                    </Suspense>
                );
            case 'Contact Us & Social Media': // NEW: Render ContactSocialSettingsView
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <ContactSocialSettingsView contactInfo={contactInfo} socialMedia={socialMedia} onUpdateSettings={onUpdateSettings} />
                    </Suspense>
                );
            case 'Partners':
                return (
                    <Suspense fallback={<div>Loading...</div>}>
                        <PartnerSettingsView partnerLogos={partnerLogos} onUpdateSettings={onUpdateSettings} />
                    </Suspense>
                );
            case 'My Account':
                return <MyAccountView currentUser={currentUser} />;
            case 'Branding': 
                return <BrandingSettingsView 
                    branding={branding} 
                    onUpdateBranding={onUpdateBranding} 
                    currentLogoSrc={currentLogoSrc} 
                    onLogoUpload={onLogoUpload} 
                />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Settings</h2>
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-1 px-4 pt-2 overflow-x-auto" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-150 ${
                                    activeTab === tab 
                                    ? 'border-blue-600 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6">
                    {renderTabContent()}
                </div>
             </div>
        </div>
    );
};

export default SettingsView;