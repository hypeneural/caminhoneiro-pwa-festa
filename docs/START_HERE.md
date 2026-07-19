# Comece por aqui

Este arquivo resume o estado local do projeto depois do primeiro preparo no workspace.

## Projeto

- Repositorio: `https://github.com/hypeneural/caminhoneiro-pwa-festa`
- Pasta local: `C:\Users\Usuario\Documents\New project 4\caminhoneiro-pwa-festa`
- Stack: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, PWA com Workbox e Capacitor.
- Porta local configurada: `http://localhost:8080`

## Comandos principais

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run lint
npm run type-check
```

Para testar em outro dispositivo na mesma rede:

```bash
npm run dev:host
```

## Status verificado

- Dependencias instaladas com `npm ci`.
- Build de producao validado com `npm run build`.
- O lint ainda falha por dividas existentes no codigo: 185 erros e 47 avisos na verificacao atual.
- O type-check tambem falha por inconsistencias reais de tipos entre componentes, hooks e modelos de dados.
- O `dev-dist` agora foi excluido do lint porque contem arquivos gerados do service worker.
- O npm reportou vulnerabilidades em dependencias. Nao foi aplicado `npm audit fix` automaticamente para evitar mudancas grandes de versoes sem revisao.

## Organizacao do codigo

- `src/pages`: telas principais.
- `src/components`: componentes por dominio ou UI base.
- `src/hooks`: hooks reutilizaveis.
- `src/services`: servicos, cache, API e PWA.
- `src/types`: tipos compartilhados.
- `src/data`: dados mockados e conteudo estatico.
- `src/constants`: constantes de rotas, textos, cores e configuracoes.
- `config`: configuracoes de build, PWA, Workbox e otimizacao.
- `public/assets`: imagens, banners, icones e assets publicos.

## Primeiras frentes recomendadas

1. Corrigir lint por grupos, comecando por erros de hooks e `no-case-declarations`.
2. Revisar dependencias vulneraveis com `npm audit` e decidir atualizacoes com teste de regressao.
3. Reduzir o bundle principal, que passa de 3 MB minificado no build atual.
4. Criar documentacao curta de arquitetura por dominio antes de grandes refatoracoes.
5. Adicionar testes de fluxo critico antes de mexer em mapa, galeria, PWA/cache e radio.

Veja tambem: `docs/TECHNICAL_BACKLOG.md`.
