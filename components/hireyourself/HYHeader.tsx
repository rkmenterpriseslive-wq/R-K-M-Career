
import React from 'react';
import { AppUser } from '../../types';
import { HYMenuItem } from './HireYourselfLayout';
import Button from '../Button';

interface HYHeaderProps {
    activeItem: HYMenuItem;
    onItemClick: (item: HYMenuItem) => void;
    onLogout: () => void;
    currentUser: AppUser | null;
}

const HYHeader: React.FC<HYHeaderProps> = ({ activeItem, onItemClick, onLogout, currentUser }) => {
    const menuItems: HYMenuItem[] = ['Home', 'Jobs', 'Plan', 'More', 'Profile'];

    const NavItem: React.FC<{ item: HYMenuItem }> = ({ item }) => {
        const isActive = activeItem === item;
        return (
            <button
                onClick={() => onItemClick(item)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                {item}
            </button>
        );
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-bold text-blue-800">Hire Yourself</h1>
                    <nav className="hidden md:flex items-center gap-2">
                        {menuItems.map(item => <NavItem key={item} item={item} />)}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:block text-sm text-gray-600">
                        Welcome, <span className="font-semibold">{currentUser?.fullName || currentUser?.email}</span>
                    </span>
                    <Button variant="secondary" size="sm" onClick={onLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default HYHeader;
