const db = require('../config/db');

// @desc    Get Dashboard Statistics (Admin)
// @route   GET /api/analytics
// @access  Private (Admin)
const getDashboardOverview = async (req, res) => {
    try {
        // 1. Total Theses
        const totalReq = await db.query('SELECT COUNT(*) FROM theses');
        const total = parseInt(totalReq.rows[0].count);

        // 2. Status Breakdown
        const statusReq = await db.query(`
            SELECT status, COUNT(*) 
            FROM theses 
            GROUP BY status
        `);
        // Provide defaults
        const statusMap = { 'Submitted': 0, 'Approved': 0, 'Draft': 0, 'Locked': 0 };
        statusReq.rows.forEach(row => {
            statusMap[row.status] = parseInt(row.count);
        });

        // 3. Programme Breakdown (Grouped by Degree for Stacked Chart)
        const progReq = await db.query(`
            SELECT programme, COALESCE(degree, 'MSc') as degree, COUNT(*) 
            FROM theses 
            WHERE status = 'Approved' 
            GROUP BY programme, COALESCE(degree, 'MSc')
        `);
        
        // Transform into Stacked Format: [{ name: 'AI', MSc: 10, PhD: 5, total: 15 }, ...]
        const progMap = {};
        progReq.rows.forEach(row => {
            const prog = row.programme || 'Unknown';
            const degree = (row.degree === 'PhD') ? 'PhD' : 'MSc'; // Standardize
            const count = parseInt(row.count);

            if (!progMap[prog]) {
                progMap[prog] = { name: prog, MSc: 0, PhD: 0, total: 0 };
            }
            progMap[prog][degree] += count;
            progMap[prog].total += count;
        });

        const programmeData = Object.values(progMap).sort((a,b) => b.total - a.total);

        // 4. Yearly Trend
        const yearReq = await db.query(`
            SELECT graduation_year, COUNT(*) 
            FROM theses 
            WHERE status = 'Approved'
            GROUP BY graduation_year 
            ORDER BY graduation_year ASC
        `);
        const yearData = yearReq.rows.map(row => ({
            name: row.graduation_year.toString(),
            count: parseInt(row.count)
        }));

        res.status(200).json({
            total,
            statusDistribution: statusMap,
            programmeData,
            yearData
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

// @desc    Get Publication Statistics (Admin)
// @route   GET /api/analytics/publications
// @access  Private (Admin)
const getPublicationAnalytics = async (req, res) => {
    try {
        // 1. Total Publications
        const totalReq = await db.query('SELECT COUNT(*) FROM publications');
        const total = parseInt(totalReq.rows[0].count);

        // 2. Unique Journals
        const journalReq = await db.query('SELECT COUNT(DISTINCT journal_name) FROM publications');
        const uniqueJournals = parseInt(journalReq.rows[0].count);

        // 3. Publications with PDFs
        const pdfReq = await db.query('SELECT COUNT(*) FROM publications WHERE pdf_url IS NOT NULL');
        const pdfCount = parseInt(pdfReq.rows[0].count);

        // 4. Bar Chart: Yearly Trend
        const yearReq = await db.query(`
            SELECT EXTRACT(YEAR FROM publication_date) as pub_year, COUNT(*) 
            FROM publications 
            WHERE publication_date IS NOT NULL
            GROUP BY pub_year 
            ORDER BY pub_year ASC
        `);
        const yearData = yearReq.rows.map(row => ({
            name: row.pub_year.toString(),
            count: parseInt(row.count)
        }));

        // 5. Pie Chart: Top Journals
        const topJournalReq = await db.query(`
            SELECT journal_name, COUNT(*) 
            FROM publications 
            GROUP BY journal_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 5
        `);
        const journalData = topJournalReq.rows.map(row => ({
            name: row.journal_name,
            value: parseInt(row.count)
        }));

        res.status(200).json({
            total,
            uniqueJournals,
            pdfCount,
            yearData,
            journalData
        });

    } catch (error) {
        console.error("Publication Analytics Error:", error);
        res.status(500).json({ message: 'Server error fetching publication analytics' });
    }
};

// @desc    Get Activity Logs (Admin)
// @route   GET /api/analytics/logs
// @access  Private (Admin)
const getActivityLogs = async (req, res) => {
    try {
        const logsReq = await db.query(`
            SELECT a.log_id, a.action, a.target_id, a.ip_address, a.timestamp,
                   u.full_name as user_name, u.role as user_role, u.staff_id, u.email
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.timestamp DESC
            LIMIT 200
        `);
        res.status(200).json(logsReq.rows);
    } catch (error) {
        console.error("Activity Logs Error:", error);
        res.status(500).json({ message: 'Server error fetching activity logs' });
    }
};

module.exports = {
    getDashboardOverview,
    getPublicationAnalytics,
    getActivityLogs
};
