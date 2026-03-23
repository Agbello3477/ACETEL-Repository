const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:5001/api/theses';
const LOGIN_URL = 'http://localhost:5001/api/auth/login';
const ADMIN_EMAIL = 'superadmin@acetel.noun.edu.ng';
const ADMIN_PASS = 'SuperAdmin2024!';

const runTest = async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(LOGIN_URL, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token received.');

        // 2. Prepare Form Data
        const form = new FormData();
        form.append('title', 'API Test Unregistered Thesis');
        form.append('abstract', 'This is a test abstract via API script.');
        form.append('keywords', 'api, test, script');
        form.append('supervisor', 'Dr. API Script');
        form.append('programme', 'Artificial Intelligence');
        form.append('degree', 'MSc');
        form.append('year', '2025');
        form.append('status', 'Submitted');

        // Critical Fields for Unregistered
        form.append('matric_number', 'TEST/API/001'); // Non-existent
        form.append('student_name', 'API Test Student');

        // Create dummy PDF
        const pdfPath = path.join(__dirname, 'dummy.pdf');
        fs.writeFileSync(pdfPath, 'dummy pdf content');
        form.append('pdf', fs.createReadStream(pdfPath));

        // 3. Upload
        console.log('Uploading Thesis...');
        const uploadRes = await axios.post(API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Upload Success!', uploadRes.status);
        console.log('Response:', uploadRes.data);

        // Cleanup
        fs.unlinkSync(pdfPath);

    } catch (error) {
        console.error('Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
};

runTest();
