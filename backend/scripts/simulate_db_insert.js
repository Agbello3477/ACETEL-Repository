const db = require('../config/db');

async function simulateInsert() {
    console.log('--- SIMULATING THESIS INSERT ---');
    
    // Exact data format expected from frontend
    const data = {
        title: 'Simulation Test Thesis',
        abstract: 'This is a test abstract.',
        keywords: 'test, debug, academic',
        author_id: null, // Simulate legacy/admin upload
        author_name_val: 'Test Student',
        author_matric_val: 'NOUN/TEST/001',
        supervisorsArray: ['Supervisor One', 'Supervisor Two'],
        dbProgramme: 'Artificial Intelligence',
        degree: 'MSc',
        graduationYearInt: 2024,
        pdf_url: 'https://res.cloudinary.com/dummy/pdf',
        public_id: 'ADTRS/test/id',
        fileHash: 'abcdef123456',
        thesisStatus: 'Submitted'
    };

    try {
        const query = 'INSERT INTO theses (title, abstract, keywords, author_id, author_name, matric_number, supervisors, programme, degree, graduation_year, pdf_url, public_id, file_hash, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *';
        const params = [
            data.title, 
            data.abstract, 
            data.keywords.split(',').map(k => k.trim()), 
            data.author_id, 
            data.author_name_val, 
            data.author_matric_val, 
            data.supervisorsArray, 
            data.dbProgramme, 
            data.degree, 
            data.graduationYearInt, 
            data.pdf_url, 
            data.public_id, 
            data.fileHash, 
            data.thesisStatus
        ];

        const res = await db.query(query, params);
        console.log('SIMULATION SUCCESS: Thesis ID', res.rows[0].thesis_id);
        
        // Cleanup
        await db.query('DELETE FROM theses WHERE thesis_id = $1', [res.rows[0].thesis_id]);
        console.log('CLEANUP SUCCESS');
    } catch (e) {
        console.error('SIMULATION FAILED!');
        console.error('Error Message:', e.message);
        console.error('Detail:', e.detail);
        console.error('Hint:', e.hint);
        console.error('Code:', e.code);
    }
    process.exit(0);
}

simulateInsert();
