# Backlog tecnico inicial

Este backlog lista os problemas encontrados no preparo local. Ele serve como ponto de partida antes de implementar novas melhorias.

## Qualidade de codigo

- `npm run lint` falha com 185 erros e 47 avisos.
- Maior volume: `@typescript-eslint/no-explicit-any` em componentes, hooks, services e types.
- Risco alto: `react-hooks/rules-of-hooks` em `src/components/tracker/TrackerMetrics.tsx`.
- Risco medio: dependencias incompletas em `useEffect`, `useMemo` e `useCallback`.
- Ajustes rapidos: `prefer-const`, `no-case-declarations`, interfaces vazias em componentes UI e import `require()` no Tailwind.

## Tipagem

- `npm run type-check` falha mesmo com `strict` desativado na app.
- Principais grupos:
  - Modelos de menu divergentes entre `src/types/menu.ts`, `src/data/menuData.ts` e componentes de menu.
  - Contratos antigos de camera foram removidos junto com a pagina de cameras ao vivo.
  - Tipos legados de FAQ, dispositivo/PWA e busca por voz ainda precisam ser alinhados.
  - Informacoes de dispositivo/PWA usadas por hooks e componentes, mas ausentes no retorno de `useDeviceDetection`.
  - Assinatura de `useVoiceSearch` diferente do uso em `FAQSearch`.

## Build e performance

- `npm run build` passa.
- Bundle principal atual: aproximadamente 3.236 MB minificado, 970 KB gzip.
- O build avisa que alguns chunks passam de 1000 KB.
- Leaflet aparece importado de forma estatica e dinamica, entao o split atual nao separa esse pacote como esperado.
- Browserslist/caniuse-lite esta desatualizado.

## Dependencias

- `npm ci` instalou corretamente.
- O npm audit reportou 30 vulnerabilidades: 2 baixas, 9 moderadas, 18 altas e 1 critica.
- Nao aplicar `npm audit fix` sem revisar impacto, porque pode alterar versoes e comportamento.

## Ordem recomendada de ataque

1. Corrigir primeiro erros de hooks e declaracoes em `case`, porque podem virar bugs em runtime.
2. Consolidar tipos de `MenuItem`, FAQ e PWA/device.
3. Trocar `any` por tipos de dominio conforme os modelos forem estabilizados.
4. Revisar vulnerabilidades com foco em dependencias diretas.
5. Quebrar bundle por rotas e bibliotecas pesadas: mapa, galeria, radio e animacoes.
6. Adicionar testes smoke para home, menu, galeria, mapa e instalacao PWA.
