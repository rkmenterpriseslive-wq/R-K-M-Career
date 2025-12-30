import React, { useState, useMemo, useEffect, useRef, FC } from 'react';
import Button from '../Button';
import Modal from '../Modal';
import Input from '../Input';
import { ContactConfig } from '../../types'; // Import ContactConfig

// Add this line to inform TypeScript about the global html2pdf function
declare const html2pdf: any;

// --- DATA TYPES ---
interface PayrollEmployee {
    id: string;
    name: string;
    vendor: string;
    role: string;
    accountNumber: string;
    ifsc: string;
    grossSalary: number; // This will now represent the "Total Earnings (Master)" from the image
    unpaidAbsences: number; // Changed from daysPresent to unpaidAbsences

    // NEW: Incentive fields (for consistency, default to 0 for display)
    attendanceIncentive: number;
    performanceBonus: number;
    overtimeHours: number;
    referralBonus: number;

    // Additional fields for payslip details (mocked for now or can be extended from Employee type)
    employeeNo?: string;
    department?: string;
    location?: string;
    panNumber?: string;
    pfUan?: string;
    dateOfJoining?: string;
    bankName?: string;
}

interface PayslipComponent {
    label: string;
    masterAmount: number;
    amount: number;
}

interface PayslipDetails {
    earnings: PayslipComponent[];
    deductions: PayslipComponent[]; // Simplified for deductions as per image
    totalEarningsMaster: number;
    totalEarningsAmount: number;
    totalDeductionsAmount: number;
    netSalary: number;
    netSalaryInWords: string;
}

interface GeneratedPayslip extends PayrollEmployee {
    payslipDetails: PayslipDetails;
    derivedDaysPresent: number; // To store the calculated daysPresent for display
}

