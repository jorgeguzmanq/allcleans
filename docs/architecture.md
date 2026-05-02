# Architecture

## Stack

- **Framework:** Next.js 16.2.4 (App Router)
- **UI:** React 19 + TypeScript 5
- **Styling:** TailwindCSS 4
- **Components:** shadcn/ui + base-ui/react
- **Animation:** framer-motion
- **Database:** Supabase

## Estructura del Proyecto

```
src/
├── app/                    # App Router
│   ├── globals.css        # Estilos globales + theme
│   ├── layout.tsx        # Root layout
│   └── page.tsx         # Página principal
├── components/
│   └── ui/            # Componentes shadcn
├── lib/
│   └── utils.ts        # Utilidades
```

## Convenciones

- Componentes en `src/components/ui/`
- Utilidades en `src/lib/utils.ts`
- Alias: `@/*` → `src/*`