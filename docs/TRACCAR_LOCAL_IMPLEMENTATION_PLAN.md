# Plano de implementacao: Traccar local para a Festa dos Caminhoneiros 2026

Data da analise: 2026-07-07
Status: implementacao inicial em andamento, com Gateway copiado para o projeto atual e front migrado para o contrato publico.

## Resumo executivo

A arquitetura correta para o evento e:

```text
Traccar Client nos celulares
  -> https://gps.festadoscaminhoneiros.com.br
  -> Cloudflare Tunnel
  -> Traccar local no notebook, porta interna 5055
  -> Event Gateway local
  -> https://live.festadoscaminhoneiros.com.br
  -> PWA React publico na revenda/Plesk
```

Decisoes obrigatorias:

- A revenda/Plesk hospeda somente o PWA estatico e a API PHP existente.
- O Traccar admin fica somente local em `http://localhost:8082`.
- O publico nunca acessa o Traccar direto.
- O Event Gateway e a fronteira publica do tempo real.
- O Gateway consome o Traccar por API privada e publica somente dados normalizados.
- O PWA usa WebSocket primeiro, SSE como fallback e polling como ultima camada.
- Dados ao vivo nao podem ser cacheados pelo Service Worker.
- O dominio oficial deste projeto e `festadoscaminhoneiros.com.br`; nao usar variacoes como `festadecaminhoneiros.com.br`.

## Progresso da implementacao

- [x] Estrutura `tracking/` adicionada ao projeto atual.
- [x] Testes automatizados do Event Gateway executados com sucesso.
- [x] CORS manual aplicado no SSE `/public/stream`, necessario porque a rota usa `reply.hijack()`.
- [x] Front migrado de `hypeneural.com/caminhao` para `/public/state`, `/public/stream` e `/ws`.
- [x] Service Worker ajustado para `NetworkOnly` nos endpoints vivos e sem duplicatas no precache.
- [x] Imagens externas `via.placeholder.com` bloqueadas antes da primeira renderizacao.
- [x] Rota provisoria da procissao adicionada localmente para o mapa nao depender do endpoint antigo.
- [x] Rastreamento fica desligado por padrao sem `VITE_TRACCAR_ENABLED=true`, evitando erros quando Docker/Gateway nao estao rodando.
- [x] Home e acesso rapido ajustados para nao tratar o mapa como recurso ao vivo quando o tracking estiver desligado.
- [x] Textos mortos de cameras ao vivo removidos do front.
- [x] Build de producao validado depois dos ajustes de PWA/tracking.
- [x] Service Worker validado sem entradas duplicadas e sem cache de endpoints vivos.
- [x] Subir Docker Desktop e validar `tracking/compose.yaml` de ponta a ponta no notebook.
- [x] Corrigir bug `node:sqlite` no Dockerfile e package.json (flag `--experimental-sqlite`).
- [x] Criar usuario admin no Traccar via `setup-traccar-admin.ps1`.
- [x] Criar veiculo principal "Sao Cristovao" via API admin do Gateway.
- [x] Enviar posicoes fake para o Traccar e confirmar que aparecem em `/public/state`.
- [x] Ativar `VITE_TRACCAR_ENABLED=true` no PWA e validar build.
- [x] Preflight completo: Docker OK, Traccar healthy, Gateway healthy, 3 containers rodando.
- [ ] Configurar Cloudflare Tunnel real para `gps` e `live`.
- [ ] Validar producao com variaveis reais e build publicado.
- [ ] Corrigir debitos antigos de TypeScript em menu/FAQ para o `npm run type-check` global passar.

## Fontes oficiais consultadas

- Traccar Docker: https://www.traccar.org/docker/
- Traccar API: https://www.traccar.org/traccar-api/
- Traccar OsmAnd / Traccar Client protocol: https://www.traccar.org/osmand/
- Traccar configuration file: https://www.traccar.org/configuration-file/
- Traccar Client configuration: https://www.traccar.org/client-configuration/
- Traccar source code: https://www.traccar.org/source-code/
- Cloudflare Tunnel overview: https://developers.cloudflare.com/tunnel/
- Cloudflare Tunnel routing: https://developers.cloudflare.com/tunnel/routing/
- Cloudflare Tunnel published application protocols: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/protocols/
- Cloudflare WebSockets: https://developers.cloudflare.com/network/websockets/
- Workbox runtime caching: https://developer.chrome.com/docs/workbox/caching-resources-during-runtime
- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- MDN Server-sent events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- React Leaflet: https://react-leaflet.js.org/docs/start-introduction/
- Leaflet: https://leafletjs.com/
- OSMF tile usage policy: https://operations.osmfoundation.org/policies/tiles/