// --- MOCK DATA ---
const MOCK_EMPLOYEES: PayrollEmployee[] = [
    { 
        id: 'EMP001', name: 'Rohit Kumar', vendor: 'Prime Hire Services Private Limited', role: 'Recruiter', 
        accountNumber: '50100800432427', ifsc: 'HDFC000123', grossSalary: 21385, unpaidAbsences: 0,
        employeeNo: 'KN2526', department: 'Recruitment Consultant', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058416', dateOfJoining: '2025-06-02', bankName: 'HDFC Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP002', name: 'Sunita Sharma', vendor: 'Vendor A', role: 'Picker', 
        accountNumber: '...XXXX5678', ifsc: 'ICIC000567', grossSalary: 18000, unpaidAbsences: 0,
        employeeNo: 'SH2527', department: 'Operations', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058417', dateOfJoining: '2025-07-10', bankName: 'ICICI Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP003', name: 'Amit Singh', vendor: 'Vendor A', role: 'Packer', 
        accountNumber: '...XXXX9012', ifsc: 'SBIN000901', grossSalary: 19500, unpaidAbsences: 0,
        employeeNo: 'AS2528', department: 'Operations', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058418', dateOfJoining: '2025-08-01', bankName: 'SBI Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP004', name: 'Priya Verma', vendor: 'Direct', role: 'Team Leader', 
        accountNumber: '...XXXX3456', ifsc: 'AXIS000345', grossSalary: 28000, unpaidAbsences: 0,
        employeeNo: 'PV2529', department: 'Team Management', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058419', dateOfJoining: '2025-05-20', bankName: 'Axis Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP005', name: 'Mohan Das', vendor: 'Vendor B', role: 'Sales Executive', 
        accountNumber: '...XXXX7890', ifsc: 'KKBK000789', grossSalary: 22000, unpaidAbsences: 0,
        employeeNo: 'MD2530', department: 'Sales', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058420', dateOfJoining: '2025-09-01', bankName: 'Kotak Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
];

// --- HELPER FUNCTIONS ---
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

const calculatePayslip = (employee: PayrollEmployee, daysPresent: number, totalDaysInMonth: number): PayslipDetails => {
    if (totalDaysInMonth === 0) totalDaysInMonth = 1;

    const prorationFactor = daysPresent / totalDaysInMonth;

    // Fixed master amounts from the image, these sum up to totalMonthlyMasterEarnings (21385)
    // Use employee.grossSalary as the base for prorated earnings
    const masterBasic = 11375;
    const masterHra = 4550;
    const masterConveyance = 600;
    const masterMedicalAllowance = 948;
    const masterSpecialAllowance = 948;
    const masterStatutoryBonus = 948;
    const masterOtherAllowance = 948;
    const masterFbpReimbursement = 1068;
    
    // Prorated amounts (excluding incentives which are added later)
    const basic = masterBasic * prorationFactor;
    const hra = masterHra * prorationFactor;
    const conveyance = masterConveyance * prorationFactor;
    const medicalAllowance = masterMedicalAllowance * prorationFactor;
    const specialAllowance = masterSpecialAllowance * prorationFactor;
    const statutoryBonus = masterStatutoryBonus * prorationFactor;
    const otherAllowance = masterOtherAllowance * prorationFactor;
    const fbpReimbursement = masterFbpReimbursement * prorationFactor;

    let earnings: PayslipComponent[] = [
        { label: 'BASIC', masterAmount: masterBasic, amount: basic },
        { label: 'HRA', masterAmount: masterHra, amount: hra },
        { label: 'CONVEYANCE', masterAmount: masterConveyance, amount: conveyance },
        { label: 'MEDICAL ALLOWANCE', masterAmount: masterMedicalAllowance, amount: medicalAllowance },
        { label: 'SPECIAL ALLOWANCE', masterAmount: masterSpecialAllowance, amount: specialAllowance },
        { label: 'STATUTORY BONUS', masterAmount: masterStatutoryBonus, amount: statutoryBonus },
        { label: 'OTHER ALLOWANCE', masterAmount: masterOtherAllowance, amount: otherAllowance },
        { label: 'FBP REIMBURSEMENT', masterAmount: masterFbpReimbursement, amount: fbpReimbursement },
    ];

    // NEW: Calculate and add Incentives
    const incentiveGrossBase = employee.grossSalary * prorationFactor; // Base for hourly rate calculation
    const HOURLY_RATE_MULTIPLIER = 1.5; // 1.5x for overtime
    const HOURS_PER_DAY = 8;
    const hourlyRate = totalDaysInMonth > 0 ? (incentiveGrossBase / totalDaysInMonth / HOURS_PER_DAY) : 0;

    const overtimePay = (employee.overtimeHours || 0) * hourlyRate * HOURLY_RATE_MULTIPLIER;

    if (employee.attendanceIncentive > 0) {
        earnings.push({ label: 'ATTENDANCE INCENTIVE', masterAmount: employee.attendanceIncentive, amount: employee.attendanceIncentive });
    }
    if (employee.performanceBonus > 0) {
        earnings.push({ label: 'PERFORMANCE BONUS', masterAmount: employee.performanceBonus, amount: employee.performanceBonus });
    }
    if (overtimePay > 0) {
        earnings.push({ label: `OVERTIME PAY (${employee.overtimeHours} Hrs)`, masterAmount: overtimePay, amount: overtimePay });
    }
    if (employee.referralBonus > 0) {
        earnings.push({ label: 'REFERRAL BONUS', masterAmount: employee.referralBonus, amount: employee.referralBonus });
    }

    // Recalculate total earnings after adding incentives
    const totalEarningsMaster = earnings.reduce((sum, item) => sum + item.masterAmount, 0); // Sum of all master amounts including incentives
    const totalEarningsAmount = earnings.reduce((sum, item) => sum + item.amount, 0); // Sum of all prorated amounts including incentives

    // Deductions - PF is 12% of basic, as seen in the image.
    // The image shows PF as 1365, which is roughly 12% of the masterBasic (11375 * 0.12 = 1365).
    const masterPfDeduction = 1365; // Fixed from image
    const pfDeduction = masterPfDeduction * prorationFactor; // Prorate PF

    const deductions: PayslipComponent[] = [
        { label: 'PF', masterAmount: masterPfDeduction, amount: pfDeduction },
    ].filter(d => d.amount > 0); // Only include if amount is positive

    const totalDeductionsAmount = deductions.reduce((sum, item) => sum + item.amount, 0);
    const netSalary = totalEarningsAmount - totalDeductionsAmount;
    const netSalaryInWords = numberToWords(Math.round(netSalary));

    return { 
        earnings, 
        deductions, 
        totalEarningsMaster, 
        totalEarningsAmount, 
        totalDeductionsAmount, 
        netSalary, 
        netSalaryInWords 
    };
};

const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'N/A';

// --- SUB-COMPONENTS ---
const StatCard: FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-500 mb-1">{title}</h4>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

const PayslipModalContent: FC<{ payslip: GeneratedPayslip, month: string, totalDaysInMonth: number, portalName: string, logoSrc: string | null, contactInfo: ContactConfig }> = ({ payslip, month, totalDaysInMonth, portalName, logoSrc, contactInfo }) => {
    const payslipContentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Derive effective work days and LOP from totalDaysInMonth and unpaidAbsences
    const effectiveWorkDays = Math.max(0, totalDaysInMonth - payslip.unpaidAbsences);
    const lop = payslip.unpaidAbsences;
    const currentMonthYear = new Date(month).toLocaleString('default', { month: 'short', year: 'numeric' });

    const handleDownload = () => {
        if (!payslipContentRef.current) return;
        setIsDownloading(true);
        const element = payslipContentRef.current;
        const opt = {
            margin:       0.5,
            filename:     `Payslip_${payslip.name.replace(' ', '_')}_${month}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save().then(() => setIsDownloading(false));
    };

    return (
        <div className="text-sm text-gray-800 font-serif">
            <div ref={payslipContentRef} className="payslip-print-area p-8 bg-white border border-gray-300 mx-auto" style={{width: '8.5in', height: '11in'}}>
                {/* Header Section */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-start mb-2">
                        {logoSrc && <img src={logoSrc} alt="Company Logo" className="h-14 w-auto object-contain mr-4" />}
                        <h1 className="text-xl font-bold text-gray-900 mx-auto">{portalName}</h1>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                        {contactInfo.addressLine1}, {contactInfo.addressLine2}<br/>
                        {contactInfo.city},{contactInfo.state}, {contactInfo.pincode}
                    </p>
                    <h2 className="text-lg font-bold text-gray-900 mt-4 underline">Payslip for the month of {currentMonthYear}</h2>
                </div>

                {/* Employee & Bank Details */}
                <div className="grid grid-cols-2 gap-x-8 text-sm mb-6 border border-gray-300 p-3">
                    <div>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Name:</span> <span className="font-semibold">{payslip.name}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Joining Date:</span> <span className="font-semibold">{formatDate(payslip.dateOfJoining)}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Designation:</span> <span className="font-semibold">{payslip.role}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Department:</span> <span className="font-semibold">{payslip.department || 'Recruitment Consultant'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Location:</span> <span className="font-semibold">{payslip.location || 'Kanpur'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Effective Work Days:</span> <span className="font-semibold">{effectiveWorkDays}</span></p>
                        <p className="flex justify-between py-1"><span className="font-medium">LOP:</span> <span className="font-semibold">{lop}</span></p>
                    </div>
                    <div>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Employee No:</span> <span className="font-semibold">{payslip.employeeNo || 'N/A'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Bank Name:</span> <span className="font-semibold">{payslip.bankName || 'N/A'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Bank Account No:</span> <span className="font-semibold">{payslip.accountNumber}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">PAN Number:</span> <span className="font-semibold">{payslip.panNumber || 'N/A'}</span></p>
                        <p className="flex justify-between py-1"><span className="font-medium">PF UAN:</span> <span className="font-semibold">{payslip.pfUan || 'N/A'}</span></p>
                    </div>
                </div>

                {/* Earnings and Deductions Table */}
                <div className="mb-6">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 font-bold text-sm">
                                <th className="border border-gray-300 p-2 text-left w-1/3" colSpan={2}>Earnings</th>
                                <th className="border border-gray-300 p-2 text-right w-1/6">Master</th>
                                <th className="border border-gray-300 p-2 text-right w-1/6">Amount</th>
                                <th className="border border-gray-300 p-2 text-left w-1/3" colSpan={2}>Deductions</th>
                                <th className="border border-gray-300 p-2 text-right w-1/6">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* FIX: Corrected access to payslipDetails from the payslip prop */}
                            {payslip.payslipDetails.earnings.map((earning, index) => (
                                <tr key={earning.label}>
                                    <td className="border border-gray-300 p-2 text-left w-1/3" colSpan={2}>{earning.label}</td>
                                    <td className="border border-gray-300 p-2 text-right w-1/6">{formatCurrency(earning.masterAmount)}</td>
                                    <td className="border border-gray-300 p-2 text-right w-1/6">{formatCurrency(earning.amount)}</td>
                                    
                                    {/* Deductions column - render only once */}
                                    {index === 0 && (
                                        <>
                                            <td className="border border-gray-300 p-2 text-left w-1/3 font-medium" colSpan={2} rowSpan={payslip.payslipDetails.earnings.length}>
                                                {payslip.payslipDetails.deductions[0]?.label || ''}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right w-1/6" rowSpan={payslip.payslipDetails.earnings.length}>
                                                {formatCurrency(payslip.payslipDetails.deductions[0]?.amount || 0)}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {/* Total Earnings and Deductions Row */}
                            <tr className="font-bold text-sm bg-gray-50">
                                <td className="border border-gray-300 p-2 text-left" colSpan={2}>Total Earnings</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(payslip.payslipDetails.totalEarningsMaster)}</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(payslip.payslipDetails.totalEarningsAmount)}</td>
                                <td className="border border-gray-300 p-2 text-left" colSpan={2}>Total Deductions</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(payslip.payslipDetails.totalDeductionsAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Net Pay */}
                <div className="mt-4 border-t border-b border-gray-300 py-3 flex justify-between items-center px-2">
                    <p className="text-base font-bold">Net Pay for the Month</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(payslip.payslipDetails.netSalary)}</p>
                </div>
                <p className="text-xs italic text-gray-700 mt-2 px-2">
                    (Rupees {payslip.payslipDetails.netSalaryInWords} Only)
                </p>
                
                {/* Accumulated Yearly LTA */}
                <div className="mt-6 border-t border-gray-300 pt-3 px-2">
                    <p className="text-sm font-bold">ACCUMULATED YEARLY LTA: <span className="font-normal">{formatCurrency(0)}</span></p>
                </div>

                {/* System Generated Message */}
                <p className="text-center text-xs text-gray-500 italic mt-8">
                    This is a system generated payslip and does not require signature.
                </p>
            </div>
            <div className="mt-6 text-center border-t pt-4">
                <Button variant="primary" onClick={handleDownload} loading={isDownloading}>Download PDF</Button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const PayslipsView: FC<{ portalName: string; logoSrc: string | null; contactInfo: ContactConfig }> = ({ portalName, logoSrc, contactInfo }) => {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [generatedPayslips, setGeneratedPayslips] = useState<GeneratedPayslip[]>([]);
    const [selectedPayslip, setSelectedPayslip] = useState<GeneratedPayslip | null>(null);

    const totalDaysInMonth = useMemo(() => {
        if (!selectedMonth) return 0;
        const [year, month] = selectedMonth.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    }, [selectedMonth]);


     useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        setSelectedMonth(`${year}-${month}`);
    }, []);

    const handleGenerate = () => {
        const slips = MOCK_EMPLOYEES.map(emp => {
            // For PayslipsView, let's assume unpaidAbsences is 0 and incentives are 0 by default for mock data.
            // In a real application, you would fetch actual attendance records and incentive data for the selected month.
            const unpaidAbsences = emp.unpaidAbsences; 
            const derivedDaysPresent = Math.max(0, totalDaysInMonth - unpaidAbsences);

            return {
                ...emp,
                unpaidAbsences,
                derivedDaysPresent,
                // Pass the entire employee object to calculatePayslip
                payslipDetails: calculatePayslip(emp, derivedDaysPresent, totalDaysInMonth),
            };
        });
        setGeneratedPayslips(slips);
    };

    const filteredPayslips = useMemo(() => {
        return generatedPayslips.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [generatedPayslips, searchTerm]);

    const summary = useMemo(() => {
        const totalNetPay = filteredPayslips.reduce((sum, p) => sum + p.payslipDetails.netSalary, 0);
        const totalDeductions = filteredPayslips.reduce((sum, p) => sum + p.payslipDetails.totalDeductionsAmount, 0);
        const employeeCount = filteredPayslips.length;
        return { totalNetPay, totalDeductions, employeeCount };
    }, [filteredPayslips]);

    const selectedMonthName = useMemo(() => {
       if (!selectedMonth) return '';
       const [year, month] = selectedMonth.split('-');
       const date = new Date(parseInt(year), parseInt(month) - 1, 1);
       return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Payslips</h2>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
                    <Input type="month" id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} wrapperClassName="mb-0" />
                </div>
                <Button variant="primary" onClick={handleGenerate} className="w-full sm:w-auto">Generate Payslips</Button>
            </div>

            {generatedPayslips.length > 0 && (
                <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Employees" value={summary.employeeCount.toString()} color="text-blue-600" />
                        <StatCard title="Total Net Payout" value={formatCurrency(summary.totalNetPay)} color="text-green-600" />
                        <StatCard title="Total Deductions" value={formatCurrency(summary.totalDeductions)} color="text-red-600" />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <Input type="text" id="search-employee" placeholder="Search by employee name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Salary (Master)</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Paid Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPayslips.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{p.name}</div><div className="text-sm text-gray-500">{p.role}</div></td>
                                            <td className="px-6 py-4 text-right text-sm">{formatCurrency(p.grossSalary)}</td>
                                            <td className="px-6 py-4 text-center text-sm">{p.derivedDaysPresent} / {totalDaysInMonth}</td>
                                            <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">{formatCurrency(p.payslipDetails.netSalary)}</td>
                                            <td className="px-6 py-4 text-right text-sm font-medium"><Button variant="ghost" size="sm" onClick={() => setSelectedPayslip(p)}>View Payslip</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {selectedPayslip && (
                <Modal isOpen={!!selectedPayslip} onClose={() => setSelectedPayslip(null)} title="Payslip Details" maxWidth="max-w-4xl">
                    <PayslipModalContent 
                        payslip={selectedPayslip} 
                        month={selectedMonthName} 
                        totalDaysInMonth={totalDaysInMonth} 
                        portalName={portalName}
                        logoSrc={logoSrc}
                        contactInfo={contactInfo}
                    />
                </Modal>
            )}
        </div>
    );
};

export default PayslipsView;