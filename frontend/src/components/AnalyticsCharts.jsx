import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsCharts = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
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

    if (loading) return (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium italic">Generating insights from repository...</p>
        </div>
    );

    if (!data) return (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <p className="text-gray-500 font-medium">Analytics currently unavailable.</p>
        </div>
    );

    const hasYearData = data.yearData && data.yearData.length > 0;
    const hasProgData = data.programmeData && data.programmeData.length > 0;

    return (
        <div className="space-y-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Theses</h3>
                    <p className="text-3xl font-extrabold text-blue-600">{data.total}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Approved</h3>
                    <p className="text-3xl font-extrabold text-green-600">{data.statusDistribution.Approved || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Submitted</h3>
                    <p className="text-3xl font-extrabold text-amber-600">{data.statusDistribution.Submitted || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow border-l-4 border-l-gray-400">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Drafts</h3>
                    <p className="text-3xl font-extrabold text-gray-700">{data.statusDistribution.Draft || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Year Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center">
                        <span className="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
                        Theses by Year (Approved)
                    </h3>
                    <div className="h-72 w-full flex items-center justify-center">
                        {hasYearData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.yearData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-gray-400">
                                <p className="text-sm italic">No approved theses found to chart.</p>
                                <p className="text-xs mt-1">Status must be set to "Approved" to reflect here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart: Programme Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></span>
                        Programme Distribution
                    </h3>
                    <div className="h-72 w-full flex items-center justify-center">
                        {hasProgData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.programmeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => {
                                            let label = name;
                                            if (name === 'Artificial Intelligence') label = 'AI';
                                            if (name === 'Management Information System') label = 'MIS';
                                            if (name === 'Cyber Security') label = 'CyberSec';
                                            return `${label} ${(percent * 100).toFixed(0)}%`;
                                        }}
                                        outerRadius="80%"
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {data.programmeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-gray-400">
                                <p className="text-sm italic">No programme data available (Approved only).</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
