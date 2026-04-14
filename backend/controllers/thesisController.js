const db = require('../config/db');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Helper to calculate file hash from buffer
const getBufferHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Helper: Stream Upload to Cloudinary
const streamUpload = (req, folder) => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return reject(new Error('Cloudinary not configured'));
        }

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `ADTRS/${folder}`,
                upload_preset: 'adtrs_preset',   
                resource_type: 'image',         // Using 'image' for PDFs (required for public delivery)
                format: 'pdf',                  // Explicitly specifying PDF format
                access_mode: 'public',          
                type: 'upload',                 
                public_id: `file-${Date.now()}`
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
};

// Helper: Create Notification
const notifyUser = async (userId, message, type = 'info') => {
    if (!userId) return;
    try {
        await db.query(
            'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [userId, message, type]
        );
    } catch (err) {
        console.error('Notification Error:', err);
    }
};

// Helper: Notify Admins
const notifyAdmins = async (message, type = 'info') => {
    try {
        const admins = await db.query("SELECT user_id FROM users WHERE role IN ('Super Admin', 'Centre Admin')");
        for (const admin of admins.rows) {
            await notifyUser(admin.user_id, message, type);
        }
    } catch (err) {
        console.error('Admin Notification Error:', err);
    }
};

// @desc    Create new thesis
// @route   POST /api/theses
// @access  Private (Student) or (Admin)
const createThesis = async (req, res) => {
    // Frontend sends: title, abstract, keywords, supervisors (JSON), programme, year, status (optional), matric_number (optional for admin)
    const { title, abstract, keywords, supervisors, programme, year, status, matric_number } = req.body;
    let pdf_url = '';
    let fileHash = null;

    if (req.file) {
        fileHash = getBufferHash(req.file.buffer);

        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                const cloudResult = await streamUpload(req, 'theses');
                pdf_url = cloudResult.secure_url;
                console.log('Thesis uploaded to Cloudinary:', pdf_url);
            } catch (err) {
                console.error('Cloudinary Stream Error:', err);
                return res.status(500).json({ message: 'Error streaming to cloud storage' });
            }
        } else {
            // Fallback: Save to local disk manually since we used memoryStorage
            const filename = `thesis-${Date.now()}.pdf`;
            const localPath = path.join(process.cwd(), 'uploads', 'theses', filename);
            try {
                fs.writeFileSync(localPath, req.file.buffer);
                pdf_url = `uploads/theses/${filename}`;
            } catch (err) {
                console.error('Local Write Error:', err);
                return res.status(500).json({ message: 'Error saving file locally' });
            }
        }
    } else {
        return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    if (!title || !abstract || !programme || !year) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    // Parse Supervisors (expecting string, array, or JSON string)
    let supervisorsArray = [];
    try {
        if (supervisors) {
            if (Array.isArray(supervisors)) {
                supervisorsArray = supervisors;
            } else if (typeof supervisors === 'string' && supervisors.trim().startsWith('[')) {
                supervisorsArray = JSON.parse(supervisors);
            } else if (typeof supervisors === 'string') {
                // Handle as comma-separated or single value
                supervisorsArray = supervisors.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
    } catch (e) {
        console.error("Error parsing supervisors:", e);
        supervisorsArray = typeof supervisors === 'string' ? [supervisors] : [];
    }

    // Determine Author
    let author_id = req.user.user_id; // Default to logged in user
    let degree = 'MSc'; // Default

    // If Admin, check for matric_number
    if ((req.user.role === 'Centre Admin' || req.user.role === 'Super Admin') && matric_number) {
        try {
            const studentRes = await db.query('SELECT user_id, degree, full_name, matric_number FROM users WHERE matric_number = $1', [matric_number]);

            if (studentRes.rows.length > 0) {
                // STUDENT FOUND: Link them
                author_id = studentRes.rows[0].user_id;
                if (req.body.degree) degree = req.body.degree;
                else if (studentRes.rows[0].degree) degree = studentRes.rows[0].degree;
            } else {
                // STUDENT NOT FOUND: Legacy / Unregistered Upload
                if (!req.body.student_name) {
                    return res.status(400).json({ message: `Student with Matric No ${matric_number} not found. Please provide 'student_name' to create a legacy record.` });
                }
                author_id = null; // No user account
                if (req.body.degree) degree = req.body.degree;
            }
        } catch (err) {
            console.error('Error finding student:', err);
            return res.status(500).json({ message: 'Server error checking matric number' });
        }
    } else {
        // Normal Student Submission
        try {
            if (req.body.degree) degree = req.body.degree;
            else {
                const userRes = await db.query('SELECT degree FROM users WHERE user_id = $1', [req.user.user_id]);
                if (userRes.rows.length > 0 && userRes.rows[0].degree) {
                    degree = userRes.rows[0].degree;
                }
            }
        } catch (e) {
            console.error("Error fetching degree", e);
        }
    }

    // Map values to DB Schema
    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];

    // Programme mapping
    let dbProgramme = programme;
    if (programme === 'AI') dbProgramme = 'Artificial Intelligence';
    else if (programme === 'Cybersecurity') dbProgramme = 'Cyber Security';
    else if (programme === 'MIS') dbProgramme = 'Management Information System';

    // Determine status: 'Submitted' (default) or 'Draft'
    const thesisStatus = status === 'Draft' ? 'Draft' : 'Submitted';

    let author_name_val = '';
    let author_matric_val = '';

    if (author_id) {
        if (req.body.student_name) author_name_val = req.body.student_name;
        else {
            const u = await db.query('SELECT full_name, matric_number FROM users WHERE user_id = $1', [author_id]);
            author_name_val = u.rows[0].full_name;
            author_matric_val = u.rows[0].matric_number;
        }
    } else {
        // Unregistered
        author_name_val = req.body.student_name;
        author_matric_val = matric_number;
    }

    try {
        // Prevent Duplicate Matric Number Uploads
        if (author_matric_val) {
            const existingMatch = await db.query('SELECT thesis_id FROM theses WHERE matric_number = $1', [author_matric_val]);
            if (existingMatch.rows.length > 0) {
                return res.status(400).json({ message: `Upload Rejected: A thesis with Matric No. ${author_matric_val} already exists in the system.` });
            }
        }

        // 1. Insert Thesis
        const newThesis = await db.query(
            'INSERT INTO theses (title, abstract, keywords, author_id, author_name, matric_number, supervisors, programme, degree, graduation_year, pdf_url, file_hash, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
            [title, abstract, keywordsArray, author_id, author_name_val, author_matric_val, supervisorsArray, dbProgramme, degree, year, pdf_url, fileHash, thesisStatus]
        );

        const thesisId = newThesis.rows[0].thesis_id;

        // 2. Insert Audit Log
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target_id, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, 'THESIS_UPLOAD', thesisId, ip]
        );

        // 3. Notify Admins
        if (thesisStatus === 'Submitted') {
            await notifyAdmins(`New Thesis Submitted: "${title}" by ${author_name_val} (${matric_number})`);
        }

        res.status(201).json(newThesis.rows[0]);
    } catch (error) {
        console.error('CRITICAL THESIS UPLOAD ERROR:', error);
        
        // Return detailed error if in dev or helpful message
        res.status(500).json({ 
            message: 'Thesis upload failed on server', 
            details: error.message,
            hint: 'Please ensure the PDF is valid and all required fields are filled correctly.'
        });
    }
};