## Analise do ambiente atual

### Front atual

- App React 18 + Vite + TypeScript.
- PWA com `vite-plugin-pwa`.
- UI com Tailwind, Radix, lucide-react e framer-motion.
- Estado remoto com `@tanstack/react-query`.
- Mapa com `leaflet` e `react-leaflet` ja instalados.
- Rastreamento antigo esta protegido por `VITE_TRACCAR_ENABLED`.
- Componentes historicos que apontavam para `https://hypeneural.com/caminhao/...` foram migrados ou substituidos por dados locais/gateway.

Arquivos que serao afetados na integracao:

```text
src/constants/api.ts
src/hooks/useTraccarData.ts
src/pages/Map.tsx
src/pages/RotaCompleta.tsx
src/components/map/EnhancedProcissaoMap.tsx
src/components/map/FullRouteMap.tsx
src/components/tracker/TrackerDisabledState.tsx
config/pwa.config.ts
```

### PC verificado

```text
Sistema: Windows 10 Pro 64 bits
CPU: AMD FX-8370, 4 cores / 8 threads
RAM: 16 GB total, cerca de 7.6 GB livre no momento da analise
Disco C: cerca de 249 GB livres
Node: v22.14.0
npm: 11.3.0
Git: 2.48.1.windows.1
Docker: 29.4.0 instalado
Docker Compose: v5.1.1 instalado
Docker Desktop / WSL: instalado, mas estava parado
Java: nao encontrado no PATH
Portas 3000, 5055 e 8082: livres no momento da analise
```

Java nao bloqueia a implementacao, porque o Traccar rodara pela imagem Docker oficial.

### Repositorio oficial baixado

Referencia local:

```text
C:\Users\Usuario\Documents\New project 4\references\traccar-official
```

Commit analisado:

```text
50b43cfab58f50f12ea7d13c9d10c6c942b2e6bf
2026-07-06 19:15:17 -0700
Correct log level
```

Pontos confirmados no repo oficial:

- Backend oficial e Java com Gradle.
- Dockerfiles oficiais ficam em `docker/`.
- Exemplos oficiais de Compose ficam em `docker/compose/`.
- `docker/compose/traccar-mysql.yaml` usa `CONFIG_USE_ENVIRONMENT_VARIABLES=true`.
- `openapi.yaml` inclui `/health`, `/devices`, `/positions`, `/session` e demais endpoints.
- `POST /devices` cria dispositivos.
- `GET /positions` busca ultimas posicoes, mas o proprio OpenAPI recomenda WebSocket para tempo real.

## Decisoes tecnicas finais

### Onde cada parte roda

```text
Revenda/Plesk:
  - PWA React buildado
  - API PHP atual
  - imagens e assets publicos

Notebook:
  - Traccar Server
  - MySQL do Traccar
  - Event Gateway Node/Fastify
  - SQLite do Gateway
  - Cloudflare Tunnel
```

### Dominios

```text
festadoscaminhoneiros.com.br
  PWA estatico na revenda

api.festadoscaminhoneiros.com.br
  API PHP atual na revenda

gps.festadoscaminhoneiros.com.br
  Cloudflare Tunnel -> Traccar porta 5055

live.festadoscaminhoneiros.com.br
  Cloudflare Tunnel -> Event Gateway porta 3000
```

Regra: esse dominio deve ser identico em `.env`, Cloudflare, CORS, PWA, QR Code, README, Service Worker e instrucoes impressas.

### Banco do Traccar

Usar MySQL no MVP.

Justificativa:

- A documentacao oficial do Traccar nao recomenda H2 para uso nao-teste.
- A documentacao recomenda TimescaleDB para instalacoes grandes e MySQL para servidores menores.
- O evento deve operar poucos dispositivos por algumas horas.
- MySQL reduz complexidade em relacao a TimescaleDB no notebook.

TimescaleDB fica como fase 2 se houver necessidade de analise historica pesada.

### Versoes

```text
Traccar: traccar/traccar:6.14.5
MySQL: mysql:lts
Node Gateway: node:22
cloudflared: latest durante desenvolvimento; fixar tag apos teste de campo
```

