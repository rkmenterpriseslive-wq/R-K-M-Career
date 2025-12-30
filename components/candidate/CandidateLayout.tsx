
import React, { useState } from 'react';
import CandidateSidebar from './CandidateSidebar';
import Button from '../Button';
import { CandidateLayoutProps } from '../../types';

const CandidateLayout: React.FC<CandidateLayoutProps> = ({ children, onLogout, activeCandidateMenuItem, onCandidateMenuItemClick, currentUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isProfileComplete = currentUser?.profile_complete ?? false;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 relative">
      <CandidateSidebar 
        activeItem={activeCandidateMenuItem} 
        onItemClick={onCandidateMenuItemClick}
        isProfileComplete={isProfileComplete}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 truncate">
              Employee Dashboard
            </h2>
          </div>
          <Button variant="small-light" size="sm" onClick={onLogout} className="flex items-center gap-2 whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CandidateLayout;
