

import React from 'react';
import { ContactConfig, SocialMediaConfig, QuickLink } from '../types';

interface FooterProps { 
  logoSrc: string | null;
  contactInfo: ContactConfig; // New prop
  socialMedia: SocialMediaConfig; // New prop
  quickLinks: QuickLink[]; // New prop
}

const Footer: React.FC<FooterProps> = ({ logoSrc, contactInfo, socialMedia, quickLinks }) => {

  const SocialLink: React.FC<{ href: string | undefined; children?: React.ReactNode; iconSrc: string; altText: string }> = ({ href, iconSrc, altText }) => {
    if (!href) return null;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:opacity-80 transition-opacity">
        <img src={iconSrc} alt={altText} className="w-6 h-6" />
      </a>
    );
  };

  return (
    <footer className="bg-[#191e44] text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              {logoSrc && (
                <img src={logoSrc} alt="Company Logo" className="h-12 w-auto" />
              )}
              <h2 className="text-2xl font-bold ml-4">R K M Career</h2>
            </div>
            <p className="text-gray-400 max-w-md">
              Your trusted partner in finding the right talent and the right opportunities. We bridge the gap between employers and job seekers.
            </p>
          </div>

          {/* Quick Links */}
          {quickLinks && quickLinks.length > 0 && (
            <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                    {quickLinks.map(link => (
                        <li key={link.id}>
                            <a href={link.url} className="hover:text-white" target="_blank" rel="noopener noreferrer">{link.label}</a>
                        </li>
                    ))}
                </ul>
            </div>
          )}

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-gray-400 space-y-2">
              <p>{contactInfo.addressLine1}</p>
              {contactInfo.addressLine2 && <p>{contactInfo.addressLine2}</p>}
              <p>{contactInfo.city}, {contactInfo.state} {contactInfo.pincode}</p>
              <p>{contactInfo.email}</p>
              <p>{contactInfo.phone}</p>
            </address>
            <div className="flex space-x-4 mt-6">
              <SocialLink href={socialMedia.facebook} iconSrc="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" altText="Facebook" />
              <SocialLink href={socialMedia.twitter} iconSrc="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg" altText="X (Twitter)" />
              <SocialLink href={socialMedia.linkedin} iconSrc="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg" altText="LinkedIn" />
              <SocialLink href={socialMedia.instagram} iconSrc="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" altText="Instagram" />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black/20 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} R K M Career. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;