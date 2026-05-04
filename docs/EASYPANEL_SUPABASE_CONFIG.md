# Configuração do Supabase no Easypanel

## 📋 Informações da VPS

- **URL do Supabase**: `https://services-supabase-siges.2unk5k.easypanel.host`
- **Plataforma**: Easypanel
- **Tipo**: Self-hosted Supabase

## 🔧 Configuração do WebSocket

O Easypanel geralmente roteia conexões WebSocket através da mesma URL HTTPS. No entanto, se você estiver enfrentando problemas com o Realtime (WebSocket), verifique as seguintes configurações no Easypanel:

### 1. Verificar Configuração do Realtime no Easypanel

No painel do Easypanel, verifique se o serviço **Realtime** do Supabase está:
- ✅ Habilitado
- ✅ Rodando na porta correta (geralmente 4000)
- ✅ Com proxy reverso configurado

### 2. Variáveis de Ambiente Necessárias

Certifique-se de que seu `.env.local` contém:

```bash
VITE_SUPABASE_URL=https://services-supabase-siges.2unk5k.easypanel.host
VITE_SUPABASE_ANON_KEY=seu-anon-key-aqui
VITE_SUPABASE_STORAGE_BUCKET=siges
```

### 3. Configuração de Portas no Easypanel

O Supabase self-hosted usa as seguintes portas:
- **Kong (API Gateway)**: 8000 (HTTP) / 8443 (HTTPS)
- **Realtime**: 4000
- **Storage**: 5000
- **Auth**: 9999
- **PostgreSQL**: 5432

O Easypanel deve estar configurado para rotear todas essas portas através do proxy reverso.

### 4. Testar Conexão WebSocket

Para testar se o WebSocket está funcionando, você pode usar o console do navegador:

```javascript
// Abra o console do navegador e execute:
const ws = new WebSocket('wss://services-supabase-siges.2unk5k.easypanel.host/realtime/v1/websocket');
ws.onopen = () => console.log('✅ WebSocket conectado!');
ws.onerror = (error) => console.error('❌ Erro no WebSocket:', error);
```

## 🚨 Solução de Problemas

### Erro: "Realtime subscription failed"

**Causa**: O serviço Realtime pode não estar configurado corretamente no Easypanel.

**Soluções**:

1. **Desabilitar Realtime temporariamente** (se não estiver usando):
   - Edite `services/supabase.ts`
   - Adicione `enabled: false` na configuração do realtime

2. **Verificar logs do Easypanel**:
   - Acesse o painel do Easypanel
   - Vá para o serviço Supabase
   - Verifique os logs do container Realtime

3. **Verificar configuração de CORS**:
   - O Easypanel deve permitir conexões WebSocket do seu domínio

### Erro: "WebSocket configuration error"

**Solução**: Verifique se o Easypanel está configurado para fazer upgrade de conexões HTTP para WebSocket.

No arquivo de configuração do Nginx/Traefik do Easypanel, deve haver algo como:

```nginx
location /realtime/v1/websocket {
    proxy_pass http://realtime:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## 📚 Recursos Adicionais

- [Documentação do Supabase Self-Hosted](https://supabase.com/docs/guides/self-hosting)
- [Documentação do Easypanel](https://easypanel.io/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

## ✅ Checklist de Configuração

- [ ] Supabase instalado no Easypanel
- [ ] Variáveis de ambiente configuradas
- [ ] Serviço Realtime habilitado
- [ ] Proxy reverso configurado para WebSocket
- [ ] CORS configurado corretamente
- [ ] Testes de conexão realizados
