# Panorama Street View no rastreamento

Este módulo gera, sem consumir a API oficial paga do Google Street View, uma imagem 2x2 do entorno da coordenada recebida pelo Traccar. Eventos normais usam `TRACKER_NOTIFY_PHONE`; alertas de rastreador offline e recuperação usam `TRACKER_SYSTEM_ALERT_PHONE` quando configurado.

A implementação usa:

- planejamento de quatro capturas no estilo do **GSV_crawler**, nos ângulos absolutos 0°, 90°, 180° e 270°;
- espera e validação do `canvas` inspiradas no **USE-SVI**;
- Google Maps aberto em Chrome/Chromium por Selenium;
- composição e compressão JPEG com Pillow;
- envio da imagem diretamente em Base64 para a Z-API.

Os projetos de referência não são dependências de execução. Nenhum repositório externo precisa ficar instalado no servidor.

## Fluxo de funcionamento

1. O polling recebe um snapshot novo do Traccar e atualiza somente a máquina de estados.
2. O endereço disponível em cache é aplicado imediatamente; uma consulta ausente ou vencida é resolvida por outro worker, sem bloquear o polling.
3. O cartão de localização é persistido em uma outbox SQLite própria e continua independente da geração da imagem.
4. O texto de status é renderizado uma única vez, com endereço, link, horário e indicadores dinâmicos de velocidade e bateria. Esse payload imutável será usado como legenda da imagem ou como texto de fallback.
5. Quando o panorama é elegível, a outbox recebe um único conteúdo lógico no canal `panorama`, já com a legenda completa e o payload de fallback. O texto não é enfileirado em paralelo.
6. O worker abre quatro visualizações do mesmo ponto — Norte (0°), Leste (90°), Sul (180°) e Oeste (270°) — e valida dimensões, buffer WebGL, estabilidade entre quadros e qualidade dos pixels do maior `canvas` visível.
7. As quatro capturas são compostas em um mosaico 2x2. Se a Z-API aceitar o JPEG em Base64 e devolver um identificador, a mesma linha da outbox é concluída como imagem enviada.
8. Se a captura expirar, não houver cobertura, a composição falhar ou o envio imediato da imagem não for aceito, a mesma linha é convertida atomicamente para o canal `text`. O worker textual é acordado e envia o status completo, sem criar um segundo conteúdo concorrente.
9. Na inicialização, panoramas de uma execução anterior são convertidos para o texto de fallback antes de os workers começarem. Isso evita reabrir o Chrome para um alerta antigo e preserva a notificação após reinícios.

O navegador é reutilizado entre capturas para reduzir o custo de inicialização. A interface visível e a atribuição do Google permanecem dentro dos painéis; a implementação não tenta esconder logotipo, créditos ou avisos obrigatórios.

### Resultado no WhatsApp

Com `TRACKER_COMBINED_MESSAGE_ENABLED=true`, cada alerta produz no máximo dois conteúdos para o usuário:

- **Panorama concluído:** cartão de localização + mosaico com o status completo na legenda.
- **Panorama inelegível ou com falha:** cartão de localização + mensagem de texto com o mesmo status.

O cartão de localização e o conteúdo de status são processados de forma assíncrona, portanto um não bloqueia o outro e a ordem de chegada não é garantida. Se a localização for rejeitada pela política de precisão ou falhar definitivamente na Z-API, somente o conteúdo de status poderá chegar. Uma chave de conteúdo persistida no SQLite impede que imagem e texto sejam selecionados ao mesmo tempo para o mesmo alerta.

Se a legenda combinada ultrapassar `TRACKER_PANORAMA_CAPTION_MAX_CHARS`, o panorama não é enfileirado e o fluxo usa texto. O padrão interno é conservador: 900 caracteres, pois a documentação pública da Z-API não informa um limite numérico de legenda.

### Indicadores dinâmicos

Os templates calculam rótulo, emoji e valor exibido antes de persistir o alerta:

