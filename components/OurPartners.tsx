
import React from 'react';
import { PartnerLogo } from '../types';

interface OurPartnersProps {
  partners: PartnerLogo[];
}

const OurPartners: React.FC<OurPartnersProps> = ({ partners }) => {
  if (!partners || partners.length === 0) {
    return null; // Don't render the section if there are no partners
  }

  // Duplicate partners for a seamless loop
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Our Esteemed Partners</h2>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_20%,_black_80%,transparent_100%)]">
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 animate-scroll">
                {duplicatedPartners.map((partner, index) => (
                    <li key={`${partner.id}-${index}`} className="flex-shrink-0">
                        <img
                          src={partner.logoSrc}
                          alt={partner.name}
                          className="h-12 md:h-14 max-w-none object-contain"
                          title={partner.name}
                        />
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </section>
  );
};

export default OurPartners;