Nao usar `traccar/traccar:latest` no dia do evento.

## Estrutura de pastas

Criar dentro do repo do app:

```text
tracking/
  compose.yaml
  .env.example
  README.md
  traccar/
    logs/
  data/
    mysql/
    gateway/
    backups/
  event-gateway/
    package.json
    tsconfig.json
    Dockerfile
    src/
      index.ts
      config.ts
      app.ts
      health.ts
      traccar/
        client.ts
        session.ts
        socket.ts
        positions.ts
        devices.ts
        normalize.ts
      public/
        routes.ts
        websocket.ts
        sse.ts
        state.ts
      admin/
        routes.ts
        auth.ts
        qrcode.ts
      db/
        schema.sql
        database.ts
        migrations.ts
      domain/
        vehicles.ts
        positions.ts
        stale.ts
      observability/
        logger.ts
        metrics.ts
  cloudflared/
    README.md
  scripts/
    start.ps1
    stop.ps1
    status.ps1
    preflight.ps1
    backup.ps1
    send-test-position.ps1
```

Nao versionar:

```text
tracking/.env
tracking/data/
tracking/traccar/logs/
tracking/cloudflared/*.json
```

Adicionar essas entradas ao `.gitignore` antes de criar secrets.

## `.env.example`

Modelo:

```env
COMPOSE_PROJECT_NAME=festacaminhoneiros-tracking

TRACCAR_DB_PASSWORD=change-me
TRACCAR_EMAIL=admin@festadoscaminhoneiros.com.br
TRACCAR_PASSWORD=change-me

GATEWAY_ADMIN_TOKEN=change-me-32-plus-random-chars
PUBLIC_ORIGIN=https://festadoscaminhoneiros.com.br
LIVE_PUBLIC_URL=https://live.festadoscaminhoneiros.com.br
GPS_PUBLIC_URL=https://gps.festadoscaminhoneiros.com.br

CLOUDFLARE_TUNNEL_TOKEN=change-me

MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
MAP_TILE_ATTRIBUTION=OpenStreetMap contributors
```

Regras:

- `GATEWAY_ADMIN_TOKEN` precisa ter pelo menos 32 caracteres aleatorios.
- `.env` real nunca entra no Git.
- Logs nunca devem imprimir tokens, cookies ou senhas.

## Docker Compose proposto

Base inicial:

```yaml
services:
  mysql:
    image: mysql:lts
    restart: unless-stopped
    environment:
      MYSQL_RANDOM_ROOT_PASSWORD: "yes"
      MYSQL_DATABASE: traccar
      MYSQL_USER: traccar
      MYSQL_PASSWORD: ${TRACCAR_DB_PASSWORD}
    volumes:
      - ./data/mysql:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u traccar -p$${MYSQL_PASSWORD} --silent"]
      interval: 15s
      timeout: 5s
      retries: 20

  traccar:
    image: traccar/traccar:6.14.5
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      CONFIG_USE_ENVIRONMENT_VARIABLES: "true"
      DATABASE_DRIVER: com.mysql.cj.jdbc.Driver
      DATABASE_URL: jdbc:mysql://mysql:3306/traccar?zeroDateTimeBehavior=round&serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false&allowMultiQueries=true&autoReconnect=true&useUnicode=yes&characterEncoding=UTF-8&sessionVariables=sql_mode=''
      DATABASE_USER: traccar
      DATABASE_PASSWORD: ${TRACCAR_DB_PASSWORD}
    ports:
      - "127.0.0.1:8082:8082"
      - "127.0.0.1:5055:5055"
    volumes:
      - ./traccar/logs:/opt/traccar/logs
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8082/api/health"]
      interval: 15s
      timeout: 5s
      retries: 20
      start_period: 90s

  event-gateway:
    build: ./event-gateway
    restart: unless-stopped
    depends_on:
      traccar:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      PUBLIC_ORIGIN: ${PUBLIC_ORIGIN}
      TRACCAR_URL: http://traccar:8082
      TRACCAR_EMAIL: ${TRACCAR_EMAIL}
      TRACCAR_PASSWORD: ${TRACCAR_PASSWORD}
      ADMIN_TOKEN: ${GATEWAY_ADMIN_TOKEN}
      DATABASE_PATH: /app/data/gateway.sqlite
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./data/gateway:/app/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 10

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      traccar:
        condition: service_healthy
      event-gateway:
        condition: service_healthy
```

