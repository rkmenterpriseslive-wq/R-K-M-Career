import React, { useState, useMemo, FC, useEffect } from 'react';
import Button from '../Button';
import Modal from '../Modal';
import Input from '../Input'; // Import Input component
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
    status: 'Pending' | 'Paid' | 'Failed';
    unpaidAbsences: number; // New field for unpaid absences
    
    // NEW: Incentive fields
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

// --- MOCK DATA ---
const MOCK_EMPLOYEES: PayrollEmployee[] = [
    { 
        id: 'EMP001', name: 'Rohit Kumar', vendor: 'Prime Hire Services Private Limited', role: 'Recruiter', 
        accountNumber: '50100800432427', ifsc: 'HDFC000123', grossSalary: 21385, status: 'Pending', unpaidAbsences: 0,
        employeeNo: 'KN2526', department: 'Recruitment Consultant', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058416', dateOfJoining: '2025-06-02', bankName: 'HDFC Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP002', name: 'Sunita Sharma', vendor: 'Vendor A', role: 'Picker', 
        accountNumber: '...XXXX5678', ifsc: 'ICIC000567', grossSalary: 18000, status: 'Pending', unpaidAbsences: 0,
        employeeNo: 'SH2527', department: 'Operations', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058417', dateOfJoining: '2025-07-10', bankName: 'ICICI Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP003', name: 'Amit Singh', vendor: 'Vendor A', role: 'Packer', 
        accountNumber: '...XXXX9012', ifsc: 'SBIN000901', grossSalary: 19500, status: 'Pending', unpaidAbsences: 0,
        employeeNo: 'AS2528', department: 'Operations', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058418', dateOfJoining: '2025-08-01', bankName: 'SBI Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP004', name: 'Priya Verma', vendor: 'Direct', role: 'Team Leader', 
        accountNumber: '...XXXX3456', ifsc: 'AXIS000345', grossSalary: 28000, status: 'Pending', unpaidAbsences: 0,
        employeeNo: 'PV2529', department: 'Team Management', location: 'Kanpur',
        panNumber: 'BKKPK2659A', pfUan: '101402058419', dateOfJoining: '2025-05-20', bankName: 'Axis Bank',
        attendanceIncentive: 0, performanceBonus: 0, overtimeHours: 0, referralBonus: 0
    },
    { 
        id: 'EMP005', name: 'Mohan Das', vendor: 'Vendor B', role: 'Sales Executive', 
        accountNumber: '...XXXX7890', ifsc: 'KKBK000789', grossSalary: 22000, status: 'Pending', unpaidAbsences: 0,
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

const PayslipModalContent: FC<{ employee: PayrollEmployee, month: string, totalDaysInMonth: number, portalName: string, logoSrc: string | null, contactInfo: ContactConfig }> = ({ employee, month, totalDaysInMonth, portalName, logoSrc, contactInfo }) => {
    
    // Derive effective work days and LOP from totalDaysInMonth and unpaidAbsences
    const effectiveWorkDays = Math.max(0, totalDaysInMonth - employee.unpaidAbsences);
    const lop = employee.unpaidAbsences;

    // Pass the entire employee object to calculatePayslip for incentives
    const payslipDetails = calculatePayslip(employee, effectiveWorkDays, totalDaysInMonth);
    const currentMonthYear = new Date(month).toLocaleString('default', { month: 'short', year: 'numeric' });

    const payslipContentRef = React.useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);


    const handleDownloadPdf = () => {
        if (!payslipContentRef.current) return;
        setIsDownloading(true);

        const element = payslipContentRef.current;
        const opt = {
            margin:       [0.5, 0.5, 0.5, 0.5],
            filename:     `Payslip_${employee.name.replace(/\s+/g, '_')}_${month}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
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
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Name:</span> <span className="font-semibold">{employee.name}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Joining Date:</span> <span className="font-semibold">{formatDate(employee.dateOfJoining)}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Designation:</span> <span className="font-semibold">{employee.role}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Department:</span> <span className="font-semibold">{employee.department || 'Recruitment Consultant'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Location:</span> <span className="font-semibold">{employee.location || 'Kanpur'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Effective Work Days:</span> <span className="font-semibold">{effectiveWorkDays}</span></p>
                        <p className="flex justify-between py-1"><span className="font-medium">LOP:</span> <span className="font-semibold">{lop}</span></p>
                    </div>
                    <div>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Employee No:</span> <span className="font-semibold">{employee.employeeNo || 'N/A'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Bank Name:</span> <span className="font-semibold">{employee.bankName || 'N/A'}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">Bank Account No:</span> <span className="font-semibold">{employee.accountNumber}</span></p>
                        <p className="flex justify-between border-b border-gray-200 py-1"><span className="font-medium">PAN Number:</span> <span className="font-semibold">{employee.panNumber || 'N/A'}</span></p>
                        <p className="flex justify-between py-1"><span className="font-medium">PF UAN:</span> <span className="font-semibold">{employee.pfUan || 'N/A'}</span></p>
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
                            {payslipDetails.earnings.map((earning, index) => (
                                <tr key={earning.label}>
                                    <td className="border border-gray-300 p-2 text-left w-1/3" colSpan={2}>{earning.label}</td>
                                    <td className="border border-gray-300 p-2 text-right w-1/6">{formatCurrency(earning.masterAmount)}</td>
                                    <td className="border border-gray-300 p-2 text-right w-1/6">{formatCurrency(earning.amount)}</td>
                                    
                                    {/* Deductions column - render only once */}
                                    {index === 0 && (
                                        <>
                                            <td className="border border-gray-300 p-2 text-left w-1/3 font-medium" colSpan={2} rowSpan={payslipDetails.earnings.length}>
                                                {payslipDetails.deductions[0]?.label || ''}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right w-1/6" rowSpan={payslipDetails.earnings.length}>
                                                {formatCurrency(payslipDetails.deductions[0]?.amount || 0)}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {/* Total Earnings and Deductions Row */}
                            <tr className="font-bold text-sm bg-gray-50">
                                <td className="border border-gray-300 p-2 text-left" colSpan={2}>Total Earnings</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(payslipDetails.totalEarningsMaster)}</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(payslipDetails.totalEarningsAmount)}</td>
                                <td className="border border-gray-300 p-2 text-left" colSpan={2}>Total Deductions</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(payslipDetails.totalDeductionsAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Net Pay */}
                <div className="mt-4 border-t border-b border-gray-300 py-3 flex justify-between items-center px-2">
                    <p className="text-base font-bold">Net Pay for the Month</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(payslipDetails.netSalary)}</p>
                </div>
                <p className="text-xs italic text-gray-700 mt-2 px-2">
                    (Rupees {payslipDetails.netSalaryInWords} Only)
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
            <div className="mt-6 text-center">
                <Button variant="primary" onClick={handleDownloadPdf} loading={isDownloading} className="mr-3">Download PDF</Button>
                <Button variant="secondary" onClick={() => window.print()}>Print Payslip</Button>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const ManagePayrollView: FC<{ portalName: string; logoSrc: string | null; contactInfo: ContactConfig }> = ({ portalName, logoSrc, contactInfo }) => {
    const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
    const [filters, setFilters] = useState({ month: '', status: '', vendor: '' });
    const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);

    const totalDaysInMonth = useMemo(() => {
        if (!filters.month) return 0;
        const [year, month] = filters.month.split('-').map(Number);
        // Date(year, month, 0) gives the last day of the *previous* month.
        // To get days in *current* month, use Date(year, month, 0).getDate() for month `month` (1-indexed).
        // For example, new Date(2024, 1, 0) gives Jan 31. So for Feb (month 2), use 2.
        return new Date(year, month, 0).getDate(); 
    }, [filters.month]);

    useEffect(() => {
        // Initialize employees with mock data and set default for unpaidAbsences
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const defaultMonth = `${year}-${month}`;

        setFilters(f => ({ ...f, month: defaultMonth }));
        
        // Initialize mock employees with 0 unpaidAbsences and 0 for new incentive fields
        const initialEmployees = MOCK_EMPLOYEES.map(emp => ({
            ...emp,
            unpaidAbsences: 0, // Default to 0 unpaid absences
            attendanceIncentive: 0, 
            performanceBonus: 0,
            overtimeHours: 0,
            referralBonus: 0,
        }));
        setEmployees(initialEmployees);
    }, []); // Run only once on component mount

    useEffect(() => {
        // When totalDaysInMonth changes (i.e., month changes), reset incentive related fields
        setEmployees(prevEmployees => prevEmployees.map(emp => ({
            ...emp,
            unpaidAbsences: 0, // Reset unpaid absences to 0 for new month
            attendanceIncentive: 0,
            performanceBonus: 0,
            overtimeHours: 0,
            referralBonus: 0,
        })));
    }, [totalDaysInMonth]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleEmployeeDataChange = (employeeId: string, field: keyof PayrollEmployee, value: string) => {
        const numValue = parseFloat(value);
        setEmployees(prevEmployees => prevEmployees.map(emp =>
            emp.id === employeeId
                ? { ...emp, [field]: isNaN(numValue) || numValue < 0 ? 0 : numValue }
                : emp
        ));
    };

    const handlePay = (id: string) => {
        setEmployees(employees.map(emp => emp.id === id ? { ...emp, status: 'Paid' } : emp));
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => 
            (filters.status === '' || emp.status === filters.status) &&
            (filters.vendor === '' || emp.vendor === filters.vendor)
        );
    }, [employees, filters]);

    const summary = useMemo(() => {
        const totalAmount = filteredEmployees.reduce((sum, emp) => {
            const daysPresent = Math.max(0, totalDaysInMonth - emp.unpaidAbsences);
            // Pass the entire employee object for accurate incentive calculation
            return sum + calculatePayslip(emp, daysPresent, totalDaysInMonth).netSalary;
        }, 0);
        const paidCount = filteredEmployees.filter(e => e.status === 'Paid').length;
        const pendingCount = filteredEmployees.filter(e => e.status === 'Pending').length;
        return { totalAmount, paidCount, pendingCount };
    }, [filteredEmployees, totalDaysInMonth]);
    
    const getStatusClasses = (status: PayrollEmployee['status']) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Failed': return 'bg-red-100 text-red-800';
        }
    };
    
    const selectedMonthName = useMemo(() => {
       if (!filters.month) return '';
       const [year, month] = filters.month.split('-');
       const date = new Date(parseInt(year), parseInt(month) - 1, 1);
       return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [filters.month]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Manage Payroll</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Payout" value={formatCurrency(summary.totalAmount)} color="text-blue-600" />
                <StatCard title="Employees Paid" value={summary.paidCount.toString()} color="text-green-600" />
                <StatCard title="Pending Payments" value={summary.pendingCount.toString()} color="text-yellow-600" />
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700">Month</label>
                    <input type="month" name="month" value={filters.month} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700">Vendor</label>
                    <select name="vendor" value={filters.vendor} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All Vendors</option>
                        {/* Assuming dynamic vendor list from props in a real app */}
                        <option value="Direct">Direct</option>
                        <option value="Prime Hire Services Private Limited">Prime Hire Services Private Limited</option>
                        <option value="Vendor A">Vendor A</option>
                        <option value="Vendor B">Vendor B</option>
                    </select>
                </div>
                 <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary (Master)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unpaid Absences</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid Days</th>
                                {/* NEW: Incentive Headers */}
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Att. Inc.</th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Perf. Bonus</th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">OT Hrs.</th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Referral Bonus</th>
                                {/* END NEW Incentive Headers */}
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEmployees.map(emp => {
                                const effectiveWorkDays = Math.max(0, totalDaysInMonth - emp.unpaidAbsences);
                                // Pass the entire employee object
                                const netSalary = calculatePayslip(emp, effectiveWorkDays, totalDaysInMonth).netSalary;
                                return (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                                        <div className="text-sm text-gray-500">{emp.vendor} - {emp.role}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{formatCurrency(emp.grossSalary)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {/* FIX: Added unique id prop to satisfy InputProps requirement */}
                                        <Input
                                            id={`unpaidAbsences-${emp.id}`}
                                            type="number"
                                            value={emp.unpaidAbsences.toString()}
                                            onChange={(e) => handleEmployeeDataChange(emp.id, 'unpaidAbsences', e.target.value)}
                                            min="0"
                                            max={totalDaysInMonth.toString()}
                                            wrapperClassName="!mb-0"
                                            className="w-16 text-center text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-700">{effectiveWorkDays} / {totalDaysInMonth}</td>
                                    {/* NEW: Incentive Inputs */}
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        {/* FIX: Added unique id prop to satisfy InputProps requirement */}
                                        <Input
                                            id={`attendanceIncentive-${emp.id}`}
                                            type="number"
                                            value={emp.attendanceIncentive.toString()}
                                            onChange={(e) => handleEmployeeDataChange(emp.id, 'attendanceIncentive', e.target.value)}
                                            min="0"
                                            wrapperClassName="!mb-0"
                                            className="w-20 text-right text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        {/* FIX: Added unique id prop to satisfy InputProps requirement */}
                                        <Input
                                            id={`performanceBonus-${emp.id}`}
                                            type="number"
                                            value={emp.performanceBonus.toString()}
                                            onChange={(e) => handleEmployeeDataChange(emp.id, 'performanceBonus', e.target.value)}
                                            min="0"
                                            wrapperClassName="!mb-0"
                                            className="w-20 text-right text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        {/* FIX: Added unique id prop to satisfy InputProps requirement */}
                                        <Input
                                            id={`overtimeHours-${emp.id}`}
                                            type="number"
                                            value={emp.overtimeHours.toString()}
                                            onChange={(e) => handleEmployeeDataChange(emp.id, 'overtimeHours', e.target.value)}
                                            min="0"
                                            wrapperClassName="!mb-0"
                                            className="w-16 text-center text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        {/* FIX: Added unique id prop to satisfy InputProps requirement */}
                                        <Input
                                            id={`referralBonus-${emp.id}`}
                                            type="number"
                                            value={emp.referralBonus.toString()}
                                            onChange={(e) => handleEmployeeDataChange(emp.id, 'referralBonus', e.target.value)}
                                            min="0"
                                            wrapperClassName="!mb-0"
                                            className="w-20 text-right text-sm"
                                        />
                                    </td>
                                    {/* END NEW Incentive Inputs */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">{formatCurrency(netSalary)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(emp.status)}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(emp)}>View Payslip</Button>
                                        {emp.status === 'Pending' && <Button variant="primary" size="sm" onClick={() => handlePay(emp.id)}>Pay Now</Button>}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedEmployee && (
                <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Payslip Details" maxWidth="max-w-4xl">
                    <PayslipModalContent 
                        employee={selectedEmployee} 
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

export default ManagePayrollView;