# Forge CLI

TypeScript stack scaffolding & enforcement CLI for **TanStack Start + Convex + Tailwind**.

The key insight: Claude Code reads `CLAUDE.md` automatically. Forge uses this as a **hook** — imperative instructions that tell Claude it MUST use the forge CLI commands. No more AI drift.

## Installation

```bash
npm install -g forge-cli
```

Or use with npx:

```bash
npx forge-cli init my-app
```

## Commands

### `forge init <project-name>`

Creates a complete project with:
- TanStack Start (file-based routing, SSR-ready)
- Convex (real-time database)
- Tailwind CSS + shadcn/ui ready
- Biome (linting/formatting)
- TypeScript strict mode
- **CLAUDE.md** — the AI hook

```bash
forge init my-app
cd my-app
pnpm install
npx convex dev --once --configure=new
pnpm dlx shadcn@latest init
pnpm dev
```

### `forge add:feature <name>`

Creates a full vertical slice:

```
convex/features/<name>/
├── schema.ts      # Table definition (exports <name>Tables)
├── queries.ts     # All queries
├── mutations.ts   # All mutations
└── index.ts       # Barrel export

src/features/<name>/
├── components/
│   └── index.ts   # Component exports
├── hooks.ts       # Feature hooks
└── index.ts       # Barrel export

app/routes/<name>/
├── index.tsx      # List view
└── $id.tsx        # Detail view
```

Also auto-registers the schema in `convex/schema.ts`.

```bash
forge add:feature projects

# Output:
✓ Created convex/features/projects/schema.ts
✓ Created convex/features/projects/queries.ts
✓ Created convex/features/projects/mutations.ts
✓ Created convex/features/projects/index.ts
✓ Created src/features/projects/components/index.ts
✓ Created src/features/projects/hooks.ts
✓ Created src/features/projects/index.ts
✓ Created app/routes/projects/index.tsx
✓ Created app/routes/projects/$id.tsx
✓ Updated convex/schema.ts
```

### `forge check`

Validates project structure. Fails if rules are broken. Use in CI/pre-commit.

```bash
forge check

# Output:
✓ Feature structure valid
✓ Component locations valid
✓ Hook locations valid
✓ Thin routes valid
✓ Cross-feature imports valid
✓ Feature parity valid

All checks passed!
```

## Validation Rules

1. **Feature structure** — Every feature has required files
2. **Component location** — Components only in `src/features/*/components/` or `src/components/`
3. **Hook location** — Hooks only in `src/features/*/hooks.ts` or `src/hooks/`
4. **Thin routes** — Route files can only import from features/components, no business logic
5. **No cross-feature imports** — `src/features/X/` cannot import from `src/features/Y/`
6. **Feature parity** — Every `src/features/X` has matching `convex/features/X`

## The CLAUDE.md Hook

When you run `forge init`, it generates a `CLAUDE.md` file that instructs Claude Code to:

1. **Always** run `forge add:feature <name>` before building any feature
2. **Never** create feature files manually
3. **Always** run `forge check` before completing any task

This eliminates AI drift and enforces consistent architecture.

```markdown
# From generated CLAUDE.md

## YOU MUST USE FORGE CLI

When the user asks you to build ANY feature, you MUST:
1. FIRST run `forge add:feature <name>`
2. THEN fill in the generated files
3. NEVER create feature files manually
```

## Project Structure

```
app/routes/         → Thin route files (import from features, no logic)
src/features/       → All feature code (components, hooks, types)
src/components/     → Shared UI only (used across features)
src/lib/            → Pure utilities
convex/features/    → Backend mirrors frontend features
```

## Stack

- **Frontend**: TanStack Start
- **Backend**: Convex
- **Styling**: Tailwind CSS + shadcn/ui
- **Linting**: Biome
- **Language**: TypeScript (strict)

## License

MIT