Observacoes:

- Mesmo com `depends_on`, Traccar e Gateway precisam ter retry interno. `depends_on` ajuda a ordem, mas nao substitui reconexao.
- Publicar portas apenas em `127.0.0.1` reduz exposicao local.
- Traccar usa env no MVP. A doc oficial permite sobrescrever config XML por env quando `CONFIG_USE_ENVIRONMENT_VARIABLES=true`.
- Se algum parametro do Traccar nao funcionar bem por env, criar `tracking/traccar/conf/traccar.xml` e montar como leitura.

## Cloudflare Tunnel

Rotas do tunnel:

```text
gps.festadoscaminhoneiros.com.br
  service: http://traccar:5055

live.festadoscaminhoneiros.com.br
  service: http://event-gateway:3000
```

Nao publicar:

```text
admin.festadoscaminhoneiros.com.br -> Traccar 8082
```

Regras Cloudflare:

- O dominio precisa estar na Cloudflare para usar hostnames publicados pelo Tunnel.
- HTTP/HTTPS sao adequados para publico comum.
- TCP via published application exige cliente `cloudflared` no usuario final, entao nao serve para Traccar Client nem publico comum.
- WebSockets devem estar habilitados no painel Network da Cloudflare.
- Adicionar heartbeat/ping no Gateway e reconexao no PWA, porque conexoes longas podem cair.
- Se um admin remoto for necessario, usar Cloudflare Access em um hostname separado; nao deixar aberto.

## Traccar

### Endpoints usados pelo Gateway

```text
POST /api/session
  cria sessao privada do Gateway

GET /api/devices
  busca dispositivos e permite reconciliacao

POST /api/devices
  cria dispositivo quando operador gera novo caminhao

GET /api/positions
  snapshot inicial e fallback temporario

WS /api/socket
  fluxo vivo oficial do Traccar, com cookie de sessao

GET /api/health
  healthcheck local do Traccar
```

Ponto critico: `/api/socket` aceita somente cookie de sessao. Por isso o navegador publico nao deve abrir socket direto com Traccar.

### Fluxo de inicializacao do Gateway com Traccar

```text
1. Iniciar DB SQLite do Gateway.
2. Fazer login em POST /api/session.
3. Guardar cookie de sessao somente em memoria.
4. Buscar snapshot em GET /api/devices.
5. Buscar snapshot em GET /api/positions.
6. Normalizar e preencher estado publico.
7. Abrir WS privado em /api/socket.
8. Consumir mensagens com devices, positions e events.
9. Se socket cair, reconectar com backoff.
10. Se sessao expirar, refazer login.
11. Se WS ficar indisponivel, usar /api/positions como fallback temporario.
```

### Entrada GPS dos celulares

O Traccar Client usa Server URL completa. Para os motoristas:

```text
Server URL:
https://gps.festadoscaminhoneiros.com.br
```

Internamente, Cloudflare encaminha para:

```text
http://traccar:5055
```

O protocolo OsmAnd/Traccar Client aceita JSON no app moderno e tambem formato query/form com campos como `id` ou `deviceid`, `lat`, `lon`, `timestamp`, `speed`, `bearing`, `accuracy` e `batt`.

## Event Gateway

### Responsabilidades

- Manter sessao privada com Traccar.
- Criar dispositivos no Traccar.
- Gerar identificadores unicos para motoristas.
- Salvar metadados locais em SQLite.
- Consumir `/api/socket`.
- Ter fallback por `/api/positions`.
- Manter estado operacional separado do estado publico.
- Publicar snapshot limpo para o PWA.
- Fazer broadcast agrupado no maximo 1 vez por segundo.
- Ter WebSocket com heartbeat.
- Ter SSE com heartbeat.
- Ter polling JSON sempre disponivel.
- Ocultar veiculos com erro.
- Nao expor `uniqueId`, cookie, token, email, telefone, nome real do motorista ou payload bruto.

### Endpoints publicos

```text
GET /health
GET /public/state
GET /public/vehicles
GET /public/route
GET /public/stream
WS  /ws
```

### Endpoints admin

Todos com:

```text
Authorization: Bearer <GATEWAY_ADMIN_TOKEN>
```

Rotas:

```text
GET    /admin/status
GET    /admin/vehicles
POST   /admin/vehicles
PATCH  /admin/vehicles/:id
POST   /admin/vehicles/:id/disable
POST   /admin/vehicles/:id/enable
POST   /admin/vehicles/:id/main
POST   /admin/vehicles/:id/qrcode
POST   /admin/test-position
```

