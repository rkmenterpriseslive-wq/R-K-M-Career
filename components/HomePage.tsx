
import React from 'react';
import Button from './Button';
import { UserType, HomePageProps } from '../types'; // Import HomePageProps
import OurPartners from './OurPartners';

const HomePage: React.FC<HomePageProps> = ({ partners, currentUserType, onLoginSelect, onNavigateToAdminJobBoard, branding, initError, onNavigateToJobs }) => {

  const handleHireBannerClick = () => {
    if (currentUserType === UserType.ADMIN) {
      onNavigateToAdminJobBoard();
    } else {
      // For non-admin users, prompt them to login as a Team/Admin
      onLoginSelect(UserType.TEAM);
    }
  };

  const handlePartnerBannerClick = () => {
    // For non-partner users, prompt them to login as a Partner
    onLoginSelect(UserType.PARTNER);
  };

  return (
    <div className="bg-gray-50 flex-grow">
      {/* Initialization Error Banner */}
      {initError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 sticky top-0 z-40 mx-auto" role="alert">
          <p className="font-bold">Configuration Error</p>
          <p className="text-sm">{initError}</p>
        </div>
      )}
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 md:py-24 text-center overflow-hidden`}>
        <div className="absolute inset-0 bg-hero-pattern opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
        <div className="relative z-10 container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
            Find Your Next Opportunity
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mt-2 max-w-2xl mx-auto">
            Browse our open positions and start your journey with us.
          </p>
          <Button onClick={onNavigateToJobs} variant="primary" className="mt-8 px-12 py-5 text-xl font-bold bg-teal-500 hover:bg-teal-600 shadow-lg transform hover:scale-105 transition-transform">
              Get Your Job
          </Button>
        </div>
      </section>

      {/* Promo Banners Section */}
      <section className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1: Hire Talent / Post a Job */}
          <div
            className="relative h-64 rounded-xl flex items-end justify-start text-white text-left cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            onClick={handleHireBannerClick}
            role="button"
            tabIndex={0}
            aria-label="Post a job or partner with us"
          >
            {branding.hireTalent.backgroundImage ? (
              <img
                key={branding.hireTalent.backgroundImage}
                src={branding.hireTalent.backgroundImage}
                alt="People collaborating in an office"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-700 to-indigo-800"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 p-8 w-full">
              <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-wider text-white uppercase bg-blue-600 rounded-full shadow-sm">
                Promo
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold mb-2 drop-shadow-sm">
                {branding.hireTalent.title}
              </h3>
              <p className="text-lg text-blue-100 max-w-md">
                {branding.hireTalent.description}
              </p>
            </div>
          </div>

          {/* Banner 2: Become a Partner */}
          <div
            className="relative h-64 rounded-xl flex items-end justify-start text-white text-left cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            onClick={handlePartnerBannerClick}
            role="button"
            tabIndex={0}
            aria-label="Become a partner or vendor"
          >
            {branding.becomePartner.backgroundImage ? (
              <img
                key={branding.becomePartner.backgroundImage}
                src={branding.becomePartner.backgroundImage}
                alt="Handshake or business meeting"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600 to-teal-700"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="relative z-10 p-8 w-full">
              <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-wider text-white uppercase bg-green-600 rounded-full shadow-sm">
                Promo
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold mb-2 drop-shadow-sm">
                 {branding.becomePartner.title}
              </h3>
              <p className="text-lg text-green-100 max-w-md">
                 {branding.becomePartner.description}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Partners Section */}
      <div className="my-12">
        <OurPartners partners={partners} />
      </div>
    </div>
  );
};

export default HomePage;