| Dado | Condição | Exibição |
|---|---|---|
| Bateria | abaixo de 20% | `🪫 Bateria fraca` |
| Bateria | 20% ou mais | `🔋 Bateria` |
| Bateria | ausente ou inválida | `🔋 Bateria: Não informada` |
| Velocidade | 0 km/h | `🛑 Parado` |
| Velocidade | de 1 a 9 km/h | `🐢 Marcha lenta` |
| Velocidade | 10 km/h ou mais | `🚗 Em deslocamento` |
| Velocidade | ausente ou inválida | `🚗 Velocidade: Não informada` |

Velocidades negativas são normalizadas para zero e os valores numéricos válidos são arredondados para apresentação. As mesmas variáveis aparecem tanto na legenda da imagem quanto no fallback textual.

## Política de envio

A imagem é considerada somente para snapshots atuais, com status `live`, coordenadas finitas e precisão aceitável. Por padrão, a leitura GPS deve ter no máximo 120 segundos, tolerância de 30 segundos para relógio adiantado e precisão de até 75 metros. Eventos offline, coordenadas `0,0` e snapshots desatualizados não disparam panorama.

- A primeira imagem elegível pode ser enviada imediatamente.
- Depois dela, um novo panorama exige pelo menos 15 minutos desde a última imagem e uma destas condições:
  - pelo menos 250 metros de deslocamento; **ou**
  - mudança de rua com pelo menos 60 metros de deslocamento, por padrão.
- Depois de uma falha, uma nova tentativa aguarda 5 minutos, por padrão.
- Um trabalho que ficar mais de 120 segundos na fila não abre o navegador e é promovido para o texto de fallback.
- O envio do JPEG tenta até 3 vezes por padrão (configuração limitada entre 1 e 10); a captura e a composição acontecem uma única vez.
- Quando a página confirma ausência de cobertura, a mesma área aguarda 360 minutos; deslocar pelo menos 500 metros libera uma tentativa antecipada.
- Existe apenas um trabalho pendente por veículo. Isso evita acumular panoramas antigos enquanto o veículo continua se movendo.

Se não houver cobertura de Street View, a coordenada fica registrada no SQLite para evitar tentativas repetitivas e o conteúdo lógico é promovido para texto. O cartão de localização permanece independente dessa falha.

## Requisitos

- Python compatível com o restante da automação;
- Google Chrome ou Chromium;
- dependências de `automation/requirements.txt`;
- acesso de saída do servidor ao Google Maps e à Z-API;
- credenciais Z-API já usadas pelo tracker.

Na pasta `automation`, instale as dependências:

```powershell
python -m pip install -r requirements.txt
```

Em Linux:

```bash
python3 -m pip install -r requirements.txt
```

Instale também o Chrome/Chromium pelo gerenciador de pacotes da distribuição. Se `TRACKER_CHROMEDRIVER_PATH` ficar vazio, o Selenium Manager tentará resolver o driver compatível; essa resolução pode precisar de internet na primeira execução. Em produção, fixar um ChromeDriver compatível com a versão principal do navegador reduz surpresas durante reinícios.

## Configuração

Copie somente as variáveis necessárias de `.env.tracker-panorama.example` para o `.env` real. Não coloque credenciais reais no arquivo de exemplo nem no controle de versão.

