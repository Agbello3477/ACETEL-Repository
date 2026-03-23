const http = require('http');

const BASE_HOST = 'localhost';
const BASE_PORT = 5001;
const BASE_PATH = '/api/auth/register';

const uniqueId = Date.now();
const email = `test_dup_${uniqueId}@noun.edu.ng`;
const matricNo = `NOUN/24/${uniqueId}`;

function postRequest(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: BASE_HOST,
            port: BASE_PORT,
            path: BASE_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function testDuplicates() {
    console.log(`--- Testing Duplicate Prevention for ${email} ---`);

    // 1. Register First User (Should Succeed)
    console.log("1. Attempting First Registration...");
    const res1 = await postRequest({
        name: 'Test User 1',
        email,
        password: 'password123',
        role: 'student',
        matric_no: matricNo,
        programme: 'AI',
        degree_type: 'MSc'
    });

    if (res1.status === 201) {
        console.log("✅ First Registration Successful");
    } else {
        console.error("❌ First Registration Failed:", res1.data);
        process.exit(1);
    }

    // 2. Register Duplicate Email (Should Fail)
    console.log("\n2. Attempting Duplicate Email...");
    const res2 = await postRequest({
        name: 'Duplicate Email User',
        email, // Same email
        password: 'password123',
        role: 'student',
        matric_no: `NOUN/24/${uniqueId}_DIFF`,
        programme: 'AI',
        degree_type: 'MSc'
    });

    if (res2.status === 400 && res2.data.message.includes('User with this email already exists')) {
        console.log("✅ Duplicate Email Blocked Correctly");
    } else {
        console.error("❌ Duplicate Email Test Failed:", res2.status, res2.data);
    }

    // 3. Register Duplicate Matric Number (Should Fail)
    const email2 = `test_dup_matric_${uniqueId}@noun.edu.ng`;
    console.log(`\n3. Attempting Duplicate Matric Number (${matricNo}) with new email (${email2})...`);

    const res3 = await postRequest({
        name: 'Duplicate Matric User',
        email: email2,
        password: 'password123',
        role: 'student',
        matric_no: matricNo, // Same matric as user 1
        programme: 'AI',
        degree_type: 'MSc'
    });

    if (res3.status === 400 && res3.data.message.includes('Matric Number already registered')) {
        console.log("✅ Duplicate Matric Number Blocked Correctly");
    } else {
        console.error("❌ Duplicate Matric Number Test Failed:", res3.status, res3.data);
    }

    console.log("\n--- Test Complete ---");
}

testDuplicates();