O painel admin inicial deve rodar localmente:

```text
http://localhost:3000/admin
```

Nao publicar admin no `live` sem Cloudflare Access.

### Estados internos

Estado operacional, nunca publico:

```json
{
  "uniqueId": "SC26-CAM-001-K8P2",
  "traccarDeviceId": 12,
  "lastRawPosition": {},
  "lastSocketMessageAt": "2026-07-19T12:00:00-03:00",
  "battery": 0.82,
  "charging": true
}
```

Estado publico:

```json
{
  "id": "cam-001",
  "name": "Caminhao 001",
  "type": "truck",
  "lat": -27.236099,
  "lng": -48.644599,
  "speedKmh": 12,
  "bearing": 92,
  "accuracy": 8,
  "updatedAt": "2026-07-19T11:59:58-03:00",
  "stale": false,
  "status": "live"
}
```

Snapshot publico:

```json
{
  "event": "snapshot",
  "serverTime": "2026-07-19T12:00:00-03:00",
  "vehicles": [
    {
      "id": "sao-cristovao",
      "name": "Sao Cristovao",
      "type": "main",
      "lat": -27.236099,
      "lng": -48.644599,
      "speedKmh": 12,
      "bearing": 92,
      "accuracy": 8,
      "updatedAt": "2026-07-19T11:59:58-03:00",
      "stale": false,
      "status": "live"
    }
  ]
}
```

### Regras de stale/offline

```text
Caminhao principal:
  stale: 20s sem atualizacao
  offline: 60s sem atualizacao

Caminhoes comuns:
  stale: 60s sem atualizacao
  offline: 180s sem atualizacao

Apoio:
  stale: 60s sem atualizacao
  offline: 180s sem atualizacao
```

Labels no PWA:

```text
Ao vivo
Sinal lento
Sem sinal
Reconectando
Modo economia
Offline
```

### WebSocket publico

Regras:

- Enviar snapshot inicial ao conectar.
- Agrupar updates em um pacote por segundo.
- Enviar ping/pong ou heartbeat a cada 20 a 25 segundos.
- Encerrar cliente sem resposta.
- Limitar conexoes por IP.
- Nao aceitar mensagens de controle publico alem de ping/pong.
- Rejeitar payloads grandes.

### SSE publico

Regras:

- Content-Type `text/event-stream`.
- Enviar snapshot inicial.
- Enviar evento `heartbeat` periodico.
- Fechar conexoes antigas/inativas.
- Mesmo payload publico do WebSocket.

### Polling publico

```text
GET /public/state
```

Regras:

- Sempre responder rapido com ultimo estado conhecido.
- Usar `Cache-Control: no-store`.
- Rate limit por IP.
- Payload compacto.

## Banco SQLite do Gateway

Schema inicial:

```sql
vehicles (
  id text primary key,
  traccar_device_id integer not null,
  unique_id text not null unique,
  name text not null,
  type text not null check (type in ('main', 'truck', 'support')),
  color text,
  active integer not null default 1,
  visible integer not null default 1,
  sort_order integer not null default 0,
  created_at text not null,
  updated_at text not null
);

last_positions (
  vehicle_id text primary key,
  lat real not null,
  lng real not null,
  speed_kmh real,
  bearing real,
  accuracy real,
  battery real,
  charging integer,
  fix_time text not null,
  updated_at text not null
);

route_points (
  id integer primary key autoincrement,
  vehicle_id text not null,
  lat real not null,
  lng real not null,
  speed_kmh real,
  bearing real,
  accuracy real,
  fix_time text not null,
  created_at text not null
);

operator_events (
  id integer primary key autoincrement,
  type text not null,
  payload text,
  created_at text not null
);

settings (
  key text primary key,
  value text not null
);

create index idx_route_points_vehicle_fix_time on route_points(vehicle_id, fix_time);
```

Retencao:

```text
Caminhao principal:
  salvar rota a cada 5s ou 10m.

Demais veiculos:
  salvar ultima posicao sempre.
  rota historica no maximo a cada 60s, se necessario.

Limpeza:
  remover route_points antigos depois do evento ou apos N dias.
```

## Cadastro de caminhoes

Fluxo admin:

