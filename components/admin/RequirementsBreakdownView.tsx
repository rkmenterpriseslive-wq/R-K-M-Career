
import React, { useState } from 'react';
import { RequirementBreakdownData, DetailedRequirementBreakdownRow, BreakdownDetail } from '../../types';

type BreakdownTab = 'Team Wise' | 'Brand Wise' | 'Store Wise' | 'Role Wise';

interface RequirementsBreakdownViewProps {
    data: RequirementBreakdownData;
}

const RequirementsBreakdownView: React.FC<RequirementsBreakdownViewProps> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<BreakdownTab>('Team Wise');

    const tabs: BreakdownTab[] = ['Team Wise', 'Brand Wise', 'Store Wise', 'Role Wise'];

    const renderBreakdownString = (breakdown: BreakdownDetail | undefined) => {
        if (!breakdown || Object.keys(breakdown).length === 0) return '-';
        return Object.entries(breakdown)
            .map(([name, count]) => `${name}-${count}`)
            .join(', ');
    };

    const renderTable = () => {
        let tableData: DetailedRequirementBreakdownRow[] = [];
        let primaryColumnName = '';
        let columns: { header: string, render: (row: DetailedRequirementBreakdownRow) => React.ReactNode }[] = [];

        switch(activeTab) {
            case 'Team Wise':
                primaryColumnName = "Team";
                tableData = data.team;
                columns = [
                    { header: 'Location', render: row => renderBreakdownString(row.locationBreakdown) },
                    { header: 'Role', render: row => renderBreakdownString(row.roleBreakdown) },
                    { header: 'Store', render: row => renderBreakdownString(row.storeBreakdown) },
                    { header: 'Partner', render: row => renderBreakdownString(row.partnerNameBreakdown) },
                    { header: 'Brand', render: row => renderBreakdownString(row.brandBreakdown) }
                ];
                break;
            case 'Brand Wise':
                primaryColumnName = "Brand";
                tableData = data.partner; // Data is keyed by client/brand name in App.tsx
                columns = [
                    { header: 'Partner', render: row => renderBreakdownString(row.partnerNameBreakdown) },
                    { header: 'Location', render: row => renderBreakdownString(row.locationBreakdown) },
                    { header: 'Role', render: row => renderBreakdownString(row.roleBreakdown) },
                    { header: 'Store', render: row => renderBreakdownString(row.storeBreakdown) }
                ];
                break;
            case 'Store Wise':
                primaryColumnName = "Store";
                tableData = data.store;
                columns = [
                    { header: 'Location', render: row => row.location || '-' },
                    { header: 'Role', render: row => renderBreakdownString(row.roleBreakdown) },
                    { header: 'Partner', render: row => renderBreakdownString(row.partnerNameBreakdown) },
                    { header: 'Brand', render: row => renderBreakdownString(row.brandBreakdown) }
                ];
                break;
            case 'Role Wise':
                primaryColumnName = "Role";
                tableData = data.role;
                columns = [
                    { header: 'Location', render: row => renderBreakdownString(row.locationBreakdown) },
                    { header: 'Store', render: row => renderBreakdownString(row.storeBreakdown) },
                    { header: 'Partner', render: row => renderBreakdownString(row.partnerNameBreakdown) },
                    { header: 'Brand', render: row => renderBreakdownString(row.brandBreakdown) }
                ];
                break;
        }

        const staticHeaders = ["Total Openings", "Pending", "Approved"];
        const headers = [primaryColumnName, ...columns.map(c => c.header), ...staticHeaders];
        
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.length > 0 ? tableData.map(row => (
                            <tr key={row.id}>
                                <td className="px-6 py-4 font-medium">{row.name}</td>
                                {columns.map(col => (
                                    <td key={col.header} className="px-6 py-4 text-xs">{col.render(row)}</td>
                                ))}
                                <td className="px-6 py-4">{row.totalOpenings}</td>
                                <td className="px-6 py-4">{row.pending}</td>
                                <td className="px-6 py-4">{row.approved}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={headers.length} className="px-6 py-10 text-center text-gray-400">
                                    No data available for this view.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 flex items-center gap-2 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                            activeTab === tab 
                                ? 'bg-yellow-400 text-gray-800 shadow-md' 
                                : 'bg-blue-400 text-white hover:bg-blue-500'
                        }`}
                        style={{
                            backgroundImage: activeTab !== tab ? 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")' : 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")',
                            textShadow: '0 1px 1px rgba(0,0,0,0.1)'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            
            <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{activeTab}</h3>
                {renderTable()}
            </div>
        </div>
    );
};

export default RequirementsBreakdownView;
