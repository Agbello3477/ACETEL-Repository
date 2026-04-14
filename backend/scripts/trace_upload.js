const db = require('../config/db');
const cloudinary = require('cloudinary').v2;

async function testTrace() {
    console.log('--- STARTING UPLOAD TRACE ---');
    
    // 1. Check Env
    console.log('Cloudinary Config:', {
        cloud: !!process.env.CLOUDINARY_CLOUD_NAME,
        key: !!process.env.CLOUDINARY_API_KEY,
        secret: !!process.env.CLOUDINARY_API_SECRET
    });

    // 2. Test DB Connection
    try {
        const res = await db.query('SELECT NOW()');
        console.log('DB Connection: Success', res.rows[0].now);
    } catch (e) {
        console.error('DB Connection: FAIL', e.message);
        process.exit(1);
    }

    // 3. Test Signature Generation (This often fails if secret is missing/wrong)
    try {
        const signedUrl = cloudinary.url('dummy-id', {
            sign_url: true,
            type: 'authenticated',
            secure: true,
            resource_type: 'image'
        });
        console.log('Signature Generation: Success', signedUrl.substring(0, 50) + '...');
    } catch (e) {
        console.error('Signature Generation: FAIL', e.message);
    }

    // 4. Test DB Insert (The most likely culprit)
    try {
        console.log('Attempting Trial DB Insert with public_id...');
        const res = await db.query(
            'INSERT INTO theses (title, abstract, keywords, author_name, programme, degree, graduation_year, pdf_url, public_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING thesis_id',
            ['Trace Test', 'Test Abstract', ['test'], 'Test Author', 'Artificial Intelligence', 'MSc', 2024, 'http://test.com', 'test-id', 'Draft']
        );
        console.log('DB Insert: Success, Thesis ID:', res.rows[0].thesis_id);
        
        // Cleanup
        await db.query('DELETE FROM theses WHERE thesis_id = $1', [res.rows[0].thesis_id]);
        console.log('Cleanup: Success');
    } catch (e) {
        console.error('DB Insert: FAIL', e.message);
        console.error('Detail:', e.detail);
        console.error('Code:', e.code);
    }

    process.exit(0);
}

testTrace();
