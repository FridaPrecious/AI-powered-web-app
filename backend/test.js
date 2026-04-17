

require('dotenv').config();
const pool = require('./db');

async function test() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connected!', result.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

test();