
import React, { useState } from 'react';
import Button from './Button';
import { UserType, HeaderProps } from '../types'; // Import HeaderProps

const Header: React.FC<HeaderProps> = ({ userType, onLoginSelect, onLogout, onHireUsClick, logoSrc, onNavigateHome }) => {
  const isLoggedIn = userType !== UserType.NONE;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#191e44] shadow-md py-3 px-4 md:py-4 md:px-8 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <button onClick={onNavigateHome} className="flex items-center flex-shrink-0 text-left focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md">
          {logoSrc && (
            <img src={logoSrc} alt="Company Logo" className="h-10 w-auto md:h-12" />
          )}
          <h1 className="text-xl md:text-2xl font-bold text-white hidden md:block ml-4">R K M Career</h1>
        </button>
        <nav className="flex items-center">
          {!isLoggedIn ? (
            <>
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={onHireUsClick}
                  className="bg-teal-500 text-white hover:bg-teal-600 justify-center"
                >
                  Hire us for Jobs
                </Button>
                <Button
                  size="sm"
                  onClick={() => onLoginSelect(UserType.TEAM)}
                  className="bg-blue-600 text-white hover:bg-blue-700 justify-center"
                >
                  Team Login
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLoginSelect(UserType.PARTNER)}
                  className="border border-white text-white hover:bg-white/10 justify-center"
                >
                  Partner Login
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLoginSelect(UserType.CANDIDATE)}
                  className="border border-white text-white hover:bg-white/10 justify-center"
                >
                  Candidate Login
                </Button>
              </div>

              {/* Mobile Menu */}
              <div className="md:hidden flex items-center gap-2">
                 <Button
                  size="sm"
                  onClick={onHireUsClick}
                  className="bg-teal-500 text-white hover:bg-teal-600 justify-center text-xs px-2"
                >
                  Hire us
                </Button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white p-2 rounded-md hover:bg-white/10 focus:outline-none"
                  aria-label="Open menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Menu Dropdown */}
              {isMenuOpen && (
                <div className="md:hidden absolute top-full right-4 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in">
                  <a href="#" onClick={(e) => { e.preventDefault(); onLoginSelect(UserType.TEAM); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-100">Team Login</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onLoginSelect(UserType.PARTNER); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Partner Login</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); onLoginSelect(UserType.CANDIDATE); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Candidate Login</a>
                </div>
              )}

            </>
          ) : (
            <div className="flex justify-end items-center gap-2">
              <span className="text-gray-300 font-medium px-3 py-2 rounded-md bg-white/10 flex items-center text-xs sm:text-sm">
                Logged in as: <span className="capitalize ml-1 text-white font-semibold">{userType.toLowerCase()}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-white border border-gray-400 hover:bg-white/10">
                Logout
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
