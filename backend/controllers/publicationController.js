const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig');
// streamifier no longer needed as we use fs.createReadStream from Disk

// Helper: Stream Upload to Cloudinary (Zero-RAM)
const streamUpload = (req, folder) => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return reject(new Error('Cloudinary not configured'));
        }

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `ADTRS/${folder}`,
                upload_preset: 'adtrs_preset',   
                resource_type: 'image',         
                format: 'pdf',
                type: 'authenticated',          // High-security: only signed URLs can access
                public_id: `file-${Date.now()}`
            },
            (error, result) => {
                // Cleanup temp file after attempt
                if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                
                if (result) resolve(result);
                else reject(error);
            }
        );

        if (req.file && req.file.path) {
            fs.createReadStream(req.file.path).pipe(stream);
        } else {
            reject(new Error("No file path found for streaming"));
        }
    });
};

// @desc    Upload new publication
// @route   POST /api/publications
// @access  Private (Admin)
const createPublication = async (req, res) => {
    const { title, abstract, authors, journal_name, doi, volume, issue, pages, publication_date, keywords, external_link } = req.body;
    let pdf_url = null;
    let public_id = null;

    if (req.file) {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                const cloudResult = await streamUpload(req, 'publications');
                pdf_url = cloudResult.secure_url;
                public_id = cloudResult.public_id;
            } catch (err) {
                console.error('Cloudinary Pub Stream Error:', err);
                // Cleanup temp file even on error
                if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                    try { fs.unlinkSync(req.file.path); } catch (e) {}
                }
                return res.status(500).json({ message: 'Error streaming to cloud storage', error: err.message });
            }
        } else {
            // Local fallback (file is already in /tmp, move it)
            const filename = `pub-${Date.now()}.pdf`;
            const destPath = path.join('/tmp', filename);

            try {
                fs.renameSync(req.file.path, destPath);
                pdf_url = `/tmp/${filename}`;
            } catch (err) {
                console.error('Local Move Error:', err);
                return res.status(500).json({ message: 'Error saving file locally', error: err.message });
            }
        }
    }

    if (!title || !journal_name) {
        return res.status(400).json({ message: 'Title and Journal Name are required fields' });
    }

    // Parse Authors and Keywords
    let authorsArray = [];
    if (authors) {
        try {
            if (typeof authors === 'string' && authors.trim().startsWith('[')) {
                authorsArray = JSON.parse(authors);
            } else {
                authorsArray = authors.split(',').map(a => a.trim());
            }
        } catch (e) {
            authorsArray = authors.split(',').map(a => a.trim());
        }
    }

    const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    // Convert date or set null
    const pubDate = publication_date ? new Date(publication_date) : null;

    try {
        const newPub = await db.query(
            `INSERT INTO publications 
            (title, abstract, authors, journal_name, doi, volume, issue, pages, publication_date, keywords, pdf_url, public_id, external_link, uploaded_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [title, abstract, authorsArray, journal_name, doi, volume, issue, pages, pubDate, keywordsArray, pdf_url, public_id, external_link, req.user.user_id]
        );

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target_id, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, 'PUBLICATION_UPLOAD', newPub.rows[0].publication_id, ip]
        );

        res.status(201).json(newPub.rows[0]);
    } catch (error) {
        console.error('Create Publication Error:', error);
        res.status(500).json({ 
            message: 'Publication upload failed on database', 
            error: error.message,
            detail: error.detail,
            hint: 'Check if dates and required fields are in the correct format.'
        });
    }
};

// Helper: Signing URLs for delivery
const signUrlIfAvailable = (pub) => {
    if (pub.public_id && process.env.CLOUDINARY_CLOUD_NAME) {
        pub.pdf_url = cloudinary.url(pub.public_id, {
            sign_url: true,
            type: 'authenticated',
            secure: true,
            resource_type: 'image'
        });
    }
    return pub;
};

// @desc    Get All Publications (Admin & Public)
// @route   GET /api/publications
// @route   GET /api/publications/public
// @access  Public / Private
const getPublications = async (req, res) => {
    const { q, journal, year } = req.query;

    let queryText = 'SELECT * FROM publications WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    if (q) {
        queryText += ` AND (to_tsvector('english', title || ' ' || COALESCE(abstract, '') || ' ' || array_to_string(keywords, ' ') || ' ' || array_to_string(authors, ' ')) @@ plainto_tsquery('english', $${paramCount}))`;
        queryParams.push(q);
        paramCount++;
    }

    if (journal) {
        queryText += ` AND journal_name ILIKE $${paramCount}`;
        queryParams.push(`%${journal}%`);
        paramCount++;
    }

    if (year) {
        queryText += ` AND EXTRACT(YEAR FROM publication_date) = $${paramCount}`;
        queryParams.push(year);
        paramCount++;
    }

    queryText += ' ORDER BY publication_date DESC, created_at DESC';

    try {
        const result = await db.query(queryText, queryParams);
        const publications = result.rows.map(p => signUrlIfAvailable(p));
        res.status(200).json(publications);
    } catch (error) {
        console.error('Fetch Publications Error:', error);
        res.status(500).json({ message: 'Server error fetching publications: ' + error.message });
    }
};

// @desc    Delete Publication
// @route   DELETE /api/publications/:id
// @access  Private (Admin)
const deletePublication = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM publications WHERE publication_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        res.status(200).json({ message: 'Publication deleted successfully' });
    } catch (error) {
        console.error('Delete Publication Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Export Publications to CSV
// @route   GET /api/publications/export
// @access  Private (Admin)
const exportPublications = async (req, res) => {
    const { q, journal, year } = req.query;

    let queryText = 'SELECT * FROM publications WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    if (q) {
        queryText += ` AND (to_tsvector('english', title || ' ' || COALESCE(abstract, '') || ' ' || array_to_string(keywords, ' ') || ' ' || array_to_string(authors, ' ')) @@ plainto_tsquery('english', $${paramCount}))`;
        queryParams.push(q);
        paramCount++;
    }

    if (journal) {
        queryText += ` AND journal_name ILIKE $${paramCount}`;
        queryParams.push(`%${journal}%`);
        paramCount++;
    }

    if (year) {
        queryText += ` AND EXTRACT(YEAR FROM publication_date) = $${paramCount}`;
        queryParams.push(year);
        paramCount++;
    }

    queryText += ' ORDER BY publication_date DESC, created_at DESC';

    try {
        const result = await db.query(queryText, queryParams);
        const publications = result.rows;

        // Headers
        const headers = ['ID', 'Title', 'Authors', 'Journal', 'DOI', 'Volume', 'Issue', 'Pages', 'Date', 'Keywords'];
        const csvRows = [headers.join(',')];

        publications.forEach(pub => {
            const escape = (str) => {
                if (str === null || str === undefined) return '';
                return `"${String(str).replace(/"/g, '""')}"`;
            };

            let authorStr = '';
            if (Array.isArray(pub.authors)) {
                authorStr = pub.authors.join('; ');
            } else if (pub.authors) {
                authorStr = String(pub.authors);
            }

            let keywordStr = '';
            if (Array.isArray(pub.keywords)) {
                keywordStr = pub.keywords.join('; ');
            } else if (pub.keywords) {
                keywordStr = String(pub.keywords);
            }

            const row = [
                pub.publication_id,
                escape(pub.title),
                escape(authorStr),
                escape(pub.journal_name),
                escape(pub.doi),
                escape(pub.volume),
                escape(pub.issue),
                escape(pub.pages),
                pub.publication_date ? new Date(pub.publication_date).toISOString().split('T')[0] : '',
                escape(keywordStr)
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="publications_export.csv"');
        res.status(200).send(csvString);

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ message: 'Server error generating export: ' + error.message });
    }
};

module.exports = {
    createPublication,
    getPublications,
    deletePublication,
    exportPublications
};
