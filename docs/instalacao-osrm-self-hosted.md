# Instalação OSRM Self-Hosted

> **Status:** Documentação de referência
> **Data:** 28/06/2026
> **Objetivo:** Eliminar dependência do servidor público do OSRM (rate limits e instabilidade)

---

## 1. Por que Self-Hosted?

| Problema atual | Solução |
|----------------|---------|
| Rate limit do servidor público (429) | Eliminado — controle total |
| Timeout/servidor lento | Eliminado — roda no seu VPS |
| Linha reta intermitente nas rotas | Eliminado (exceto pontos fora de estrada) |

---

## 2. Requisitos

| Item | Mínimo | Recomendado |
|------|--------|-------------|
| RAM | 2 GB (RS) | 4 GB |
| Disco | 2 GB (RS) | 10 GB (Brasil inteiro) |
| CPU | 2 cores | 4 cores |
| Docker | Instalado | — |

---

## 3. Instalação

### 3.1 Baixar dados do mapa

```bash
# Criar diretório de trabalho
mkdir -p /opt/osrm && cd /opt/osrm

# Baixar mapa do RS (Geofabrik)
wget https://download.geofabrik.de/south-america/brazil/south-latest.osm.pbf

# Alternativa: Brasil inteiro (~10GB)
# wget https://download.geofabrik.de/south-america/brazil-latest.osm.pbf
```

### 3.2 Extrair e processar

```bash
# Extrair rotas de carro
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/south-latest.osm.pbf

# Particionar (algoritmo MLD)
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/south-latest.osrm

# Customizar
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/south-latest.osrm
```

> **Tempo:** ~10-30 min dependendo do tamanho do mapa e CPU.

### 3.3 Rodar o servidor

```bash
docker run -d --name osrm \
  --restart unless-stopped \
  -p 5000:5000 \
  -v "/opt/osrm:/data" \
  ghcr.io/project-osrm/osrm-backend \
  osrm-routed --algorithm mld --max-table-size 10000 /data/south-latest.osm
```

### 3.4 Testar

```bash
# Rota entre dois pontos em Porto Alegre
curl "http://localhost:5000/route/v1/driving/-51.2177,-30.0346;-51.2300,-30.0500?overview=full&geometries=geojson"
```

Resposta esperada:
```json
{
  "routes": [{
    "geometry": { "coordinates": [[...]], "type": "LineString" },
    "distance": 5234.5,
    "duration": 420.2
  }],
  "code": "Ok"
}
```

---

## 4. Instalação no Easypanel (VPS)

### 4.1 Preparar dados do mapa via SSH

```bash
# Conectar na VPS
ssh root@seu-servidor

# Criar diretório
mkdir -p /opt/osrm && cd /opt/osrm

# Baixar mapa do RS (~500MB)
wget https://download.geofabrik.de/south-america/brazil/south-latest.osm.pbf

# Extrair rotas de carro (~10-30 min)
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/south-latest.osm.pbf

# Particionar
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/south-latest.osrm

# Customizar
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/south-latest.osrm

# Verificar se gerou os arquivos
ls /opt/osrm/*.osrm
# Deve mostrar: south-latest.osrm (e vários .osrm.*)
```

### 4.2 Criar serviço no Easypanel

1. Easypanel → **New Service** → **Docker Compose**
2. Nome: `osrm`
3. Cole o compose:

```yaml
services:
  osrm:
    image: ghcr.io/project-osrm/osrm-backend
    restart: unless-stopped
    command: osrm-routed --algorithm mld --max-table-size 10000 /data/south-latest.osm
    volumes:
      - /opt/osrm:/data
    ports:
      - "5000:5000"
    deploy:
      resources:
        limits:
          memory: 2G
```

4. **Deploy**

### 4.3 Configurar proxy reverso no Easypanel

1. Easypanel → **Proxy** → **New Proxy**
2. Adicionar regra:

| Path | Target |
|------|--------|
| `/osrm/*` | `http://osrm:5000` |

> **Importante:** O path `/osrm` do app deve chegar no container como `/`
> Easypanel normalmente faz rewrite automático.

### 4.4 Testar

```bash
# Pelo terminal da VPS
curl "http://localhost:5000/route/v1/driving/-51.2177,-30.0346;-51.2300,-30.0500?overview=full&geometries=geojson"

# Pelo domínio externo
curl "https://seu-dominio.com/osrm/route/v1/driving/-51.2177,-30.0346;-51.2300,-30.0500?overview=full&geometries=geojson"
```

---

## 5. Integração com o SIGES

### 5.1 Alterar `vite.config.ts`

```typescript
// Antes (servidor público)
proxy: {
    '/osrm': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
        secure: false,
        headers: {
            'User-Agent': 'Mozilla/5.0 ...'
        }
    }
}

// Depois (self-hosted)
proxy: {
    '/osrm': {
        target: 'http://localhost:5000',  // ou IP do VPS
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
    }
}
```

### 5.2 Para produção (fora do Vite dev server)

Se o app for servido por Nginx/Caddy, adicionar proxy reverso:

```nginx
# Nginx
location /osrm/ {
    proxy_pass http://localhost:5000/;
    proxy_set_header Host $host;
}
```

---

## 6. Manutenção

### 6.1 Atualizar mapa

```bash
cd /opt/osrm

# Baixar nova versão
wget -N https://download.geofabrik.de/south-america/brazil/south-latest.osm.pbf

# Re-processar
docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/south-latest.osm.pbf

docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-partition /data/south-latest.osrm

docker run -t -v "/opt/osrm:/data" ghcr.io/project-osrm/osrm-backend \
  osrm-customize /data/south-latest.osrm

# Reiniciar
docker restart osrm
```

### 6.2 Monitorar

```bash
# Status do container
docker ps | grep osrm

# Logs
docker logs -f osrm

# Uso de memória
docker stats osrm
```

---

## 7. Troubleshooting

| Problema | Solução |
|----------|---------|
| Container não inicia | Verificar se `.osm` foi processado: `ls /opt/osrm/*.osrm` |
| Timeout nas rotas | Aumentar RAM ou reduzir área do mapa |
| Rota não encontrada | Ponto fora de estrada — comportamento esperado (linha reta) |
| Lentidão | Usar `--algorithm mld` (mais rápido que `dijkstra`) |

---

## 8. Alternativas ao OSRM

| Serviço | Tipo | Custo | Qualidade |
|---------|------|-------|-----------|
| OSRM self-hosted | Open source | Gratuito | Boa (ruas) |
| GraphHopper | Open source | Gratuito | Boa (ruas) |
| Valhalla | Open source | Gratuito | Boa (ruas) |
| Google Directions | API | $5/1000 req | Excelente |
| Mapbox Directions | API | $0.50/1000 req | Excelente |

Para o caso de uso do SIGES, OSRM é a melhor opção: gratuito, maduro e leve.
