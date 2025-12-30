import React, { useState } from 'react';
import { QuickLink } from '../../types';
import Input from '../Input';
import Button from '../Button';
import Modal from '../Modal';

interface QuickLinksSettingsViewProps {
    quickLinks: QuickLink[];
    onUpdateSettings: (update: { quickLinks: QuickLink[] }) => void;
}

const QuickLinksSettingsView: React.FC<QuickLinksSettingsViewProps> = ({ quickLinks, onUpdateSettings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
    const [linkFormData, setLinkFormData] = useState({ label: '', url: '' });

    const handleOpenModal = (link: QuickLink | null) => {
        setEditingLink(link);
        setLinkFormData(link ? { label: link.label, url: link.url } : { label: '', url: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLink(null);
        setLinkFormData({ label: '', url: '' });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLinkFormData({ ...linkFormData, [e.target.name]: e.target.value });
    };

    const handleSaveLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkFormData.label.trim() || !linkFormData.url.trim()) {
            alert('Both label and URL are required.');
            return;
        }

        const newLink: QuickLink = {
            id: editingLink ? editingLink.id : `ql_${Date.now()}`,
            label: linkFormData.label.trim(),
            url: linkFormData.url.trim(),
        };

        let updatedLinks;
        if (editingLink) {
            updatedLinks = quickLinks.map(link => link.id === newLink.id ? newLink : link);
        } else {
            updatedLinks = [...quickLinks, newLink];
        }

        onUpdateSettings({ quickLinks: updatedLinks });
        handleCloseModal();
    };

    const handleDeleteLink = (id: string) => {
        if (window.confirm('Are you sure you want to delete this quick link?')) {
            const updatedLinks = quickLinks.filter(link => link.id !== id);
            onUpdateSettings({ quickLinks: updatedLinks });
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Manage Quick Links</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <p className="text-lg font-medium text-gray-800">All Quick Links</p>
                    <Button variant="primary" size="sm" onClick={() => handleOpenModal(null)}>+ Add New Link</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Label</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">URL</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quickLinks && quickLinks.length > 0 ? (
                                quickLinks.map(link => (
                                    <tr key={link.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{link.label}</td>
                                        <td className="px-6 py-4 text-sm text-blue-600 hover:underline"><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(link)}>Edit</Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteLink(link.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">No quick links configured yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLink ? 'Edit Quick Link' : 'Add New Quick Link'}>
                <form onSubmit={handleSaveLink} className="space-y-4">
                    <Input
                        id="link-label"
                        name="label"
                        label="Link Label"
                        value={linkFormData.label}
                        onChange={handleFormChange}
                        required
                    />
                    <Input
                        id="link-url"
                        name="url"
                        label="URL"
                        type="url"
                        value={linkFormData.url}
                        onChange={handleFormChange}
                        placeholder="https://example.com"
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Link</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default QuickLinksSettingsView;