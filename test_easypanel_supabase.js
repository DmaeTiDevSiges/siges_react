// Script de teste para verificar a conectividade com Supabase (Easypanel/self-hosted ou cloud)
// Execute este arquivo com: node test_easypanel_supabase.js

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Variáveis ausentes: VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY.');
    console.error('   - Verifique se existe `.env.local` na raiz do projeto.');
    console.error('   - Ou exporte as variáveis no ambiente antes de executar o script.');
    process.exit(1);
}

console.log('🔍 Testando conectividade com Supabase no Easypanel...\n');

// Teste 1: Verificar se a URL está acessível
async function testHttpConnection() {
    console.log('1️⃣ Testando conexão HTTP...');
    try {
        const response = await fetch(SUPABASE_URL);
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   ✅ URL acessível: ${SUPABASE_URL}\n`);
        return true;
    } catch (error) {
        console.error(`   ❌ Erro na conexão HTTP:`, error.message);
        return false;
    }
}

// Teste 2: Verificar endpoint da API REST
async function testRestApi() {
    console.log('2️⃣ Testando API REST do Supabase...');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        console.log(`   ✅ Status da API REST: ${response.status}`);
        if (response.status === 200 || response.status === 404) {
            console.log(`   ✅ API REST está respondendo\n`);
            return true;
        } else {
            console.log(`   ⚠️ API REST retornou status inesperado: ${response.status}\n`);
            return false;
        }
    } catch (error) {
        console.error(`   ❌ Erro na API REST:`, error.message);
        return false;
    }
}

// Teste 3: Verificar endpoint de Auth
async function testAuthApi() {
    console.log('3️⃣ Testando API de Autenticação...');
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY
            }
        });
        console.log(`   ✅ Status da API Auth: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Auth API está saudável:`, data);
        }
        console.log('');
        return response.ok;
    } catch (error) {
        console.error(`   ❌ Erro na API Auth:`, error.message);
        return false;
    }
}

// Teste 4: Verificar endpoint de Storage
async function testStorageApi() {
    console.log('4️⃣ Testando API de Storage...');
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        console.log(`   ✅ Status da API Storage: ${response.status}`);
        if (response.status === 200 || response.status === 401) {
            console.log(`   ✅ Storage API está respondendo\n`);
            return true;
        } else {
            console.log(`   ⚠️ Storage API retornou status inesperado: ${response.status}\n`);
            return false;
        }
    } catch (error) {
        console.error(`   ❌ Erro na API Storage:`, error.message);
        return false;
    }
}

// Teste 5: Informações sobre WebSocket (não podemos testar diretamente no Node.js sem biblioteca adicional)
function testWebSocketInfo() {
    console.log('5️⃣ Informações sobre WebSocket Realtime...');
    const wsUrl = SUPABASE_URL.replace(/^http/, 'ws').replace(/\/$/, '');
    console.log(`   ℹ️ URL esperada do WebSocket: ${wsUrl}/realtime/v1/websocket`);
    console.log(`   ℹ️ Para testar WebSocket, abra o console do navegador e execute:`);
    console.log(`   
   const ws = new WebSocket('${wsUrl}/realtime/v1/websocket');
   ws.onopen = () => console.log('✅ WebSocket conectado!');
   ws.onerror = (error) => console.error('❌ Erro:', error);
   `);
    console.log('');
}

// Executar todos os testes
async function runAllTests() {
    const results = {
        http: await testHttpConnection(),
        rest: await testRestApi(),
        auth: await testAuthApi(),
        storage: await testStorageApi()
    };

    testWebSocketInfo();

    console.log('📊 Resumo dos Testes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`HTTP Connection:     ${results.http ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`REST API:            ${results.rest ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Auth API:            ${results.auth ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Storage API:         ${results.storage ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`WebSocket:           ⚠️ TESTAR NO NAVEGADOR`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allPassed = Object.values(results).every(r => r);
    if (allPassed) {
        console.log('🎉 Todos os testes passaram! Seu Supabase no Easypanel está funcionando corretamente.');
    } else {
        console.log('⚠️ Alguns testes falharam. Verifique a configuração do Easypanel.');
        console.log('📖 Consulte: docs/EASYPANEL_SUPABASE_CONFIG.md para mais informações.');
    }
}

// Executar
runAllTests().catch(console.error);