```text
1. Operador clica em Novo caminhao.
2. Escolhe tipo: principal, comum ou apoio.
3. Gateway gera `uniqueId`.
4. Gateway cria device no Traccar via POST /api/devices.
5. Gateway salva metadados no SQLite.
6. Gateway gera QR Code e instrucao.
7. Motorista configura Traccar Client e ativa tracking.
8. Operador ve status "recebendo sinal".
```

Padrao de identificadores:

```text
SC26-SANTO-A9F3
SC26-CAM-001-K8P2
SC26-APOIO-01-M4X7
```

O `uniqueId` nao entra no payload publico.

### QR Code

Primeiro MVP:

- QR Code com texto de instrucao e campos para copiar.
- Nao depender de formato nativo do app sem testar a versao instalada.

Conteudo sugerido:

```text
Festa dos Caminhoneiros 2026
App: Traccar Client
Server URL: https://gps.festadoscaminhoneiros.com.br
Device Identifier: SC26-CAM-001-K8P2
```

Depois de validar a versao do Traccar Client, testar QR de configuracao nativo se disponivel.

## Configuracao dos celulares

### Caminhao principal

```text
Location accuracy: Highest
Distance: 5 m
Interval: 5 s
Fastest interval: 5 s
Offline buffering: on
Wake lock: on
Stop detection: off ou testado antes
Celular sempre carregando
Permitir localizacao em segundo plano
Desativar economia de bateria para o app
```

### Demais caminhoes

```text
Location accuracy: High
Distance: 20 m a 30 m
Interval: 20 s a 30 s
Fastest interval: 20 s a 30 s
Offline buffering: on
Wake lock: on se estiver carregando
Permitir localizacao em segundo plano
```

### Testes obrigatorios com celulares

```text
Android com tela ligada
Android bloqueado
Android com app em background
Android com economia de bateria desligada para o app
iPhone com app em background
Perda de internet e retorno
Celular principal carregando por 30 minutos
```

## PWA React

### Variaveis

```env
VITE_TRACCAR_ENABLED=true
VITE_LIVE_TRACKING_URL=https://live.festadoscaminhoneiros.com.br
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION=OpenStreetMap contributors
```

### Nova camada de tracking

Criar:

```text
src/services/live-tracking/
  types.ts
  client.ts
  websocket.ts
  sse.ts
  polling.ts
  normalize.ts

src/hooks/useLiveTracking.ts
```

Fluxo do cliente:

```text
1. Buscar snapshot em /public/state.
2. Abrir wss://live.festadoscaminhoneiros.com.br/ws.
3. Se WS cair, reconectar com backoff e jitter.
4. Depois de 3 falhas, usar SSE em /public/stream.
5. Se SSE falhar, usar polling em /public/state a cada 5s.
6. Ao voltar WS, parar fallback.
7. Fechar WebSocket quando a pagina for descartada ou app entrar em estado apropriado.
```

Retorno do hook:

```ts
{
  vehicles,
  mainVehicle,
  connectionState,
  transport,
  lastUpdate,
  staleCount,
  offlineCount,
  centerOnMain,
  reconnect,
}
```

### Ajustes nos mapas

- Remover fetch direto para `hypeneural.com`.
- Remover dependencia de payload antigo em `EnhancedProcissaoMap`.
- `Map.tsx` usa `useLiveTracking`.
- `RotaCompleta.tsx` usa `/public/route` ou rota em memoria do hook.
- `TrackerDisabledState` fica como fallback quando `VITE_TRACCAR_ENABLED=false`.
- Mapas devem carregar por `lazy()` para nao pesar a home.
- Criar Error Boundary especifico para mapa.
- Botao "Recarregar mapa".
- Botao fixo "Centralizar no Sao Cristovao".
- Bottom sheet mobile com status da procissao.
- Animacao suave de marcadores respeitando `prefers-reduced-motion`.

### Service Worker e cache

Politica obrigatoria:

```text
/public/state
/public/stream
/ws
```

nao podem ser cacheados.

Workbox:

- Assets React: cache normal do PWA.
- Endpoints live: `NetworkOnly` ou sem rota de cache.
- Tiles: runtime cache controlado, com expiracao e respeitando politica do provedor.
- Nunca precachear dados de posicao.
- Garantir que o build nao contenha `hypeneural.com/caminhao`.

Cabecalhos esperados do Gateway:

```text
Cache-Control: no-store
Access-Control-Allow-Origin: https://festadoscaminhoneiros.com.br
```

