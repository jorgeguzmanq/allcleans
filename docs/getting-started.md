# Getting Started

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Commands

```bash
npm run dev      # Dev server en localhost:3000
npm run build   # Production build
npm run start   # Start production build
npm run lint   # ESLint
```

## Variables de entorno

Crear `.env.local` con las variables de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```