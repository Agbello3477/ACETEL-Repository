
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://127.0.0.1:5001/api/theses';
const LOGIN_URL = 'http://127.0.0.1:5001/api/auth/login';

const runTest = async () => {
    try {
        // 1. Login as Super Admin
        console.log('Logging in...');
        const loginRes = await axios.post(LOGIN_URL, {
            email: 'superadmin@acetel.noun.edu.ng',
            password: 'SuperAdmin2024!'
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully.');

        // 2. Prepare Form Data for Legacy Upload
        const form = new FormData();
        form.append('title', 'Legacy Thesis Verification ' + Date.now());
        form.append('abstract', 'This is a test abstract for an unregistered student upload.');
        form.append('programme', 'Artificial Intelligence'); // Valid Enum
        form.append('user_programme', 'Artificial Intelligence');
        form.append('degree', 'MSc');
        form.append('supervisor', 'Dr. Verification Bot');
        form.append('year', '2023');
        form.append('keywords', 'legacy,test,automation');

        // Critical Fields for Unregistered Student
        form.append('matric_number', 'LEGACY/002'); // Non-existent matric
        form.append('student_name', 'John Legacy Student'); // Manual name entry

        // Dummy PDF
        const pdfPath = path.join(__dirname, 'legacy_test.pdf');
        fs.writeFileSync(pdfPath, 'dummy pdf content for testing');
        form.append('pdf', fs.createReadStream(pdfPath));

        // 3. Upload
        console.log('Uploading Legacy Thesis...');
        const uploadRes = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload Success!', uploadRes.status);
        console.log('Thesis Data:', {
            id: uploadRes.data.thesis_id,
            title: uploadRes.data.title,
            author_name: uploadRes.data.author_name, // Should be 'John Legacy Student'
            matric_number: uploadRes.data.matric_number,
            author_id: uploadRes.data.author_id // Should be null
        });

        // Cleanup
        fs.unlinkSync(pdfPath);

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

runTest();
