import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsCharts = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/analytics', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-4 text-center">Loading insights...</div>;
    if (!data) return <div className="p-4 text-center text-gray-500">Analytics unavailable</div>;

    return (
        <div className="space-y-8 mb-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm">Total Theses</h3>
                    <p className="text-2xl font-bold">{data.total}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm">Approved</h3>
                    <p className="text-2xl font-bold">{data.statusDistribution.Approved || 0}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-sm">Submitted</h3>
                    <p className="text-2xl font-bold">{data.statusDistribution.Submitted || 0}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-gray-500">
                    <h3 className="text-gray-500 text-sm">Drafts</h3>
                    <p className="text-2xl font-bold">{data.statusDistribution.Draft || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Year Trend */}
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Theses by Year (Approved)</h3>
                    <div className="h-64 flex justify-center">
                        <BarChart width={500} height={250} data={data.yearData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            {/* Tooltip disabled to prevent React 19 crash */}
                            {/* <Tooltip /> */}
                            <Bar dataKey="count" fill="#4F46E5" name="Theses" />
                        </BarChart>
                    </div>
                </div>

                {/* Pie Chart: Programme Distribution */}
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Programme Distribution</h3>
                    <div className="h-64 flex justify-center">
                        <PieChart width={400} height={250}>
                            <Pie
                                data={data.programmeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => {
                                    // Acronyms for Chart Labels
                                    let label = name;
                                    if (name === 'Artificial Intelligence') label = 'AI';
                                    if (name === 'Management Information System') label = 'MIS';
                                    if (name === 'Cyber Security') label = 'CyberSec';
                                    return `${label} ${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.programmeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
