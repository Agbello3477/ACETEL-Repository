const { Client } = require('pg');
const os = require('os');

const username = os.userInfo().username;

const candidates = [
    `postgres://postgres:postgres@localhost:5432/postgres`,
    `postgres://postgres:password@localhost:5432/postgres`,
    `postgres://postgres:123456@localhost:5432/postgres`,
    `postgres://postgres:@localhost:5432/postgres`, // Empty password
    `postgres://${username}:@localhost:5432/postgres`, // System user, empty password
    `postgres://${username}:postgres@localhost:5432/postgres`
];

async function checkConnection() {
    console.log("Testing connections...");
    for (const url of candidates) {
        const client = new Client({ connectionString: url, connectionTimeoutMillis: 2000 });
        try {
            await client.connect();
            console.log(`SUCCESS: Connected with ${url}`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.log(`Failed: ${url}`);
            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        }
    }
    console.log("All attempts failed.");
    process.exit(1);
}

checkConnection();