## Mapa e tiles

OSM direto pode ser usado em teste e trafego baixo, mas nao deve ser tratado como CDN comercial.

Regras se usar `tile.openstreetmap.org`:

- URL correta: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
- Atribuicao visivel no mapa.
- Referer valido.
- Nao usar headers `no-cache` por padrao.
- Nao fazer bulk download nem prefetch.
- Permitir trocar a URL sem novo deploy, por variavel.

Plano recomendado:

```text
Teste/MVP:
  OpenStreetMap direto com atribuicao correta.

Evento divulgado:
  avaliar OpenFreeMap, Stadia, MapTiler, Mapbox, Protomaps/PMTiles ou outro provedor com limite claro.

Plano B:
  rota estatica no PWA caso tiles ou live falhem.
```

## Seguranca

Obrigatorio:

- Nunca colocar token do Traccar no front.
- Painel Traccar apenas em `localhost:8082`.
- Admin do Gateway apenas local ou com Cloudflare Access.
- `GATEWAY_ADMIN_TOKEN` forte.
- CORS restrito ao dominio real e localhost em dev.
- Rate limit em `/public/state`.
- Rate limit mais forte em `/admin/*`.
- Limite de conexoes WebSocket por IP.
- Sanitizar nome de caminhao.
- Nao mostrar telefone/nome real de motorista.
- Nao expor `uniqueId` no payload publico.
- Desativar criacao publica de dispositivos.
- Logs sem token, cookie ou senha.
- Backup antes e depois do evento.

## Scripts operacionais

### `preflight.ps1`

Antes do evento:

```text
1. Docker Desktop esta rodando?
2. `docker info` responde?
3. Containers estao healthy?
4. `http://localhost:8082/api/health` responde?
5. `http://localhost:3000/health` responde?
6. `https://live.festadoscaminhoneiros.com.br/health` responde?
7. DNS resolve `gps` e `live`?
8. Cloudflare Tunnel esta healthy?
9. Posicao fake chega no Traccar via 5055?
10. `/public/state` retorna JSON valido?
11. PWA consegue consumir `/public/state`?
12. Notebook esta sem suspensao?
13. Celular principal esta carregando?
```

### `status.ps1`

Durante o evento:

```text
Containers e health
Uso de CPU/RAM
Ultimo update do caminhao principal
Quantidade de veiculos live/stale/offline
Quantidade de clientes WebSocket
Status do cloudflared
Status do MySQL
Tamanho do SQLite
Ultimos erros do Gateway
```

### `backup.ps1`

Antes e depois:

```text
Backup do SQLite do Gateway
Dump basico do MySQL
Export de veiculos cadastrados
Backup dos logs relevantes
Nao incluir .env real em arquivo compartilhavel
```

### `send-test-position.ps1`

Enviar posicao fake:

```text
GET http://localhost:5055/?id=SC26-CAM-001-K8P2&lat=-27.236099&lon=-48.644599&timestamp=<agora>
```

## Plano de fases

### Fase 0 - Preparacao

1. Iniciar Docker Desktop.
2. Validar `docker info`.
3. Criar `tracking/`.
4. Criar `.env.example`.
5. Atualizar `.gitignore`.
6. Criar Compose inicial.
7. Rodar `docker compose config`.

Pronto quando:

```text
docker compose config
```

passar sem erro e nenhum secret real estiver versionado.

### Fase 1 - Traccar local

1. Subir MySQL + Traccar.
2. Validar healthcheck.
3. Acessar `http://localhost:8082`.
4. Criar usuario admin.
5. Criar dispositivo manual.
6. Enviar posicao fake para `http://localhost:5055`.
7. Ver posicao no painel Traccar.

Pronto quando:

```text
GET http://localhost:8082/api/health -> OK
```

e uma posicao fake aparecer no Traccar.

### Fase 2 - Event Gateway

1. Criar projeto Node/Fastify.
2. Implementar config validada por Zod.
3. Implementar SQLite e schema.
4. Implementar `/health`.
5. Implementar login no Traccar.
6. Implementar snapshot `/api/devices` e `/api/positions`.
7. Implementar socket privado `/api/socket`.
8. Implementar reconexao com backoff.
9. Implementar `/public/state`.
10. Implementar `/ws` com heartbeat.
11. Implementar `/public/stream` com heartbeat.
12. Implementar admin basico.
13. Implementar QR/instrucao.
14. Implementar logs e metricas.

