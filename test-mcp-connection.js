#!/usr/bin/env node

/**
 * Test script to verify Supabase MCP server connection
 * This script tests basic connectivity and lists public schema tables
 */

const SUPABASE_URL = 'https://vps.supabase.siges-app.com.br/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.vlOy4XAytmdKQZGBvbSbAHsDLVn5au_sRty10rBJweo';

async function testConnection() {
    console.log('🔍 Testing Supabase Connection...\n');
    console.log(`URL: ${SUPABASE_URL}`);
    console.log('─'.repeat(50));
    
    try {
        // Test 1: Basic REST API connectivity
        console.log('\n📡 Test 1: REST API Connectivity');
        const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        console.log(`Status: ${healthResponse.status} ${healthResponse.statusText}`);
        
        if (!healthResponse.ok) {
            console.log('❌ Failed to connect to Supabase REST API');
            console.log('\nTroubleshooting tips:');
            console.log('1. Check if your VPS is accessible');
            console.log('2. Verify the URL is correct');
            console.log('3. Ensure CORS is configured properly');
            return false;
        }
        
        console.log('✅ REST API is accessible\n');
        
        // Test 2: Try to discover what tables are available
        console.log('📊 Test 2: Discovering Available Tables\n');
        
        // First, let's try to access any known table to see what's exposed
        const tablesToTry = [
            'users',
            'v_orders',
            'assets',
            'orders_visits',
            'cfg_assets_types'
        ];
        
        let foundTables = [];
        
        for (const table of tablesToTry) {
            try {
                const testResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    }
                );
                
                if (testResponse.ok) {
                    const data = await testResponse.json();
                    console.log(`✅ Found table: ${table} (${data.length || 0} rows)`);
                    foundTables.push(table);
                } else {
                    console.log(`❌ Table not accessible: ${table} (${testResponse.status})`);
                }
            } catch (err) {
                console.log(`⚠️  Error checking ${table}: ${err.message}`);
            }
        }
        
        if (foundTables.length > 0) {
            console.log(`\n✅ Successfully accessed ${foundTables.length} tables:`);
            foundTables.forEach(t => console.log(`   - ${t}`));
            console.log('\n💡 Note: System tables (information_schema) may not be exposed via REST API.');
            console.log('   Use direct SQL queries through MCP to access them.\n');
            return true;
        } else {
            console.log('\n⚠️  No application tables found accessible with anon key.');
            console.log('\nThis might indicate:');
            console.log('1. RLS policies restrict anon access');
            console.log('2. You need service_role key for access');
            console.log('3. Tables are in a different schema');
            return false;
        }
        
    } catch (error) {
        console.error('💥 Error during testing:', error.message);
        console.error('\nFull error:', error);
        return false;
    }
}

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   Supabase MCP Connection Test                ║');
    console.log('║   Self-Hosted VPS Configuration               ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    
    const success = await testConnection();
    
    console.log('─'.repeat(50));
    if (success) {
        console.log('✅ All tests passed! Your Supabase connection is working.');
        console.log('\nYou can now use MCP commands through your AI assistant.');
        console.log('Try asking: "List all tables in the database"');
    } else {
        console.log('❌ Some tests failed. Please check the errors above.');
        console.log('\nRefer to MCP_SUPABASE_SETUP.md for troubleshooting.');
    }
    console.log('─'.repeat(50));
    
    process.exit(success ? 0 : 1);
}

main();
