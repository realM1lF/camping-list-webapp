# Packlisten-UI Polish Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Layout-Bugs fixen, Claim-Stepper wie Benötigt, Filter eine Zeile, Kategorie-Default + Kompakt-Ansicht.

**Architecture:** CategoryView für beide Dichten; ItemRow mit `compact`; ItemDetailSheet Stepper vereinheitlichen; FilterBar kompakter.

**Tech Stack:** SvelteKit 2 / Svelte 5, Tailwind 4

---

### Task 1: Types + Trip-Page Ansicht

**Files:** `src/lib/types.ts`, `src/routes/trip/[id]/+page.svelte`

- [ ] `ListView` → `'category' | 'compact'`, Default `category`, localStorage migrieren
- [ ] Nur noch `CategoryView` mit `density`

### Task 2: CategoryView + ItemRow kompakt

**Files:** `CategoryView.svelte`, `ItemRow.svelte`

- [ ] `density` Prop; kompakte Zeile (eine Linie, weniger Padding)

### Task 3: FilterBar

**Files:** `FilterBar.svelte`

- [ ] `flex-nowrap`, kleinere Chips

### Task 4: ItemDetailSheet + Comments

**Files:** `ItemDetailSheet.svelte`, `CommentThread.svelte`, ggf. `EmojiPicker.svelte`

- [ ] Titel-Wrap, Claim-Stepper, Zahlen-Fix, Kommentar-Höhe, kompaktes Löschen
