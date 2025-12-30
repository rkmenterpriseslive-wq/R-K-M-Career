
import React, { useState, useMemo } from 'react';
import Button from '../Button';
import Input from '../Input';

const SelectionPipelineReportView: React.FC<{ onBack: () => void; candidates: any[] }> = ({ onBack, candidates }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({ start: firstDayOfMonth, end: todayStr });

    const pipelineStats = useMemo(() => {
        const stats = {
            Sourced: 0,
            'On the way': 0,
            Interview: 0,
            Selected: 0,
            Joined: 0,
            Rejected: 0,
            Quit: 0,
        };

        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999); // Include the whole end day

        (candidates || []).forEach(c => {
            const appliedDate = c.appliedDate ? new Date(c.appliedDate) : null;
            if (!appliedDate) return;

            if ((!startDate || appliedDate >= startDate) && (!endDate || appliedDate <= endDate)) {
                if (c.stage in stats) {
                    stats[c.stage as keyof typeof stats]++;
                } else if (c.status in stats) {
                     stats[c.status as keyof typeof stats]++;
                }
            }
        });
        return stats;
    }, [candidates, dateRange]);

    const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
        <div className={`p-6 rounded-xl border-l-4 ${color.replace('bg', 'border').replace('-100', '-500')} ${color}`}>
            <h4 className="text-sm font-semibold text-gray-600">{title}</h4>
            <p className="text-4xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
    );

    return (
        <div className="space-y-6 bg-gray-50 min-h-screen p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Selection Pipeline Report</h2>
                <Button variant="secondary" onClick={onBack} className="bg-white border border-gray-300 hover:bg-gray-100 text-sm">
                    Back to Reports
                </Button>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-end gap-4">
                <Input
                    id="startDate"
                    label="Start Date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    wrapperClassName="mb-0"
                />
                <Input
                    id="endDate"
                    label="End Date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    wrapperClassName="mb-0"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Sourced" value={pipelineStats.Sourced} color="bg-gray-100" />
                <StatCard title="On the way" value={pipelineStats['On the way']} color="bg-yellow-100" />
                <StatCard title="Interview" value={pipelineStats.Interview} color="bg-blue-100" />
                <StatCard title="Selected" value={pipelineStats.Selected} color="bg-purple-100" />
                <StatCard title="Joined" value={pipelineStats.Joined} color="bg-green-100" />
                <StatCard title="Rejected" value={pipelineStats.Rejected} color="bg-red-100" />
                <StatCard title="Quit" value={pipelineStats.Quit} color="bg-pink-100" />
            </div>
        </div>
    );
};

export default SelectionPipelineReportView;