| Variável | Padrão | Uso |
|---|---:|---|
| `TRACKER_PANORAMA_ENABLED` | `true` | Ativa ou desativa o recurso. |
| `TRACKER_COMBINED_MESSAGE_ENABLED` | `true` | Usa o status completo como legenda e mantém texto apenas como fallback. `false` preserva o envio legado separado. |
| `TRACKER_PANORAMA_CAPTION_MAX_CHARS` | `900` | Limite interno da legenda combinada; acima dele, envia texto em vez de panorama. |
| `TRACKER_PANORAMA_HEADLESS` | `true` | Executa Chrome sem janela. |
| `TRACKER_CHROME_BINARY` | vazio | Caminho explícito do Chrome/Chromium. Vazio ativa descoberta automática. |
| `TRACKER_CHROMEDRIVER_PATH` | vazio | Caminho explícito do ChromeDriver. Vazio usa a resolução do Selenium. |
| `TRACKER_PANORAMA_WINDOW_WIDTH` | `1280` | Largura da janela usada na captura. |
| `TRACKER_PANORAMA_WINDOW_HEIGHT` | `720` | Altura da janela usada na captura. |
| `TRACKER_PANORAMA_PAGE_TIMEOUT_SECONDS` | `25.0` | Limite de espera por página/canvas. |
| `TRACKER_PANORAMA_SETTLE_SECONDS` | `2.5` | Tempo mínimo de estabilização do quadro válido. |
| `TRACKER_PANORAMA_RETRIES` | `1` | Repetições adicionais depois da primeira tentativa. |
| `TRACKER_PANORAMA_USE_SWIFTSHADER` | `true` | Permite renderização WebGL por software quando GPU não está disponível. |
| `TRACKER_PANORAMA_NO_SANDBOX` | `false` | Adiciona `--no-sandbox` ao Chrome; use apenas quando realmente necessário. |
| `TRACKER_PANORAMA_MAX_JPEG_BYTES` | `2000000` | Tamanho máximo desejado para o JPEG enviado. |
| `TRACKER_PANORAMA_RETRY_COOLDOWN_MINUTES` | `5` | Espera após falha antes de tentar novamente. |
| `TRACKER_PANORAMA_NO_IMAGERY_COOLDOWN_MINUTES` | `360` | Espera para repetir na mesma área sem cobertura. |
| `TRACKER_PANORAMA_NO_IMAGERY_RETRY_DISTANCE_M` | `500` | Deslocamento que libera uma nova tentativa antes do cooldown. |
| `TRACKER_PANORAMA_STREET_CHANGE_MIN_DISTANCE_M` | `60` | Distância mínima para antecipar envio após mudança de rua. |
| `TRACKER_PANORAMA_MAX_FIX_AGE_SECONDS` | `120` | Idade máxima da leitura GPS usada na imagem. |
| `TRACKER_PANORAMA_FUTURE_TOLERANCE_SECONDS` | `30` | Tolerância para diferença de relógio no futuro. |
| `TRACKER_PANORAMA_MAX_ACCURACY_M` | `75` | Pior precisão GPS aceita para panorama. |
| `TRACKER_PANORAMA_JOB_MAX_AGE_SECONDS` | `120` | Validade do trabalho antes da captura. |
| `TRACKER_PANORAMA_SEND_ATTEMPTS` | `3` | Tentativas do mesmo JPEG, limitadas entre 1 e 10. |
| `TRACKER_NOTIFICATION_MAX_ATTEMPTS` | `5` | Máximo de tentativas de texto/localização. |
| `TRACKER_NOTIFICATION_LEASE_SECONDS` | `45` | Lease de um worker sobre um item da outbox. |
| `TRACKER_NOTIFICATION_TEXT_TTL_SECONDS` | `300` | Validade de mensagens de texto pendentes. |
| `TRACKER_NOTIFICATION_LOCATION_TTL_SECONDS` | `180` | Validade de uma localização pendente. |
| `TRACKER_LOCATION_MAX_ACCURACY_M` | `100` | Pior precisão aceita para o cartão de localização. |
| `TRACKER_LEADER_LEASE_SECONDS` | `120` | Prazo renovável da liderança de processo único. |
| `TRACKER_GEOCODER_CACHE_TTL_SECONDS` | `21600` | Validade do endereço em cache. |
| `TRACKER_GEOCODER_CACHE_DISTANCE_M` | `150` | Deslocamento que solicita novo endereço. |
| `TRACKER_GEOCODER_STALE_CACHE_TTL_SECONDS` | `604800` | Período em que um endereço próximo ainda pode ser usado durante atualização em segundo plano. |
| `TRACKER_GEOCODER_STALE_CACHE_DISTANCE_M` | `150` | Distância máxima para reutilizar o endereço antigo com segurança. |
| `TRACKER_GEOCODER_MAX_ATTEMPTS` | `3` | Tentativas para respostas vazias ou falhas transitórias. |
| `TRACKER_GEOCODER_RETRY_BASE_SECONDS` | `0.25` | Base do backoff entre tentativas. |

