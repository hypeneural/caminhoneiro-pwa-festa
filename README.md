# PWA Festa do Caminhoneiro - São Cristóvão 2025

Progressive Web App oficial da Festa do Caminhoneiro de Tijucas/SC, que acontecerá nos dias 19 e 20 de julho de 2025. Este PWA simula perfeitamente um aplicativo mobile nativo, oferecendo uma experiência completa para acompanhar a procissão de São Cristóvão, notícias, galeria de fotos e programação do evento.

## Project info

**URL**: https://lovable.dev/projects/6a4cbc5b-381a-4084-bdeb-fb77b8417e3f

## Funcionalidades Principais

### 📱 Design Mobile-First
- Interface que simula aplicativo nativo
- Navegação por bottom tabs
- Stories estilo Instagram
- Carrosséis touch-friendly
- Floating Action Button (FAB)
- Safe area handling para dispositivos com notch

### 🚛 Tracking de São Cristóvão
- Localização em tempo real do caminhão
- Status de movimento (parado/em movimento)
- Próximas paradas da procissão
- Indicador "AO VIVO" pulsante

### ⏰ Countdown Timer
- Contagem regressiva para o evento
- Layout compacto otimizado para mobile
- Animações de flip nos números

### 📰 Carrosséis Interativos
- Carousel de notícias com scroll horizontal
- Carousel de fotos em destaque
- Gesture de swipe otimizado
- Preload de imagens para performance

### 🎯 Menu de Acesso Rápido
- Grid 3x3 com ícones temáticos
- Galeria, Mapa, Programação, Rádio, Vídeos, História
- Feedback tátil e animações de press

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6a4cbc5b-381a-4084-bdeb-fb77b8417e3f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Tecnologias e Arquitetura

### Stack Principal
- **React 18+** com TypeScript para tipagem estática
- **Vite** como bundler e dev server otimizado
- **Tailwind CSS** com design system customizado
- **Shadcn UI** para componentes base consistentes

### Animações e Interações
- **Framer Motion** para animações nativas mobile
- **Lucide React** para ícones temáticos
- **React Router** para navegação SPA

### Otimizações Mobile
- **Touch gestures** otimizados para carrosséis
- **Safe area handling** para dispositivos com notch
- **Lazy loading** agressivo para performance
- **PWA ready** com manifest e service worker

### Design System
- **Semantic tokens** para cores temáticas (trucker-blue, trucker-red, etc.)
- **Mobile-first** responsiveness
- **Dark/Light mode** support via CSS variables
- **Component-driven** architecture

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6a4cbc5b-381a-4084-bdeb-fb77b8417e3f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
