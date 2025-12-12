import React from 'react';
import { TeamMemberPerformance } from '../../types';

interface TeamPerformanceTableProps {
  data: TeamMemberPerformance[];
}

const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6 h-full overflow-hidden border border-gray-200">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">Team Performance</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            {['Total', 'Selected', 'Pending', 'Rejected', 'Quit', 'Success %'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((m, i) => {
            const isManagerWithChildren = !m.isDownline && data[i + 1] && data[i + 1].isDownline;
            const isChild = m.isDownline;
            const isLastChild = isChild && (!data[i + 1] || !data[i + 1].isDownline);

            return (
              <tr key={m.id}>
                <td className="px-6 py-4 whitespace-nowrap relative">
                  {isManagerWithChildren && (
                    <div className="absolute left-6 top-1/2 h-full w-px bg-gray-300" />
                  )}
                  {isChild && (
                    <>
                      <div className={`absolute left-6 top-0 w-px bg-gray-300 ${isLastChild ? 'h-1/2' : 'h-full'}`} />
                      <div className="absolute left-6 top-1/2 h-px w-4 bg-gray-300" />
                    </>
                  )}
                  <div className={isChild ? 'pl-8' : ''}>
                    <span className={`${isChild ? 'text-sm text-gray-700' : 'text-sm font-medium text-gray-900'}`}>
                      {m.teamMember}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   <span className={`px-2 py-1 rounded-full text-xs border ${
                      m.role?.toLowerCase().includes('lead') || m.role?.toLowerCase().includes('manager') 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                      : 'bg-gray-50 text-gray-600 border-gray-100'
                   }`}>
                      {m.role || '-'}
                   </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.total}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.selected}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.pending}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.rejected}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.quit}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">{m.successRate.toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default TeamPerformanceTable;
