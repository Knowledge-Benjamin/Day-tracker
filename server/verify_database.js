require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function verifyDatabase() {
    const client = await pool.connect();
    try {
        console.log('✅ Connected to Neon database successfully!\n');

        // Get all tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('📊 Tables in database:');
        console.log('═══════════════════════════════════════\n');

        for (const row of tablesResult.rows) {
            const tableName = row.table_name;

            // Get column count
            const columnsResult = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.columns 
                WHERE table_name = $1;
            `, [tableName]);

            // Get row count
            const rowCountResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName};`);

            console.log(`📋 Table: ${tableName}`);
            console.log(`   Columns: ${columnsResult.rows[0].count}`);
            console.log(`   Rows: ${rowCountResult.rows[0].count}`);
            console.log('');
        }

        console.log('═══════════════════════════════════════');
        console.log(`\n✅ Total tables: ${tablesResult.rows.length}`);
        console.log('\n🎉 Database setup verification complete!');

    } catch (err) {
        console.error('❌ Error verifying database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyDatabase();