// @desc    Get user's theses
// @route   GET /api/theses/my-theses
// @access  Private
const getMyTheses = async (req, res) => {
    try {
        const theses = await db.query('SELECT * FROM theses WHERE author_id = $1 ORDER BY created_at DESC', [req.user.user_id]);
        res.status(200).json(theses.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get All Theses (Admin)
// @route   GET /api/theses
// @access  Private (Admin)
const getAllTheses = async (req, res) => {
    const { programme, year, status, q, startDate, endDate } = req.query;

    let queryText = 'SELECT t.*, u.full_name as author_account_name, u.matric_number as author_account_matric FROM theses t LEFT JOIN users u ON t.author_id = u.user_id WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    if (q) {
        queryText += ` AND (to_tsvector('english', t.title || ' ' || COALESCE(t.abstract, '') || ' ' || array_to_string(t.keywords, ' ')) @@ plainto_tsquery('english', $${paramCount}))`;
        queryParams.push(q);
        paramCount++;
    }

    if (programme) {
        let dbProg = programme;
        if (programme === 'AI') dbProg = 'Artificial Intelligence';
        else if (programme === 'Cybersecurity') dbProg = 'Cyber Security';
        else if (programme === 'MIS') dbProg = 'Management Information System';

        queryText += ` AND t.programme = $${paramCount}`;
        queryParams.push(dbProg);
        paramCount++;
    }

    if (year) {
        queryText += ` AND t.graduation_year = $${paramCount}`;
        queryParams.push(year);
        paramCount++;
    }

    if (status) {
        queryText += ` AND t.status::text = $${paramCount}`;
        queryParams.push(status);
        paramCount++;
    }

    if (startDate) {
        queryText += ` AND t.created_at >= $${paramCount}`;
        queryParams.push(startDate); // Expecting YYYY-MM-DD
        paramCount++;
    }

    if (endDate) {
        queryText += ` AND t.created_at <= $${paramCount}::date + interval '1 day'`; // Include the end date fully
        queryParams.push(endDate); // Expecting YYYY-MM-DD
        paramCount++;
    }

    queryText += ' ORDER BY t.created_at DESC';

    try {
        const result = await db.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Export Theses to CSV
// @route   GET /api/theses/export
// @access  Private (Admin)
const exportTheses = async (req, res) => {
    const { programme, year, status, q, startDate, endDate } = req.query;

    let queryText = 'SELECT t.*, u.full_name as author_account_name, u.matric_number as author_account_matric FROM theses t LEFT JOIN users u ON t.author_id = u.user_id WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    if (q) {
        // Safe check for q
        queryText += ` AND (to_tsvector('english', t.title || ' ' || COALESCE(t.abstract, '') || ' ' || array_to_string(t.keywords, ' ')) @@ plainto_tsquery('english', $${paramCount}))`;
        queryParams.push(q);
        paramCount++;
    }

    if (programme) {
        let dbProg = programme;
        if (programme === 'AI') dbProg = 'Artificial Intelligence';
        else if (programme === 'Cybersecurity') dbProg = 'Cyber Security';
        else if (programme === 'MIS') dbProg = 'Management Information System';

        queryText += ` AND t.programme = $${paramCount}`;
        queryParams.push(dbProg);
        paramCount++;
    }

    if (year) {
        queryText += ` AND t.graduation_year = $${paramCount}`;
        queryParams.push(year);
        paramCount++;
    }

    if (status) {
        queryText += ` AND t.status::text = $${paramCount}`;
        queryParams.push(status);
        paramCount++;
    }

    if (startDate) {
        queryText += ` AND t.created_at >= $${paramCount}`;
        queryParams.push(startDate);
        paramCount++;
    }

    if (endDate) {
        queryText += ` AND t.created_at <= $${paramCount}::date + interval '1 day'`;
        queryParams.push(endDate);
        paramCount++;
    }

    queryText += ' ORDER BY t.created_at DESC';

    try {
        const result = await db.query(queryText, queryParams);
        const theses = result.rows;

        if (!theses) {
            throw new Error("No data returned from database");
        }

        // Convert to CSV
        // Headers
        const headers = ['ID', 'Title', 'Author', 'Matric Number', 'Programme', 'Degree', 'Year', 'Status', 'Submission Date', 'Supervisors'];
        const csvRows = [headers.join(',')];

        theses.forEach(thesis => {
            // Helper to escape CSV fields
            const escape = (str) => {
                if (str === null || str === undefined) return '';
                return `"${String(str).replace(/"/g, '""')}"`;
            };

            const supervisorsRaw = thesis.supervisors;
            let supervisorStr = '';
            if (Array.isArray(supervisorsRaw)) {
                supervisorStr = supervisorsRaw.join('; ');
            } else if (supervisorsRaw) {
                supervisorStr = String(supervisorsRaw);
            }

            const row = [
                thesis.thesis_id,
                escape(thesis.title),
                escape(thesis.author_name || thesis.author_account_name),
                escape(thesis.matric_number || thesis.author_account_matric),
                escape(thesis.programme),
                escape(thesis.degree),
                thesis.graduation_year,
                thesis.status,
                thesis.created_at ? new Date(thesis.created_at).toISOString().split('T')[0] : '',
                escape(supervisorStr)
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="theses_export.csv"');
        res.status(200).send(csvString);

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ message: 'Server error generating export: ' + error.message });
    }
};

// @desc    Update Thesis (Edit Draft/Submitted)
// @route   PUT /api/theses/:id
// @access  Private (Author only)
const updateThesis = async (req, res) => {
    const { id } = req.params;
    const { title, abstract, keywords, supervisors, programme, year } = req.body;
    let pdf_url = null;
    let fileHash = null;

    if (req.file) {
        fileHash = getBufferHash(req.file.buffer);

        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                const cloudResult = await streamUpload(req, 'theses');
                pdf_url = cloudResult.secure_url;
            } catch (err) {
                console.error('Cloudinary Update Stream Error:', err);
                return res.status(500).json({ message: 'Error updating cloud storage' });
            }
        } else {
            const filename = `thesis-update-${Date.now()}.pdf`;
            const localPath = path.join(process.cwd(), 'uploads', 'theses', filename);
            try {
                fs.writeFileSync(localPath, req.file.buffer);
                pdf_url = `uploads/theses/${filename}`;
            } catch (err) {
                return res.status(500).json({ message: 'Error updating file locally' });
            }
        }
    }

    try {
        const thesisRes = await db.query('SELECT * FROM theses WHERE thesis_id = $1', [id]);
        if (thesisRes.rows.length === 0) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        const thesis = thesisRes.rows[0];

        if (thesis.author_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Not authorized to edit this thesis' });
        }

        if (['Approved', 'Locked'].includes(thesis.status)) {
            return res.status(403).json({ message: 'Cannot edit thesis after Approval' });
        }

        const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : thesis.keywords;

        // Parse Supervisors
        let supervisorsArray = thesis.supervisors;
        if (supervisors) {
            try {
                if (typeof supervisors === 'string' && supervisors.trim().startsWith('[')) {
                    supervisorsArray = JSON.parse(supervisors);
                } else {
                    supervisorsArray = [supervisors];
                }
            } catch (e) {
                supervisorsArray = [supervisors];
            }
        }

        let query = `
            UPDATE theses 
            SET title = $1, abstract = $2, keywords = $3, supervisors = $4, 
                programme = $5, graduation_year = $6, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [
            title || thesis.title,
            abstract || thesis.abstract,
            keywordsArray,
            supervisorsArray,
            programme || thesis.programme,
            year || thesis.graduation_year
        ];

        let paramCount = 7;
        if (pdf_url) {
            query += `, pdf_url = $${paramCount}, file_hash = $${paramCount + 1}`;
            params.push(pdf_url);
            params.push(fileHash);
            paramCount += 2;
        }

        query += ` WHERE thesis_id = $${paramCount} RETURNING *`;
        params.push(id);

        const updatedThesis = await db.query(query, params);

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target_id, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, 'THESIS_EDIT', id, ip]
        );

        res.status(200).json(updatedThesis.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Update Thesis Status
// @route   PUT /api/theses/:id/status
// @access  Private (Admin)
const updateThesisStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved', 'Locked', 'Submitted'

    if (!['Approved', 'Locked', 'Submitted', 'Draft'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const result = await db.query(
            'UPDATE theses SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE thesis_id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        const thesis = result.rows[0];

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target_id, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, `THESIS_${status.toUpperCase()}`, id, ip]
        );

        // Notify Student
        if (thesis.author_id) {
            await notifyUser(
                thesis.author_id,
                `Your thesis "${thesis.title}" status has been updated to: ${status}`,
                status === 'Approved' ? 'success' : 'info'
            );
        }

        res.status(200).json(thesis);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Public Theses
// @route   GET /api/theses/public
// @access  Public
const getPublicTheses = async (req, res) => {
    try {
        const { q, programme, year } = req.query;
        const params = [];
        let query = `
            SELECT thesis_id, title, abstract, author_name, 
                   programme, degree, graduation_year, keywords, pdf_url, supervisors
            FROM theses 
            WHERE status = 'Approved'
        `;

        if (q && q.trim() !== '') {
            params.push(`%${q.trim()}%`);
            query += ` AND (title ILIKE $${params.length} OR abstract ILIKE $${params.length} OR author_name ILIKE $${params.length})`;
        }
        if (programme && programme.trim() !== '') {
            params.push(programme.trim());
            query += ` AND programme = $${params.length}`;
        }
        if (year && year.trim() !== '') {
            params.push(year.trim());
            query += ` AND graduation_year::text = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching public theses' });
    }
};

// @desc    Get Single Public Thesis
// @route   GET /api/theses/public/:id
// @access  Public
const getPublicThesisById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT thesis_id, title, abstract, author_name, 
                   programme, degree, graduation_year, keywords, pdf_url, created_at, supervisors
            FROM theses 
            WHERE thesis_id = $1 AND status = 'Approved'
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Thesis not found or not public' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete Thesis
// @route   DELETE /api/theses/:id
// @access  Private (Admin only)
const deleteThesis = async (req, res) => {
    const { id } = req.params;

    try {
        // First delete audit logs for this thesis to avoid FK issues if any
        await db.query('DELETE FROM audit_logs WHERE target_id = $1 AND action LIKE $2', [id, 'THESIS_%']);
        
        const result = await db.query('DELETE FROM theses WHERE thesis_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        // Audit Log for deletion
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target_id, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, 'THESIS_DELETED', id, ip]
        );

        res.status(200).json({ message: 'Thesis deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createThesis,
    getMyTheses,
    getAllTheses,
    updateThesis,
    updateThesisStatus,
    getPublicTheses,
    getPublicThesisById,
    exportTheses,
    deleteThesis
};
