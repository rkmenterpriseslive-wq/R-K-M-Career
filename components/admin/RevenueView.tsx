



import React, { useState, useEffect, useMemo } from 'react';
import { UserType, TeamMemberPerformance, Vendor } from '../../types';

interface TeamFinancials {
    id: string;
    member: string;
    role: string;
    revenueGenerated: number;
    salaryCost: number;
}

interface VendorFinancials {
    id: string;
    entity: string; // Vendor or Client Name
    type: 'Vendor' | 'Client';
    revenueIn: number;
    costOut: number;
}

interface RevenueViewProps {
    teamPerformance: TeamMemberPerformance[];
    candidates: any[];
    vendors: Vendor[];
}

// New Component for the Mini Graph
const MonthlyProfitChart: React.FC<{ data: { month: string; revenue: number; cost: number; profit: number }[] }> = ({ data }) => {
    const maxValue = useMemo(() => {
        const allValues = data.flatMap(d => [d.revenue, d.cost]);
        return Math.max(...allValues, 1); // Avoid division by zero
    }, [data]);

    const formatCurrencyShort = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
        return `₹${amount}`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Month Wise Report</h3>
            <div className="flex justify-end gap-4 text-xs mb-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500"></div>Revenue</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"></div>Cost</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"></div>Profit</div>
            </div>
            <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 pt-4 px-2">
                {data.map(item => (
                    <div key={item.month} className="flex flex-col items-center w-full max-w-[60px]">
                        <div className="flex items-end h-full w-full justify-center gap-1">
                            {/* Revenue Bar */}
                            <div 
                                className="w-1/3 bg-green-500 rounded-t-md hover:opacity-80 transition-opacity" 
                                style={{ height: `${(item.revenue / maxValue) * 100}%` }}
                                title={`Revenue: ${formatCurrencyShort(item.revenue)}`}
                            ></div>
                            {/* Cost Bar */}
                            <div 
                                className="w-1/3 bg-red-500 rounded-t-md hover:opacity-80 transition-opacity" 
                                style={{ height: `${(item.cost / maxValue) * 100}%` }}
                                title={`Cost: ${formatCurrencyShort(item.cost)}`}
                            ></div>
                            {/* Profit Bar */}
                            <div 
                                className="w-1/3 bg-blue-500 rounded-t-md hover:opacity-80 transition-opacity" 
                                style={{ height: `${(item.profit / maxValue) * 100}%` }}
                                title={`Profit: ${formatCurrencyShort(item.profit)}`}
                            ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 mt-2">{item.month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const RevenueView: React.FC<RevenueViewProps> = ({ teamPerformance, candidates, vendors }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    
    const monthlyData = [
        { month: 'Jan', revenue: 150000, cost: 80000, profit: 70000 },
        { month: 'Feb', revenue: 180000, cost: 95000, profit: 85000 },
        { month: 'Mar', revenue: 220000, cost: 120000, profit: 100000 },
        { month: 'Apr', revenue: 190000, cost: 110000, profit: 80000 },
        { month: 'May', revenue: 250000, cost: 130000, profit: 120000 },
        { month: 'Jun', revenue: 230000, cost: 140000, profit: 90000 },
    ];

    const teamData = useMemo(() => {
        const filteredTeamMembers = teamPerformance.filter((m) => m.userType !== UserType.ADMIN && m.userType !== UserType.HR);
        
        return filteredTeamMembers.map((member: TeamMemberPerformance) => {
            // First, filter for only candidates hired by this team member
            const hiredCandidatesByMember = candidates.filter((c: any) => 
                c.recruiter === member.teamMember && 
                (c.stage === 'Selected' || c.status === 'Joined')
            );
            
            // Then, calculate revenue generated for each of those candidates
            const revenueGenerated = hiredCandidatesByMember.reduce((totalRevenue, candidate) => {
                const vendorName = candidate.vendor;
                
                // For 'Direct' clients, there's a fixed revenue
                if (vendorName === 'Direct') {
                    return totalRevenue + 10000;
                }
    
                // For vendor/partner clients, the revenue generated by an internal team member is equivalent
                // to the commission that would have been paid to an external vendor for the same placement.
                let commissionForThisHire = 0;
                const vendorDetails = vendors.find(v => (v.brandNames || []).includes(vendorName) || v.partnerName === vendorName);
    
                if (vendorDetails) {
                    switch (vendorDetails.commissionType) {
                        case 'Percentage Based':
                            const percentage = parseFloat(vendorDetails.commissionValue || '0') || 0;
                            const salary = candidate.grossSalary || 0;
                            commissionForThisHire = salary * (percentage / 100);
                            break;
                        
                        case 'Slab Based':
                            // Slab calculation depends on the *total* number of hires for that vendor in the period
                            const totalHiredForThisVendor = candidates.filter(c => 
                                c.vendor === vendorName && 
                                (c.stage === 'Selected' || c.status === 'Joined')
                            ).length;
    
                            const slab = (vendorDetails.commissionSlabs || []).find(s => {
                                const from = parseInt(s.from, 10);
                                const to = parseInt(s.to, 10);
                                if (isNaN(from)) return false;
                                if (isNaN(to)) return totalHiredForThisVendor >= from;
                                return totalHiredForThisVendor >= from && totalHiredForThisVendor <= to;
                            });
                            if (slab) {
                                commissionForThisHire = parseInt(slab.amount, 10) || 0;
                            }
                            break;
                        
                        case 'Attendance Based':
                            const candidateExp = candidate.experienceLevel === 'Fresher' ? 'Fresher' : 'Experienced';
                            const rule = (vendorDetails.commissionAttendanceRules || []).find(r => 
                                r.role === candidate.role && (r.experienceType === candidateExp || r.experienceType === 'Any')
                            );
                            commissionForThisHire = rule ? (parseInt(rule.amount, 10) || 0) : 0;
                            break;
                    }
                }
                return totalRevenue + commissionForThisHire;
            }, 0);
    
            const salaryCost = parseFloat(member.salary || '0') || 30000;
    
            return {
                id: member.id,
                member: member.teamMember,
                role: member.role,
                revenueGenerated,
                salaryCost
            };
        });
    }, [teamPerformance, candidates, vendors]);

    const vendorData = useMemo(() => {
        const vendorCandidateMap: Record<string, any[]> = {};
        candidates.forEach((c: any) => {
            if (c.vendor) {
                if (!vendorCandidateMap[c.vendor]) {
                    vendorCandidateMap[c.vendor] = [];
                }
                vendorCandidateMap[c.vendor].push(c);
            }
        });

        return Object.keys(vendorCandidateMap).map((vendorName, index) => {
            const vendorCandidates = vendorCandidateMap[vendorName];
            const isClient = vendorName === 'Direct';
            // A candidate is considered hired for revenue/cost purposes if they are 'Selected' or have 'Joined'.
            const hiredCandidates = vendorCandidates.filter(c => c.stage === 'Selected' || c.status === 'Joined');
            const hiredCount = hiredCandidates.length;

            let costOut = 0;
            if (!isClient && vendors) {
                // Find the vendor's commission rules from the settings.
                const vendorDetails = vendors.find(v => (v.brandNames || []).includes(vendorName) || v.partnerName === vendorName);

                if (vendorDetails) {
                    switch (vendorDetails.commissionType) {
                        case 'Percentage Based':
                            const percentage = parseFloat(vendorDetails.commissionValue || '0') || 0;
                            costOut = hiredCandidates.reduce((sum, c) => {
                                // Assumes 'grossSalary' is monthly and available on the candidate record upon selection.
                                const salary = c.grossSalary || 0;
                                return sum + (salary * (percentage / 100));
                            }, 0);
                            break;
                        
                        case 'Slab Based':
                            const slab = (vendorDetails.commissionSlabs || []).find(s => {
                                const from = parseInt(s.from, 10);
                                const to = parseInt(s.to, 10);
                                if (isNaN(from)) return false;
                                // If 'to' is not a number, it implies 'and above'.
                                if (isNaN(to)) return hiredCount >= from;
                                return hiredCount >= from && hiredCount <= to;
                            });
                            if (slab) {
                                costOut = hiredCount * (parseInt(slab.amount, 10) || 0);
                            }
                            break;
                        
                        case 'Attendance Based':
                            // For revenue overview, we assume the candidate will meet the attendance criteria upon selection.
                            // The cost is recognized immediately based on their role and experience.
                            costOut = hiredCandidates.reduce((sum, c) => {
                                const candidateExp = c.experienceLevel === 'Fresher' ? 'Fresher' : 'Experienced';
                                const rule = (vendorDetails.commissionAttendanceRules || []).find(r => 
                                    r.role === c.role && (r.experienceType === candidateExp || r.experienceType === 'Any')
                                );
                                return sum + (rule ? (parseInt(rule.amount, 10) || 0) : 0);
                            }, 0);
                            break;

                        default:
                            costOut = 0; // Default to 0 if no matching commission type.
                    }
                }
            }
            
            return {
                id: `v-${index}`,
                entity: vendorName,
                type: isClient ? 'Client' : 'Vendor',
                revenueIn: isClient ? hiredCount * 10000 : 0, // Revenue from direct clients
                costOut: costOut
            } as VendorFinancials;
        });
    }, [candidates, vendors]);


    // Calculations
    const stats = useMemo(() => {
        const teamRevenue = teamData.reduce((sum, item) => sum + item.revenueGenerated, 0);
        const teamCost = teamData.reduce((sum, item) => sum + item.salaryCost, 0);
        
        const vendorRevenue = vendorData.reduce((sum, item) => sum + item.revenueIn, 0);
        const vendorCost = vendorData.reduce((sum, item) => sum + item.costOut, 0);

        const totalRevenue = teamRevenue + vendorRevenue;
        const totalOperationalCost = teamCost + vendorCost;
        const netProfit = totalRevenue - totalOperationalCost;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalOperationalCost,
            netProfit,
            profitMargin
        };
    }, [teamData, vendorData]);

    const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;

    const FinancialCard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">{title}</h4>
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Revenue & Profitability</h2>
                    <p className="text-gray-600 mt-1">Monthly financials based on candidate data.</p>
                </div>
                
                <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
                    <label htmlFor="month-picker" className="block text-xs font-semibold text-gray-500 mb-1 ml-1 uppercase">Select Month</label>
                    <input 
                        type="month" 
                        id="month-picker"
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm font-medium"
                    />
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinancialCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} colorClass="text-green-600" />
                <FinancialCard title="Total Operational Cost" value={formatCurrency(stats.totalOperationalCost)} colorClass="text-red-600" />
                <FinancialCard title="Net Profit" value={formatCurrency(stats.netProfit)} colorClass="text-blue-600" />
                <FinancialCard title="Profit Margin" value={`${stats.profitMargin.toFixed(1)}%`} colorClass="text-purple-600" />
            </div>

            {/* Month Wise Report Graph */}
            <MonthlyProfitChart data={monthlyData} />

            {/* Team Profitability Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800 text-base">Team Wise Profitability</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Team Member</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue Generated</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Salary Cost</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teamData.length > 0 ? teamData.map((item) => {
                                const net = item.revenueGenerated - item.salaryCost;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.member}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">{formatCurrency(item.revenueGenerated)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500 font-medium">-{formatCurrency(item.salaryCost)}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(net)}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No team data available.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vendor / Client Profitability Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800 text-base">Vendor / Client Profitability</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor / Client</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue (In)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Cost (Out)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Profit / Loss</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {vendorData.length > 0 ? vendorData.map((item) => {
                                const profit = item.revenueIn - item.costOut;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.entity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'Client' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">{item.revenueIn > 0 ? formatCurrency(item.revenueIn) : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500 font-medium">{item.costOut > 0 ? `-${formatCurrency(item.costOut)}` : '-'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${profit >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                            {formatCurrency(profit)}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No vendor data available.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueView;
