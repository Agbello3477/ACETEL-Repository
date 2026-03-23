import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

const PublicationAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/analytics/publications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to load publication analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-4 text-center">Loading publication insights...</div>;
    if (!data) return <div className="p-4 text-center text-gray-500">Analytics unavailable</div>;

    return (
        <div className="space-y-8 mb-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow border-l-4 border-indigo-500">
                    <h3 className="text-gray-500 text-sm">Total Publications</h3>
                    <p className="text-2xl font-bold">{data.total}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-pink-500">
                    <h3 className="text-gray-500 text-sm">Unique Journals</h3>
                    <p className="text-2xl font-bold">{data.uniqueJournals}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm">With PDF</h3>
                    <p className="text-2xl font-bold">{data.pdfCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Year Trend */}
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Publications by Year</h3>
                    <div className="h-64 flex justify-center">
                        <BarChart width={500} height={250} data={data.yearData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Bar dataKey="count" fill="#8B5CF6" name="Publications" />
                        </BarChart>
                    </div>
                </div>

                {/* Pie Chart: Top Journals */}
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Top Journals</h3>
                    <div className="h-64 flex justify-center">
                        <PieChart width={400} height={250}>
                            <Pie
                                data={data.journalData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => {
                                    // Shorten long journal names if needed
                                    let label = name ? name.substring(0, 15) : 'Unknown';
                                    if (name && name.length > 15) label += '...';
                                    return `${label} ${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.journalData.map((entry, index) => (
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

export default PublicationAnalytics;