Pronto quando:

```text
GET http://localhost:3000/public/state
```

retornar JSON normalizado, e o WebSocket publico atualizar quando uma posicao fake chegar.

### Fase 3 - Cloudflare Tunnel

1. Confirmar dominio na Cloudflare.
2. Criar tunnel.
3. Configurar `gps`.
4. Configurar `live`.
5. Habilitar WebSockets no painel Network.
6. Testar `live /health` de fora da rede.
7. Testar Traccar Client real apontando para `gps`.

Pronto quando:

```text
https://live.festadoscaminhoneiros.com.br/health
```

responder OK e um celular real enviar posicao pelo `gps`.

### Fase 4 - Integracao PWA

1. Criar `useLiveTracking`.
2. Criar cliente WS/SSE/polling.
3. Trocar mapas para payload novo.
4. Remover `hypeneural.com`.
5. Ajustar UI mobile do mapa.
6. Configurar cache `NetworkOnly`/no-store para live.
7. Buildar PWA.
8. Validar service worker.

Pronto quando:

```text
npm run build
```

passar, o build nao conter `hypeneural.com/caminhao`, e DevTools nao mostrar dados live vindo do cache.

### Fase 5 - Teste de campo

1. Testar com 2 celulares.
2. Testar 1 celular como principal.
3. Testar Android bloqueado.
4. Testar iPhone em background.
5. Testar perda de internet.
6. Testar reconexao do Gateway.
7. Testar queda e volta do Cloudflare Tunnel.
8. Testar PWA no Chrome Android e Safari iOS.
9. Medir latencia.

Metas:

```text
Caminhao principal atualiza no PWA em ate 10s.
Caminhoes comuns atualizam em ate 35s.
Fallback polling funciona.
Sem erro CORS.
Sem token no navegador.
Sem dado live no cache.
```

### Fase 6 - Operacao no dia

Checklist:

```text
Notebook na tomada
Windows sem suspensao
Docker Desktop rodando
Containers healthy
Cloudflare Tunnel healthy
Celular principal carregando
Power bank reserva
Plano B com rota estatica no PWA
Backup de dados feito antes do evento
Pessoa responsavel olhando `status.ps1`
```

## Riscos e mitigacoes

### Docker Desktop parado

Mitigacao: `preflight.ps1` e `status.ps1` devem falhar claramente se Docker nao responder.

### Notebook dormir

Mitigacao: configurar energia para nunca suspender durante o evento.

### Cloudflare/DNS incorreto

Mitigacao: padronizar dominio e testar `gps` e `live` antes do evento com rede externa.

### Celular mata app em background

Mitigacao: permissao de localizacao em segundo plano, excecao de bateria e teste com tela bloqueada.

### WebSocket cai

Mitigacao: heartbeat, reconexao, SSE e polling.

### Tile server limita acesso

Mitigacao: URL configuravel, provedor alternativo e rota estatica como plano B.

### Gateway vaza dado sensivel

Mitigacao: separar estado operacional de estado publico e testar payload no browser.

### Banco cresce demais

Mitigacao: salvar rota completa apenas do principal e limitar route_points dos demais.

## Ordem correta de implementacao

```text
1. Subir Traccar + MySQL local.
2. Validar /api/health.
3. Criar device manual.
4. Enviar posicao fake para 5055.
5. Configurar Cloudflare Tunnel para gps.
6. Testar Traccar Client real.
7. Criar Event Gateway com /health e login no Traccar.
8. Criar /public/state.
9. Criar /ws com heartbeat.
10. Criar /public/stream.
11. Criar admin "gerar caminhao".
12. Criar QR/instrucao.
13. Integrar PWA React.
14. Remover hypeneural.com.
15. Ajustar cache live no Service Worker.
16. Testar 2 celulares em campo.
17. Testar queda de internet e reconexao.
18. Fazer preflight final no dia.
```

## Proxima acao recomendada

Implementar Fase 0 e Fase 1:

1. Criar `tracking/`.
2. Criar `.gitignore` para secrets/dados/logs.
3. Criar Compose real com MySQL + Traccar.
4. Criar `.env.example`.
5. Subir localmente depois de iniciar Docker Desktop.
6. Validar Traccar em `http://localhost:8082`.
7. Criar dispositivo teste.
8. Enviar posicao fake para `http://localhost:5055`.

Depois disso, iniciar o Event Gateway.
