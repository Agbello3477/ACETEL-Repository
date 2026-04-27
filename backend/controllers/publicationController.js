const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig');
// streamifier no longer needed as we use fs.createReadStream from Disk

// No longer using custom stream helper as we now use SDK's atomic upload from /tmp disk
const streamUpload = null; // Removed to prevent accidental usage

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
                // Atomic SDK Upload
                const path = require('path');
                const fs = require('fs');
                
                // Physically rename the file locally
                const newLocalPath = req.file.path.replace(/\.pdf$/i, '.dat');
                fs.renameSync(req.file.path, newLocalPath);

                const cloudResult = await cloudinary.uploader.upload(newLocalPath, {
                    folder: 'ADTRS/publications',
                    resource_type: 'raw'
                });

                pdf_url = cloudResult.secure_url;
                public_id = cloudResult.public_id;
                console.log('Publication uploaded Atomics:', public_id);

                // Immediate cleanup of successfully processed file
                try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
            } catch (err) {
                console.error('Cloudinary Pub Atomic Error:', err);
                // Cleanup on error
                try { if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
                return res.status(500).json({ message: 'Error uploading to cloud storage', error: err.message });
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
            secure: true,
            resource_type: 'raw'
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

// @desc    Get Single Publication (Public)
// @route   GET /api/publications/public/:id
// @access  Public
const getPublicPublicationById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM publications WHERE publication_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        res.status(200).json(signUrlIfAvailable(result.rows[0]));
    } catch (error) {
        console.error('Fetch Single Publication Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Stream Publication PDF (Public)
// @route   GET /api/publications/public/:id/stream
// @access  Public
const getPublicPublicationStream = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT pdf_url, public_id FROM publications WHERE publication_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        
        const pub = result.rows[0];
        if (!pub.pdf_url) {
            return res.status(404).json({ message: 'PDF not available for this publication' });
        }

        // Standardize Signed URL
        const signedPub = signUrlIfAvailable(pub);
        const targetUrl = signedPub.pdf_url;

        if (!pub.public_id || !process.env.CLOUDINARY_CLOUD_NAME) {
            // Local fallback
            if (fs.existsSync(targetUrl)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline');
                return fs.createReadStream(targetUrl).pipe(res);
            }
            return res.status(404).json({ message: 'Local PDF not found' });
        }

        const axios = require('axios');
        const cloudRes = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        cloudRes.data.pipe(res);
        
    } catch (error) {
        console.error('Publication Stream Error:', error);
        res.status(500).json({ message: 'Streaming failed' });
    }
};

// @desc    Update Publication
// @route   PUT /api/publications/:id
// @access  Private (Admin)
const updatePublication = async (req, res) => {
    const { id } = req.params;
    const { title, abstract, authors, journal_name, doi, volume, issue, pages, publication_date, keywords, external_link } = req.body;
    let pdf_url = null;
    let public_id = null;

    if (req.file) {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                const newLocalPath = req.file.path.replace(/\.pdf$/i, '.dat');
                fs.renameSync(req.file.path, newLocalPath);
                const cloudResult = await cloudinary.uploader.upload(newLocalPath, {
                    folder: 'ADTRS/publications',
                    resource_type: 'raw'
                });
                pdf_url = cloudResult.secure_url;
                public_id = cloudResult.public_id;
                try { if (fs.existsSync(newLocalPath)) fs.unlinkSync(newLocalPath); } catch (e) {}
            } catch (err) {
                console.error('Cloudinary Update Error:', err);
                return res.status(500).json({ message: 'Error updating cloud storage' });
            }
        }
    }

    try {
        const pubRes = await db.query('SELECT * FROM publications WHERE publication_id = $1', [id]);
        if (pubRes.rows.length === 0) return res.status(404).json({ message: 'Publication not found' });
        const pub = pubRes.rows[0];

        // Parse Authors and Keywords
        let authorsArray = pub.authors;
        if (authors) {
            try {
                authorsArray = typeof authors === 'string' && authors.trim().startsWith('[') ? JSON.parse(authors) : authors.split(',').map(a => a.trim());
            } catch (e) { authorsArray = authors.split(',').map(a => a.trim()); }
        }

        const keywordsArray = keywords ? keywords.split(',').map(k => k.trim()) : pub.keywords;
        const pubDate = publication_date ? new Date(publication_date) : pub.publication_date;

        let query = `
            UPDATE publications 
            SET title = $1, abstract = $2, authors = $3, journal_name = $4, 
                doi = $5, volume = $6, issue = $7, pages = $8, 
                publication_date = $9, keywords = $10, external_link = $11, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [
            title || pub.title,
            abstract || pub.abstract,
            authorsArray,
            journal_name || pub.journal_name,
            doi || pub.doi,
            volume || pub.volume,
            issue || pub.issue,
            pages || pub.pages,
            pubDate,
            keywordsArray,
            external_link || pub.external_link
        ];

        let paramCount = 12;
        if (pdf_url) {
            query += `, pdf_url = $${paramCount}, public_id = $${paramCount + 1}`;
            params.push(pdf_url, public_id);
            paramCount += 2;
        }

        query += ` WHERE publication_id = $${paramCount} RETURNING *`;
        params.push(id);

        const updatedPub = await db.query(query, params);
        
        // Audit Log
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.query(
            'INSERT INTO audit_logs (user_id, action, target_id, ip_address) VALUES ($1, $2, $3, $4)',
            [req.user.user_id, 'PUBLICATION_EDIT', id, ip]
        );

        res.status(200).json(updatedPub.rows[0]);
    } catch (error) {
        console.error('Update Publication Error:', error);
        res.status(500).json({ message: 'Server error' });
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
    getPublicPublicationById,
    getPublicPublicationStream,
    updatePublication,
    deletePublication,
    exportPublications
};