As variáveis já existentes continuam sendo usadas:

- `TRACKER_NOTIFY_PHONE`: destino dos eventos normais de localização, texto e panorama;
- `TRACKER_SYSTEM_ALERT_PHONE`: destino exclusivo de `offline_tracker` e eventos `recovered_*`; vazio reutiliza `TRACKER_NOTIFY_PHONE`;
- `TRACKER_ENDPOINT`: endpoint público do estado do rastreamento;
- `TRACKER_SQLITE_PATH`: estado persistido da política de alertas;
- `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` e `ZAPI_CLIENT_TOKEN`: autenticação da Z-API.

No servidor, prefira um caminho absoluto em `TRACKER_SQLITE_PATH` para que o estado não mude de lugar se o diretório de execução for alterado.

## Teste local sem enviar WhatsApp

O comando de diagnóstico gera somente o JPEG local. Ele não chama a Z-API:

```powershell
python -m app.tracker.panorama_cli `
  --lat -23.5614 `
  --lng -46.6559 `
  --address "Avenida Paulista, São Paulo" `
  --output ".\panorama-teste.jpg"
```

Em Bash:

```bash
python3 -m app.tracker.panorama_cli \
  --lat -23.5614 \
  --lng -46.6559 \
  --address "Avenida Paulista, São Paulo" \
  --output "./panorama-teste.jpg"
```

Execute o comando a partir da pasta `automation`. Opções úteis:

- `--headed`: abre o navegador com janela para diagnóstico;
- `--chrome-binary CAMINHO`: escolhe o executável do navegador;
- `--chromedriver CAMINHO`: escolhe o driver;
- `--no-swiftshader`: desliga o fallback WebGL por software;
- `--timeout SEGUNDOS`: altera o limite de espera;
- `--title TEXTO`: altera o cabeçalho do mosaico.

Teste primeiro uma coordenada conhecida por ter Street View. Uma coordenada sem cobertura deve terminar sem produzir uma imagem válida; isso é comportamento esperado.

## Validação antes de ativar

1. Rode o CLI em uma coordenada com cobertura.
2. Confirme que o JPEG contém quatro direções diferentes e mantém os créditos visíveis.
3. Rode o CLI em uma coordenada sem cobertura e confirme que uma imagem preta não é aceita.
4. Verifique no log que Chrome e Selenium foram detectados.
5. Com o modo combinado ativo, confira que o sucesso gera somente cartão de localização + imagem com o status completo na legenda.
6. Simule ausência de cobertura ou falha imediata no envio da imagem e confira que chega cartão de localização + texto, sem uma terceira mensagem.
7. Valide os limites de bateria e velocidade: 19/20%, 0/1/9/10 km/h e valores ausentes.
8. Reinicie o serviço com um panorama pendente e confirme que ele é recuperado como texto antes de novos trabalhos.

Se Selenium ou Chrome não forem encontrados na inicialização, somente o panorama é desativado; o loop principal do tracker continua funcionando e usa o fluxo textual.

## Linux e PM2

Prefira uma única instância do processo da automação. O lease de liderança no SQLite impede processamento simultâneo acidental, inclusive durante sobreposição de reinícios; ainda assim, não há benefício em habilitar modo cluster para este serviço.

O Chrome headless aumenta o consumo de memória. O `ecosystem.config.js` usa `max_memory_restart: "512M"` e `kill_timeout: 50000`, dando margem ao navegador e até 50 segundos para o encerramento gracioso. Meça o consumo real; servidores menores ou capturas simultâneas podem exigir ajuste.

Depois de alterar o `.env`, reinicie carregando as novas variáveis:

