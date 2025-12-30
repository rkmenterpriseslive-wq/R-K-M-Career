
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Input from '../Input';
import Button from '../Button';
// FIX: Imported `initialBreakdown` from `salaryService` where it's defined, instead of from `types`.
import { SalaryRule, CTCBreakdown, Vendor } from '../../types';
import { calculateBreakdownFromRule, initialBreakdown } from '../../utils/salaryService';


// Add this line to inform TypeScript about the global html2pdf function
declare const html2pdf: any;

interface GenerateOfferLetterViewProps {
    portalName: string;
    logoSrc: string | null;
    salaryRules: SalaryRule[];
    candidates: any[];
    onOfferGenerated: (candidateId: string) => void;
    initialCandidateData?: any | null;
    vendors: Vendor[];
}

// --- Helper Functions ---
const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return '';
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + units[n % 10] : '');
        return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };
    
    let words = '';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;

    if (crore > 0) words += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) words += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) words += convertLessThanThousand(thousand) + ' Thousand ';
    if (rest > 0) words += convertLessThanThousand(rest);
    
    return words.trim();
};

const getDayWithSuffix = (day: number): string => {
    if (day > 3 && day < 21) return day + 'th'; // 4th to 20th
    switch (day % 10) {
        case 1: return day + 'st';
        case 2: return day + 'nd';
        case 3: return day + 'rd';
        default: return day + 'th';
    }
};

const formatOfferDate = (dateString: string) => {
    if (!dateString) return "[Date]";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "[Invalid Date]";
    
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    return `${getDayWithSuffix(day)} ${month} ${year}`;
};


// --- Sub-components for the Letter ---
interface LetterHeaderProps {
    portalName: string;
    logoSrc: string | null;
}

const LetterHeader: React.FC<LetterHeaderProps> = ({ portalName, logoSrc }) => (
    <div className="relative h-28 flex items-center text-blue-900 font-serif bg-white overflow-hidden">
        {/* Dark blue diagonal graphic */}
        <div className="absolute top-0 left-0 h-full w-full bg-[#191e44] z-0"
             style={{ 
                 // This clip-path creates a top-left triangle that matches the letterhead image.
                 // Points: (0% 0%, 30% 0%, 0% 100%) -> top-left, 30% across top, bottom-left.
                 clipPath: 'polygon(0% 0%, 30% 0%, 0% 100%)' 
             }} 
        />
        
        {/* Logo Container (on top of the dark blue triangle) */}
        <div className="relative z-10 flex-shrink-0 ml-6">
            {logoSrc ? (
                <img src={logoSrc} alt="Company Logo" className="w-20 h-20 object-contain rounded-full bg-white p-1 shadow-md" />
            ) : (
                <div className="w-20 h-20 bg-white border-2 border-blue-900 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-4xl font-bold">{portalName.charAt(0)}</span>
                </div>
            )}
        </div>

        {/* Company Name (pushed to the right) */}
        <h2 className="relative z-10 ml-auto pr-6 text-4xl font-bold text-blue-900 tracking-wider">
            {portalName}
        </h2>
    </div>
);

const LetterFooter: React.FC = () => (
    <div className="relative h-20 bg-[#191e44] text-white flex items-center px-6 text-xs font-serif overflow-hidden">
        {/* Light blue diagonal graphic on the right */}
        <div className="absolute top-0 right-0 h-full w-1/3 bg-[#3498db] z-0"
             style={{ 
                 // Adjusted clip-path to match the image: wider stripe, starting higher, ending lower on the right
                 clipPath: 'polygon(70% 0%, 100% 0%, 100% 100%, 50% 100%)'
             }}
        />
        <div className="relative z-10">
            <p>Regd. Office:- Plot No 727 Razapur Shastri Nagar Ghaziabad, UP 201001</p>
            <p>E-Mail:- info@rkm-enterprises.com, Phone no.- +91 9616411654, CIN:- U74999UP2022PTC164246</p>
        </div>
    </div>
);


