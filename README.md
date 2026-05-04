# CPD Portal - UniKL RCMP

Continuing Professional Development (CPD) web application for **Universiti Kuala Lumpur Royal College of Medicine Perak (UniKL RCMP)** staff.

Created by **Information Technology Department, RCMP**.

## Overview

The portal supports multiple roles **Staff**, **Administrator**, and **Head of Department (HOD)** with dashboards, CPD requisition workflows, history, reports (admin), and department review queues (HOD). The UI is built with React and Tailwind CSS using a consistent design system (HSL tokens in `src/index.css`, shadcn/ui-style components under `src/components/ui`).

## Tech stack

| Area | Choice |
|------|--------|
| Runtime | React 18, TypeScript |
| Build | Vite 5 |
| Routing | react-router-dom v6 |
| Data / async | TanStack Query (React Query) |
| Styling | Tailwind CSS 3, `tailwindcss-animate` |
| Components | Radix UI primitives, [shadcn/ui](https://ui.shadcn.com/) patterns (`src/components/ui`) |
| Icons | lucide-react |
| Forms / validation | react-hook-form, zod (available in project) |
| Charts | recharts |

## Requirements

- **Node.js** 18+ (recommended LTS)
- **npm** (or compatible package manager)

## Project layout (high level)

```
src/
  App.tsx              # Router + providers
  main.tsx             # Entry
  index.css            # Global styles & CSS variables (design tokens)
  pages/               # Index, login, NotFound
  staff/               # Staff role screens & sidebar
  admin/               # Admin screens & sidebar
  HOD/                 # HOD screens & sidebar
  components/
    ui/                # shadcn-style primitives
    cpd/               # Shared marketing/footer pieces (if used)
public/
  rcmp-real.png        # Branding (login, etc.)
  unikl-rcmp.png       # Sidebar logo (role shells)
```

## Design & conventions

- Semantic colors use CSS variables (see `src/index.css`); prefer Tailwind tokens such as `bg-background`, `text-muted-foreground`, `border-border`.
- Headings often use `font-display` (Plus Jakarta Sans); body text follows Inter via Tailwind config.
- Role layouts use a fixed desktop sidebar (`w-72`) and main content with `md:pl-72`.

## License / ownership

Internal UniKL RCMP project, distribution and licensing are governed by UniKL RCMP ITD policy.