```bash
pm2 restart caminhoneiro-automation --update-env
pm2 logs caminhoneiro-automation
```

Mantenha `TRACKER_PANORAMA_NO_SANDBOX=false` sempre que possível. O valor `true` reduz uma camada de segurança do Chrome e só deve ser usado em contêiner ou ambiente isolado quando o navegador não iniciar com o sandbox normal.

Garanta também:

- permissão de execução no Chrome/Chromium e ChromeDriver;
- permissão de escrita no diretório do SQLite e dos logs;
- fontes básicas instaladas para os textos do compositor;
- espaço temporário disponível para Chrome;
- encerramento gracioso: a captura ou requisição em curso recebe o prazo configurado, esperas e retries futuros são interrompidos, e o cliente Z-API nunca bloqueia o restart indefinidamente; após o timeout o Selenium recebe cancelamento.

## Limites e garantias

- **Cobertura:** nem toda coordenada possui Street View. Nesses pontos, o status segue como texto.
- **Interface externa:** o fluxo depende da página pública do Google Maps. Mudanças de DOM, consentimento, canvas ou políticas do serviço podem exigir manutenção.
- **Sem API paga:** não há chamada à API oficial paga nem API key de Street View, mas continuam existindo custo de servidor, tráfego e as condições de uso dos serviços acessados.
- **Atribuição:** créditos e elementos visíveis do Google não são removidos.
- **Processamento único:** a implantação pressupõe um único processo do tracker; o lease de liderança protege contra sobreposição acidental.
- **Uma escolha local por alerta:** a chave de conteúdo e a promoção atômica evitam que a aplicação escolha imagem e texto simultaneamente. Entretanto, não existe transação distribuída entre SQLite e Z-API: uma queda depois do aceite remoto e antes da confirmação local ainda pode causar reenvio.
- **Aceite não é entrega final:** a resposta HTTP com `messageId` confirma que a Z-API aceitou/enfileirou a imagem, não que o WhatsApp já a entregou. O fallback atual cobre falhas de captura, ausência de cobertura, expiração e falhas observáveis na requisição de envio.
- **Falha posterior ao aceite:** para reagir automaticamente a uma falha ocorrida depois do `messageId`, é necessário configurar e correlacionar o [DeliveryCallback](https://developer.z-api.io/en/webhooks/on-message-send) ou o [callback de mudança de status](https://developer.z-api.io/en/webhooks/on-whatsapp-message-status-changes). Sem esse webhook, o tracker não pode distinguir entrega final de falha posterior e não deve enviar texto especulativamente, pois isso recriaria duplicidade.
- **Resposta incompleta:** uma resposta da Z-API sem identificador de mensagem não é sucesso e ativa o texto de fallback.

## Solução de problemas

**“Panorama desativado: Selenium não instalado”**

Instale novamente `requirements.txt` no mesmo ambiente Python usado pelo PM2.

**“Google Chrome/Chromium não encontrado”**

Instale o navegador ou defina `TRACKER_CHROME_BINARY` com o caminho completo.

**ChromeDriver incompatível**

Atualize o driver para a mesma versão principal do Chrome, ou deixe `TRACKER_CHROMEDRIVER_PATH` vazio para o Selenium Manager resolver uma versão compatível.

**Quadro preto, branco ou incompleto**

Mantenha SwiftShader ativo, aumente `TRACKER_PANORAMA_PAGE_TIMEOUT_SECONDS` e verifique se o servidor permite WebGL por software. O validador rejeita quadros sem textura, parcialmente vazios ou instáveis.

**A coordenada abre o Maps, mas nenhuma imagem é enviada**

Confirme primeiro a cobertura real no Street View. A página pode abrir o mapa comum sem disponibilizar um panorama; esse caso é rejeitado corretamente e deve promover o status para texto. Consulte o motivo de fallback no log e o cooldown persistido no SQLite.

**Reinícios frequentes no PM2**

Revise o limite de 512 MB, os logs do Chrome e o espaço temporário; aumente o valor somente se o consumo medido justificar.