const BreakdownTable: React.FC<{breakdown: CTCBreakdown, candidateName: string, doj: string}> = ({ breakdown, candidateName, doj }) => {
    // This is a direct replication of the image's table structure.
    return (
        <div className="text-xs">
            <h2 className="text-center font-bold text-2xl mb-2">ANNEXURE-A</h2>
            <table className="w-full border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-center font-bold" colSpan={3}>CTC Breakup</th>
                    </tr>
                    <tr>
                        <th className="border border-black p-1 text-left font-semibold">{candidateName || "[Candidate Name]"}</th>
                        <th className="border border-black p-1 text-right font-semibold" colSpan={2}>
                           DOJ: {doj ? formatOfferDate(doj) : "[Date of Joining]"}
                        </th>
                    </tr>
                    <tr className="font-semibold text-center">
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1">Monthly</td>
                        <td className="border border-black p-1">Yearly</td>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className="border border-black p-1 font-bold">Basic</td><td className="border border-black p-1 text-center">{breakdown.monthly.basic.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.basic.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold">HRA</td><td className="border border-black p-1 text-center">{breakdown.monthly.hra.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.hra.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold">Conveyance Allowance</td><td className="border border-black p-1 text-center">{breakdown.monthly.conveyance.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.conveyance.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold">Medical Allowance</td><td className="border border-black p-1 text-center">{breakdown.monthly.medical.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.medical.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold">Statutory Bonus</td><td className="border border-black p-1 text-center">{breakdown.monthly.statutoryBonus.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.statutoryBonus.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold">Special Allowance</td><td className="border border-black p-1 text-center">{breakdown.monthly.specialAllowance.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.specialAllowance.toFixed(0)}</td></tr>
                    <tr className="font-bold"><td className="border border-black p-1">Gross</td><td className="border border-black p-1 text-center">{breakdown.monthly.gross.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.gross.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold" colSpan={3}>Deduction</td></tr>
                    <tr><td className="border border-black p-1 font-bold">PF Employee</td><td className="border border-black p-1 text-center">{breakdown.monthly.employeePF.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.employeePF.toFixed(0)}</td></tr>
                    {breakdown.monthly.employeeESI > 0 && <tr><td className="border border-black p-1 font-bold">ESIC Employee</td><td className="border border-black p-1 text-center">{breakdown.monthly.employeeESI.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.employeeESI.toFixed(0)}</td></tr>}
                    <tr className="font-bold"><td className="border border-black p-1">Take Home</td><td className="border border-black p-1 text-center">{breakdown.monthly.netSalary.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.netSalary.toFixed(0)}</td></tr>
                    <tr><td className="border border-black p-1 font-bold" colSpan={3}>Contribution</td></tr>
                    <tr><td className="border border-black p-1 font-bold">PF Employer</td><td className="border border-black p-1 text-center">{breakdown.monthly.employerPF.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.employerPF.toFixed(0)}</td></tr>
                    {breakdown.monthly.employerESI > 0 && <tr><td className="border border-black p-1 font-bold">ESIC Employer</td><td className="border border-black p-1 text-center">{breakdown.monthly.employerESI.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.employerESI.toFixed(0)}</td></tr>}
                    <tr className="font-bold"><td className="border border-black p-1">CTC</td><td className="border border-black p-1 text-center">{breakdown.monthly.ctc.toFixed(0)}</td><td className="border border-black p-1 text-center">{breakdown.annual.ctc.toFixed(0)}</td></tr>
                </tbody>
            </table>
            <p className="text-center font-bold mt-2 text-xs">*** The monthly pay slips will be made available electronically***</p>
        </div>
    );
};


const GenerateOfferLetterView: React.FC<GenerateOfferLetterViewProps> = ({ portalName, logoSrc, salaryRules, candidates, onOfferGenerated, initialCandidateData, vendors }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        candidateName: '',
        email: '',
        offerDate: today,
        jobTitle: '',
        startDate: '',
        partnerName: 'Organic Circle Pvt. Ltd.',
        annualCTC: '',
    });
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [breakdown, setBreakdown] = useState<CTCBreakdown>(initialBreakdown);
    const [isDownloading, setIsDownloading] = useState(false);
    const letterContentRef = useRef<HTMLDivElement>(null);
    const totalPages = 3; // Hardcoded for this letter structure

    const selectedCandidates = useMemo(() => {
        return (candidates || []).filter(c => c.stage === 'Selected' && c.status !== 'Joined' && c.status !== 'Offer Released');
    }, [candidates]);

    const brandToPartnerMap = useMemo(() => {
        const map = new Map<string, string>();
        (vendors || []).forEach(vendor => {
            if (vendor.partnerName) {
                (vendor.brandNames || []).forEach(brand => {
                    map.set(brand, vendor.partnerName!);
                });
            }
        });
        return map;
    }, [vendors]);

    useEffect(() => {
        const ctc = parseFloat(formData.annualCTC);
        const selectedRule = salaryRules.find(r => r.designation === formData.jobTitle);
        setBreakdown(calculateBreakdownFromRule(ctc, selectedRule));
    }, [formData.annualCTC, formData.jobTitle, salaryRules]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClearForm = () => {
        setFormData({
            candidateName: '',
            email: '',
            offerDate: today,
            jobTitle: '',
            startDate: '',
            partnerName: 'Organic Circle Pvt. Ltd.',
            annualCTC: '',
        });
        setSelectedCandidateId(null);
    };
    
    const handleCandidateSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const candidateId = e.target.value;
        const selected = selectedCandidates.find(c => c.id === candidateId);

        if (selected) {
            const partnerName = brandToPartnerMap.get(selected.vendor) || selected.vendor || 'Organic Circle Pvt. Ltd.';
            setFormData(prev => ({
                ...prev,
                candidateName: selected.name || '',
                email: selected.email || '',
                jobTitle: selected.role || '',
                partnerName: partnerName,
                // Reset fields that need new input
                startDate: '',
                annualCTC: '',
            }));
            setSelectedCandidateId(selected.id);
        } else {
            handleClearForm();
        }
    };

    useEffect(() => {
        // This effect runs when a candidate is passed from the Selected Candidates page
        if (initialCandidateData) {
            const partnerName = brandToPartnerMap.get(initialCandidateData.vendor) || initialCandidateData.vendor || 'Organic Circle Pvt. Ltd.';

            setFormData(prev => ({
                ...prev,
                candidateName: initialCandidateData.name || '',
                email: initialCandidateData.email || '',
                jobTitle: initialCandidateData.role || '',
                partnerName: partnerName,
                // Reset fields that need new input for this specific candidate
                startDate: '',
                annualCTC: '',
            }));
            setSelectedCandidateId(initialCandidateData.id);
        }
    }, [initialCandidateData, brandToPartnerMap]);

    const handleDownloadPdf = () => {
        if (!letterContentRef.current) return;
        if (!selectedCandidateId) {
            alert("Please select a candidate from the dropdown before downloading.");
            return;
        }

        setIsDownloading(true);

        const element = letterContentRef.current;
        const opt = {
            margin:       [0.5, 0.5, 0.5, 0.5],
            filename:     `Offer_Letter_${formData.candidateName.replace(/\s+/g, '_') || 'Candidate'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save().then(() => {
            setIsDownloading(false);
            if(selectedCandidateId) {
                onOfferGenerated(selectedCandidateId);
            }
            handleClearForm();
        });
    };

    const selectStyles = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6">
            <style>{`
                @media print {
                    .no-print { display: none; }
                    .page { page-break-after: always; }
                }
                .letter-preview { font-family: 'Times New Roman', Times, serif; color: #000; font-size: 12pt; line-height: 1.5; }
                .letter-preview h1, .letter-preview h2, .letter-preview h3, .letter-preview strong { font-weight: bold; }
                .letter-preview .page { min-height: 10.5in; display: flex; flex-direction: column; padding: 0.5in; box-sizing: border-box; }
                .letter-preview .page:last-child { page-break-after: avoid; }
            `}</style>
            <h2 className="text-3xl font-bold text-gray-800">Generate Offer Letter</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Panel */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit sticky top-6 no-print">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Offer Letter Details</h2>
                    <form className="space-y-4 text-sm">
                        <div>
                            <label htmlFor="candidate-select" className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
                            <select
                                id="candidate-select"
                                value={selectedCandidateId || ''}
                                onChange={handleCandidateSelectionChange}
                                className={selectStyles}
                                required
                            >
                                <option value="">Select a Candidate...</option>
                                {selectedCandidates.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                ))}
                            </select>
                        </div>
                        <Input id="email" name="email" label="Candidate Email" type="email" value={formData.email} onChange={handleChange} required disabled className="bg-gray-100" />
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <select id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={`${selectStyles} bg-gray-100`} required disabled>
                                <option value="">Select a designation</option>
                                {(salaryRules || []).map(rule => (<option key={rule.designation} value={rule.designation}>{rule.designation}</option>))}
                            </select>
                        </div>
                        <Input id="annualCTC" name="annualCTC" label="Annual CTC (₹)" type="number" value={formData.annualCTC} onChange={handleChange} required />
                        <Input id="startDate" name="startDate" label="Joining Date" type="date" value={formData.startDate} onChange={handleChange} required />
                        <Input id="partnerName" name="partnerName" label="Partner Name" value={formData.partnerName} onChange={handleChange} disabled className="bg-gray-100" />
                        <div className="pt-4 flex gap-2">
                           <Button type="button" variant="secondary" className="w-full justify-center" onClick={handleClearForm}>Clear Form</Button>
                           <Button type="button" variant="primary" className="w-full justify-center" onClick={handleDownloadPdf} loading={isDownloading} disabled={!selectedCandidateId}>Download PDF</Button>
                        </div>
                    </form>
                </div>

                {/* Letter Preview Panel */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div ref={letterContentRef} className="letter-preview">
                        {/* --- PAGE 1 --- */}
                        <div className="page">
                            <LetterHeader portalName={portalName} logoSrc={logoSrc} />
                            <h1 className="text-center font-bold text-xl my-4 underline">OFFER LETTER</h1>
                            <div className="grid grid-cols-2 gap-4 my-4">
                                <div><strong>DATE:</strong> {formatOfferDate(formData.offerDate)}</div>
                                <div className="text-right">
                                    <p><strong>NAME:</strong> {formData.candidateName || "[Candidate Name]"}</p>
                                    <p><strong>EMAIL:</strong> {formData.email || "[Candidate Email]"}</p>
                                </div>
                            </div>
                            <p className="mt-4"><strong>DEAR {formData.candidateName ? formData.candidateName.toUpperCase() : "[CANDIDATE NAME]"},</strong></p>
                            <p>With reference to the discussions we had, we are pleased to offer you the position of “<strong>{formData.jobTitle || "[Job Title]"}</strong>” with <strong>R K M enterprises.</strong></p>
                            <p>You are expected to join on “<strong>{formData.startDate ? formatOfferDate(formData.startDate) : "[Joining Date]"}</strong>”, failing which, Prime Hire Services Pvt. Ltd. reserves the right to rescind this letter. Your employment will be confirmed upon successful completion of a probation period of <strong>Three months (the same will be communicated to you via mail/letter)</strong>. During the probation period, your employment can be terminated on an immediate basis if your performance does not meet the expected standard or there are discipline/insubordination issues faced from your end.</p>
                            <p className="font-bold mt-4">After the completion of probation period:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Your daily attendance will be subject to achievement of specified minimum sales on that day which is considered as Qualified Working Day. Exact criteria of minimum sales will be communicated to you in advance from time to time through WhatsApp groups basis company's decision.</li>
                                <li>The contract shall be terminable by either party giving 12 working days (Qualified working days – as per minimum sales criteria) notice in writing or salary in lieu of notice during the contract period.</li>
                                <li>In case of any misconduct or non-performance at any time during the period of your service with us, we reserve the right to terminate your services without any pay and prior intimation.</li>
                            </ul>
                            <p className="mt-4">Your Annual Cost to Company (CTC) will be “<strong>{formatCurrency(parseFloat(formData.annualCTC) || 0)}” ({numberToWords(parseFloat(formData.annualCTC) || 0)} Only)</strong> as detailed in Annexure “A” and your work location will be required to work onsite as per the partner requirement ({formData.partnerName || '[Partner Name]'}).</p>
                            <p className="text-right mt-auto text-xs font-semibold text-gray-700">Page 1 of {totalPages}</p>
                        </div>

                        {/* --- PAGE 2 --- */}
                        <div className="page">
                            <LetterHeader portalName={portalName} logoSrc={logoSrc} />
                            <div className="flex-grow pt-8">
                                <p>Within seven (7) days of accepting our offer, please send us a copy of your resignation letter/mail, duly accepted by your current organization (not applicable to fresher’s).</p>
                                <p>You are required to acknowledge this mail within 24 hours failing which this letter stands null and void. We welcome you to PHI family and look forward to a long and fruitful association.</p>
                                <p className="mt-8">Sincerely,</p>
                                <div className="mt-16 space-y-2">
                                    <p className="font-bold">R KM ENTERPRISES</p>
                                    <p><strong>Head HR (Officiating)</strong></p>
                                </div>
                                <div className="mt-24 pt-8">
                                    <p className="border-t border-black pt-2"><strong>Name and Signature of Employee</strong></p>
                                </div>
                            </div>
                            <p className="text-right mt-auto text-xs font-semibold text-gray-700">Page 2 of {totalPages}</p>
                        </div>
                        
                        {/* --- PAGE 3 --- */}
                        {breakdown.annual.ctc > 0 && (
                            <div className="page">
                                <LetterHeader portalName={portalName} logoSrc={logoSrc} />
                                <div className="flex-grow pt-4">
                                    <BreakdownTable breakdown={breakdown} candidateName={formData.candidateName} doj={formData.startDate} />
                                    <div className="mt-16">
                                        <p><strong>ACCEPTANCE:</strong></p>
                                        <p>I have read and understood the above terms and conditions of employment and hereby signify my acceptance of the same.</p>
                                        <div className="mt-24 pt-8">
                                            <p className="border-t border-black pt-2"><strong>Name and Signature of Employee</strong></p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-right mt-auto text-xs font-semibold text-gray-700">Page 3 of {totalPages}</p>
                            </div>
                        )}
                    </div>
                    {/* Fixed Footer for all pages, outside the scrollable content */}
                    <LetterFooter />
                </div>
            </div>
        </div>
    );
};

export default GenerateOfferLetterView;
