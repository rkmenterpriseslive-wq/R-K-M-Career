
import React, { useState, useEffect, useMemo } from 'react';
import { getAttendanceData, getCandidates, getAllTeamMembers } from '../../services/supabaseService';
import { UserType } from '../../types'; // Ensure UserType is imported if used, or use string literal

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

const RevenueView: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    
    const [teamData, setTeamData] = useState<TeamFinancials[]>([]);
    const [vendorData, setVendorData] = useState<VendorFinancials[]>([]);

    useEffect(() => {
        const fetchFinancials = async () => {
            setLoading(true);
            try {
                // In a real app, this would come from a dedicated 'finance' or 'revenue' collection.
                // Since we don't have that yet, we'll build a simple projection based on Team Members and Vendors
                // to show structural correctness without random data.
                
                const teamMembers = await getAllTeamMembers();
                const candidates = await getCandidates();
                
                // --- Team Financials Projection ---
                // Filter out Admin users from the profitability list
                const filteredTeamMembers = teamMembers.filter((m: any) => m.userType !== 'ADMIN');

                const teamStats = filteredTeamMembers.map((member: any) => {
                    // Simple heuristic: Count candidates recruited by this member * Flat Rate (e.g. 5000)
                    // If no recruiter field matches, revenue is 0.
                    const recruits = candidates.filter((c: any) => c.recruiter === member.fullName).length;
                    const revenueGenerated = recruits * 5000; 
                    const salaryCost = parseFloat(member.salary) || 30000; // Default or fetched salary

                    return {
                        id: member.id,
                        member: member.fullName,
                        role: member.role,
                        revenueGenerated,
                        salaryCost
                    };
                });
                setTeamData(teamStats);

                // --- Vendor Financials Projection ---
                // Group candidates by Vendor
                const vendorMap: Record<string, number> = {};
                candidates.forEach((c: any) => {
                    if (c.vendor) {
                        vendorMap[c.vendor] = (vendorMap[c.vendor] || 0) + 1;
                    }
                });

                const vendorStats = Object.keys(vendorMap).map((vendorName, index) => {
                    const count = vendorMap[vendorName];
                    // Assumption: If it's a vendor, we pay them (Cost Out). 
                    // If it implies a client relationship (often stored as 'vendor' in simple schema), we might get Revenue In.
                    // For this basic view, let's assume 'Direct' candidates generate Revenue (Client pays us), others have Cost.
                    
                    const isClient = vendorName === 'Direct'; // Simplification
                    
                    return {
                        id: `v-${index}`,
                        entity: vendorName,
                        type: isClient ? 'Client' : 'Vendor',
                        revenueIn: isClient ? count * 10000 : 0,
                        costOut: isClient ? 0 : count * 2000 // We pay vendor per candidate
                    } as VendorFinancials;
                });
                setVendorData(vendorStats);

            } catch (error) {
                console.error("Error fetching financials", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancials();
    }, [selectedMonth]);

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
            <p className={`text-3xl font-bold ${colorClass}`}>{loading ? '...' : value}</p>
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

            {/* Team Profitability Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800 text-base">Team Wise Profitability</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-500 italic">Loading data...</div>
                ) : (
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
                )}
            </div>

            {/* Vendor / Client Profitability Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <h3 className="font-bold text-gray-800 text-base">Vendor / Client Profitability</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-gray-500 italic">Loading data...</div>
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default RevenueView;
