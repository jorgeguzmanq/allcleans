<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Next.js 16 has breaking changes — read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands

```bash
npm run dev      # dev server on :3000
npm run build   # production build
npm run start   # start production build
npm run lint    # ESLint 9 with flat config
```

## Stack

- Next.js 16.2.4 (App Router, Turbopack)
- React 19.2.4, TypeScript 5
- TailwindCSS 4 + @tailwindcss/postcss
- ESLint 9 (flat config in eslint.config.mjs)
- shadcn/ui + base-ui/react
- framer-motion, supabase

## Project structure

- `src/app/` — App Router pages and layouts
- `src/components/ui/` — shadcn components (button.tsx exists)
- `src/lib/utils.ts` — utility functions
- No test suite configured — add tests manually if needed