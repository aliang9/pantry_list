# How This App Was Built: A Full-Stack Guide

This document walks through how the Pantry Assistant PWA was built from scratch — the decisions, the commands, the debugging, and how every piece connects. Written for someone who hasn't done full-stack development before.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [The Tech Stack and Why](#2-the-tech-stack-and-why)
3. [How to Start a Project Like This](#3-how-to-start-a-project-like-this)
4. [How the Pieces Connect](#4-how-the-pieces-connect)
5. [Key Concepts Explained](#5-key-concepts-explained)
6. [File-by-File Walkthrough](#6-file-by-file-walkthrough)
7. [The Hardest Part: Streaming Chat with Tool Use](#7-the-hardest-part-streaming-chat-with-tool-use)
8. [Common Debugging Scenarios](#8-common-debugging-scenarios)
9. [Current Limitations](#9-current-limitations)
10. [Ways to Improve](#10-ways-to-improve)
11. [Commands Reference](#11-commands-reference)

---

## 1. The Big Picture

This app is a **Progressive Web App (PWA)** — a website that can be installed on your phone and feels like a native app. It has three main layers:

```
┌─────────────────────────────────────────────┐
│              YOUR PHONE / BROWSER           │
│  ┌───────────────────────────────────────┐  │
│  │         React Frontend (Next.js)      │  │
│  │  Chat UI, Pantry View, Settings       │  │
│  └──────────────┬────────────────────────┘  │
│                 │ HTTP requests              │
│  ┌──────────────▼────────────────────────┐  │
│  │         API Routes (Next.js)          │  │
│  │  /api/chat, /api/pantry               │  │
│  └──────┬───────────────┬────────────────┘  │
│         │               │                   │
│  ┌──────▼──────┐ ┌──────▼──────┐           │
│  │  Claude API │ │  Supabase   │           │
│  │  (Anthropic)│ │  (Postgres) │           │
│  └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────┘
```

**Data flow when you type "I bought 6 eggs":**

1. Your message goes to the frontend (`useChat` hook)
2. Frontend POSTs to `/api/chat` on the server
3. Server sends your message to Claude with tool definitions
4. Claude decides to call `update_pantry` with `{name: "eggs", quantity: 6}`
5. Server executes that tool → inserts into Supabase database
6. Server sends tool result back to Claude
7. Claude writes a friendly confirmation: "Got it! Added 6 eggs to your pantry."
8. That text streams back to your browser character by character
9. Frontend invalidates the pantry cache so the Pantry tab updates

---

## 2. The Tech Stack and Why

### Next.js (Framework)
**What it is:** A React framework that handles both the frontend AND the backend in one project.

**Why:** Without Next.js, you'd need to set up a separate React app AND a separate Node.js server. Next.js gives you both in one codebase. The "App Router" (the `src/app/` directory structure) maps folders directly to URLs:
- `src/app/page.tsx` → `yoursite.com/`
- `src/app/pantry/page.tsx` → `yoursite.com/pantry`
- `src/app/api/chat/route.ts` → `yoursite.com/api/chat`

### Supabase (Database + Auth)
**What it is:** A hosted PostgreSQL database with built-in authentication and security.

**Why:** Setting up a database, user authentication, and security policies from scratch takes weeks. Supabase gives you all three with a dashboard. You write SQL for your schema, and it handles the rest — user sign-up, session tokens, row-level security (ensuring users can only see their own data).

### Tailwind CSS (Styling)
**What it is:** A utility-first CSS framework. Instead of writing CSS classes, you use pre-built utility classes directly in your HTML.

**Why:** Instead of writing:
```css
.my-button { background-color: green; padding: 12px; border-radius: 12px; }
```
You write:
```html
<button className="bg-green-600 py-3 rounded-xl">
```
It's faster, more consistent, and the classes are self-documenting.

### TypeScript (Language)
**What it is:** JavaScript with type checking.

**Why:** Catches bugs before they happen. If a function expects a number and you pass a string, TypeScript tells you immediately. Essential for a project with this many moving parts.

### SWR (Data Fetching)
**What it is:** A React hook library for fetching data with built-in caching.

**Why:** When you fetch pantry items, SWR caches the result. If you switch tabs and come back, it shows cached data instantly while re-fetching in the background. The key feature we use: when Claude updates the pantry via chat, we call `mutate("/api/pantry")` to invalidate the cache, making the Pantry tab refetch automatically.

### Zod (Validation)
**What it is:** A runtime type validation library.

**Why:** TypeScript only checks types at compile time. Zod validates data at runtime — when a user submits a form or an API receives a request, Zod ensures the data has the right shape before it hits the database.

---

## 3. How to Start a Project Like This

### Step 1: Initialize the project
```bash
# Create a new Next.js project (interactive prompts)
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir

# Or manually (what we did, since create-next-app conflicted with existing files):
npm init -y
npm install next react react-dom
npm install -D typescript @types/react @types/node tailwindcss @tailwindcss/postcss postcss
```

### Step 2: Install your specific dependencies
```bash
# Database + Auth
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install @anthropic-ai/sdk

# Utilities
npm install zod swr react-markdown
```

### Step 3: Create your config files
- `tsconfig.json` — TypeScript settings, path aliases (`@/` → `src/`)
- `next.config.ts` — Next.js settings
- `postcss.config.mjs` — tells PostCSS to use Tailwind
- `.env.local` — secret keys (never commit this!)
- `.gitignore` — what NOT to track in git

### Step 4: Set up your database
- Create a Supabase project at supabase.com
- Write your SQL migration (table definitions, indexes, security policies)
- Run the SQL in the Supabase dashboard SQL editor

### Step 5: Build feature by feature
Build in this order — each step is testable before moving on:
1. Basic page that renders → proves the framework works
2. Auth flow → proves you can log in
3. App shell (navigation) → proves routing works
4. CRUD operations → proves the database works
5. AI integration → proves the API works
6. Polish → makes it feel good

**Key principle:** Always get the simplest version working first, then add complexity.

---

## 4. How the Pieces Connect

### The Request Lifecycle

Every request to the app goes through this chain:

```
Browser Request
    ↓
middleware.ts (runs FIRST on every request)
    ↓ checks: is the user logged in?
    ↓ if no → redirect to /login
    ↓ if yes → refresh the session cookie, continue
    ↓
Next.js Router (matches URL to a page or API route)
    ↓
Page Component or API Route Handler
    ↓
Response back to browser
```

### How Auth Flows

```
1. User enters email on /login
    ↓
2. Browser calls supabase.auth.signInWithOtp({ email })
    ↓
3. Supabase sends an email with a 6-digit code
    ↓
4. User enters code
    ↓
5. Browser calls supabase.auth.verifyOtp({ email, token })
    ↓
6. Supabase validates → sets session cookies in the browser
    ↓
7. Browser redirects to /
    ↓
8. middleware.ts sees valid session → allows access
```

### How Data Flows (Pantry)

```
Frontend (usePantry hook)
    ↓ GET /api/pantry
API Route (src/app/api/pantry/route.ts)
    ↓ authenticates user via Supabase server client
    ↓ queries: SELECT * FROM pantry_items WHERE user_id = ?
Supabase (PostgreSQL)
    ↓ returns rows
API Route
    ↓ returns JSON
Frontend
    ↓ SWR caches the result
    ↓ React renders the pantry list
```

### How Chat Connects to Pantry (The Magic)

This is the most interesting part of the architecture:

```
1. User types "I bought eggs" in Chat tab
2. useChat hook POSTs to /api/chat
3. Server sends message to Claude with tool definitions
4. Claude responds with a tool_use block: update_pantry({...})
5. Server executes the tool → writes to Supabase
6. Server sends SSE event: tool_result
7. useChat hook receives tool_result event
8. useChat calls mutate("/api/pantry")  ← THIS IS THE KEY LINE
9. SWR sees the cache key "/api/pantry" was invalidated
10. usePantry (in the Pantry tab) refetches data
11. Pantry view updates automatically
```

The user never has to refresh. The chat and pantry are connected through SWR's cache.

---

## 5. Key Concepts Explained

### Server Components vs Client Components

In Next.js App Router, components are **server components** by default. They run on the server and send HTML to the browser. They can't use `useState`, `useEffect`, or browser APIs.

To make a component interactive (clicks, state, effects), add `"use client"` at the top. This makes it a **client component** — it runs in the browser.

```
Server Components: fetch data, render HTML, no interactivity
Client Components: useState, useEffect, onClick, browser APIs
```

**Rule of thumb:** Start with server components. Only add `"use client"` when you need interactivity.

### Route Groups: (auth) and (app)

Folders wrapped in parentheses are **route groups**. They organize code without affecting the URL:
- `src/app/(auth)/login/page.tsx` → URL is `/login` (not `/auth/login`)
- `src/app/(app)/pantry/page.tsx` → URL is `/pantry` (not `/app/pantry`)

Each group can have its own `layout.tsx`. The `(app)` group wraps everything in the bottom navigation bar. The `(auth)` group doesn't — the login page stands alone.

### Row-Level Security (RLS)

RLS is a database-level security feature. Instead of checking permissions in your application code, you define policies directly on the database table:

```sql
CREATE POLICY "Users can view their own pantry items"
  ON pantry_items FOR SELECT
  USING (auth.uid() = user_id);
```

This means: even if someone crafts a malicious API request, they physically cannot read another user's data. The database itself enforces it.

### Server-Sent Events (SSE)

SSE is a protocol for streaming data from server to browser. Unlike WebSockets (which are bidirectional), SSE is one-way: server → browser. Perfect for streaming Claude's response.

The format is simple text:
```
event: text
data: "Hello"

event: text
data: ", how"

event: tool_call
data: {"name": "update_pantry", "input": {...}}

event: done
data: {}
```

The browser reads this stream chunk by chunk and updates the UI as each piece arrives — that's why you see text appear word by word.

### Environment Variables

Secrets (API keys, database passwords) are stored in `.env.local`, which is never committed to git. Next.js has a convention:

- `NEXT_PUBLIC_*` — exposed to the browser (okay for Supabase URL/anon key)
- Everything else — server-only (API keys, service role keys)

**Never put the Anthropic API key or Supabase service role key in a `NEXT_PUBLIC_` variable.** They'd be visible to anyone using your app.

---

## 6. File-by-File Walkthrough

### Core Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts (`npm run dev`, `npm run build`) |
| `tsconfig.json` | TypeScript config, `@/` path alias maps to `src/` |
| `next.config.ts` | Next.js settings (currently minimal) |
| `postcss.config.mjs` | Tells PostCSS to use Tailwind v4 |
| `.env.local` | Secret keys — **never commit this** |
| `.gitignore` | Excludes node_modules, .next, .env.local from git |

### Layout & Styling

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root HTML shell: `<html>`, `<head>`, `<body>`. Sets PWA meta tags, dark mode init script |
| `src/app/globals.css` | Imports Tailwind, defines dark mode variant, hides scrollbars on chips |
| `public/manifest.json` | PWA config: app name, icons, standalone display mode |

### Auth

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Runs on every request. Calls `updateSession()` to check auth |
| `src/lib/supabase/middleware.ts` | The actual session check: validates token, redirects to `/login` if expired |
| `src/lib/supabase/server.ts` | Creates a Supabase client that can read/write cookies (for API routes) |
| `src/lib/supabase/client.ts` | Creates a Supabase client for the browser (for client components) |
| `src/lib/supabase/admin.ts` | Creates a Supabase client with the service role key (bypasses RLS) |
| `src/app/(auth)/login/page.tsx` | Login form: email → OTP code → session |
| `src/app/auth/callback/route.ts` | Handles magic link redirects (still works if someone clicks the link) |

### App Shell

| File | Purpose |
|------|---------|
| `src/app/(app)/layout.tsx` | Wraps all authenticated pages with bottom nav and safe area padding |
| `src/components/BottomNav.tsx` | The tab bar: Chat, Pantry, Settings. Highlights active tab |
| `src/app/(app)/error.tsx` | Error boundary — shows "Something went wrong" with retry button |
| `src/app/(app)/loading.tsx` | Loading spinner shown during page transitions |

### Pantry Feature

| File | Purpose |
|------|---------|
| `src/app/api/pantry/route.ts` | GET (list all items) and POST (create item) |
| `src/app/api/pantry/[id]/route.ts` | PATCH (update item) and DELETE (remove item) |
| `src/lib/validators/pantry.ts` | Zod schemas: validates name, category, quantity, unit before DB write |
| `src/hooks/usePantry.ts` | SWR hook: fetches items, provides add/update/delete with optimistic updates |
| `src/app/(app)/pantry/page.tsx` | Pantry page: search, category filters, grouped list, FAB button |
| `src/components/pantry/PantryItemCard.tsx` | Single item card with swipe-to-delete gesture |
| `src/components/pantry/PantryAddSheet.tsx` | Bottom sheet form for adding a new item |
| `src/components/pantry/PantryEditSheet.tsx` | Bottom sheet form for editing an existing item |

### Chat + AI Feature

| File | Purpose |
|------|---------|
| `src/lib/claude/tools.ts` | Defines the 3 tools Claude can call (update_pantry, query_pantry, suggest_recipe) |
| `src/lib/claude/system-prompt.ts` | Instructions for Claude: persona, tone, when to use each tool |
| `src/lib/claude/tool-executor.ts` | Executes tool calls against Supabase (the bridge between Claude and the database) |
| `src/app/api/chat/route.ts` | The SSE streaming endpoint: sends messages to Claude, handles tool use loop |
| `src/hooks/useChat.ts` | Client-side: sends messages, parses SSE stream, updates UI, persists conversation |
| `src/app/(app)/page.tsx` | Chat page: message list, auto-scroll, empty state |
| `src/components/chat/ChatMessage.tsx` | Message bubble: user (green, right) or assistant (gray, left, with markdown) |
| `src/components/chat/ChatInput.tsx` | Text input with auto-resize, send button, quick-action chips |
| `src/components/chat/ToolCallIndicator.tsx` | Shows "Updating pantry..." with spinner, then checkmark on success |

### Types

| File | Purpose |
|------|---------|
| `src/types/pantry.ts` | `PantryItem` and `PantryCategory` type definitions |
| `src/types/chat.ts` | `ChatMessage`, `ToolCallInfo`, `SSEEvent` type definitions |

---

## 7. The Hardest Part: Streaming Chat with Tool Use

This is the most complex piece of the app. Here's the full flow:

### Server Side (`src/app/api/chat/route.ts`)

```
POST /api/chat
  ↓
1. Authenticate user (check Supabase session)
  ↓
2. Trim messages to last 20 (context window management)
  ↓
3. Create a ReadableStream (SSE response)
  ↓
4. Call processConversation() — this is recursive:
  ↓
  4a. Call Claude with streaming enabled
  4b. As text arrives → send SSE "text" events to browser
  4c. Wait for Claude to finish (finalMessage)
  4d. Did Claude call any tools?
      ↓ NO → we're done, send "done" event
      ↓ YES → for each tool:
          - Send "tool_call" event to browser (UI shows spinner)
          - Execute the tool against Supabase
          - Send "tool_result" event to browser (UI shows checkmark)
          - Collect tool results
      ↓
  4e. Append tool results to message history
  4f. Call processConversation() AGAIN (recursive!)
      Claude now sees the tool results and writes a human response
      ↓
  4g. depth > 5? Stop (prevents infinite loops)
```

### Client Side (`src/hooks/useChat.ts`)

```
sendMessage("I bought eggs")
  ↓
1. Add user message to state (appears immediately in UI)
  ↓
2. Add empty assistant message (placeholder)
  ↓
3. POST to /api/chat with full message history
  ↓
4. Read response as a stream:
   while (stream has data) {
     read chunk → add to buffer → split by newlines → parse SSE events

     "text" event → append to assistant message content (streaming effect)
     "tool_call" event → add pending tool indicator to message
     "tool_result" event → mark tool as done + call mutate("/api/pantry")
   }
  ↓
5. Stream ends → save conversation to Supabase
```

### Why This Is Hard

- You can't just pipe Claude's stream directly to the browser because you need to intercept tool calls and execute them server-side
- The Anthropic SDK's streaming API sends text in small chunks — you need to accumulate them
- SSE events can arrive split across chunks (a single `read()` might give you half an event) — that's why we use a buffer
- Tool execution is async — while a tool runs, the stream pauses
- Multiple tools can be called in one response
- After tools execute, you need to call Claude AGAIN with the results

---

## 8. Common Debugging Scenarios

### "The page is blank / white screen"
**Check:** Open browser DevTools (F12) → Console tab. Look for errors.
**Common causes:**
- Missing environment variables (check `.env.local`)
- Import error (typo in file path)
- Server component using client-only code (`useState` without `"use client"`)

### "Build fails with prerender error"
**Cause:** A page tries to call Supabase during static generation (build time), but there's no session.
**Fix:** Add `export const dynamic = "force-dynamic"` to the page or layout. This tells Next.js to render at request time, not build time.

### "Auth redirect loop (keeps going to /login)"
**Check:** Are your Supabase env vars correct? Is the session cookie being set?
**Debug:** In DevTools → Application → Cookies, look for `sb-*` cookies.
**Common cause:** `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is wrong.

### "Magic link opens in wrong browser (iOS PWA)"
**Cause:** iOS opens links in the default browser, not in the PWA's Safari context.
**Fix:** Use OTP code entry instead of clickable links (what we did).

### "Chat shows 'something went wrong'"
**Check:** Is `ANTHROPIC_API_KEY` set? Check the server logs (terminal where `npm run dev` runs).
**Common causes:**
- Invalid or expired API key
- Rate limit hit (429 error)
- Network issue

### "Pantry doesn't update after chat"
**Check:** Is `mutate("/api/pantry")` being called in the `tool_result` handler in `useChat.ts`?
**Debug:** In DevTools → Network tab, look for a new GET request to `/api/pantry` after the tool executes.

### "TypeScript errors during build"
**Command:** `npm run build` shows all errors. Fix them one by one.
**Common fixes:**
- Add proper types to function parameters
- Handle `null`/`undefined` cases
- Import missing types

### How to read error messages
```
Error: @supabase/ssr: Your project's URL and API key are required
```
→ Missing env vars. Check `.env.local`.

```
TypeError: Cannot read properties of null (reading 'id')
```
→ Something is `null` when you expected an object. Add a null check.

```
Module not found: Can't resolve '@/lib/something'
```
→ File doesn't exist at that path. Check spelling and directory structure.

---

## 9. Current Limitations

### Performance
- **No message virtualization:** All chat messages render in the DOM. With hundreds of messages, scrolling will lag. Solution: use a virtualized list library like `react-window` or `@tanstack/virtual`.
- **No conversation summarization:** We send the last 20 messages to Claude every time. Older context is lost. Solution: periodically summarize older messages into a system prompt prefix.
- **Full page re-renders:** When a new chat token arrives, React updates state and re-renders the message list. Solution: use `React.memo` on `ChatMessage` components, or use refs for the streaming text.
- **No image optimization:** PWA icons are raw PNGs. Solution: use Next.js `<Image>` component and proper icon generation tools.

### UX
- **No offline support:** The service worker isn't configured yet (`serwist` is in the plan but not wired up). The app requires internet.
- **No pull-to-refresh:** Standard mobile UX pattern that's missing.
- **No haptic feedback:** No vibration on actions (iOS PWAs have limited support anyway).
- **Chat input can be hidden by keyboard:** On some iOS versions, the keyboard can obscure the input. The `interactive-widget=resizes-content` meta tag helps but isn't universal.
- **Swipe-to-delete is basic:** Uses raw touch events. A library like `react-swipeable` would be smoother.
- **No animations/transitions:** Page transitions and sheet animations are abrupt.

### Design
- **Minimal visual design:** The UI is functional but plain. No custom fonts, illustrations, or micro-interactions.
- **Placeholder icons:** The PWA icons are solid green squares.
- **No onboarding flow:** New users land on an empty chat with no guidance.
- **Category colors are subtle:** The pantry category chips could be more visually distinct.

### Architecture
- **No error retry in chat:** If the stream fails mid-response, the message is lost. Should auto-retry or let the user retry.
- **Single conversation:** There's no way to start a new conversation or browse history. One continuous thread.
- **No rate limiting on API routes:** Someone could spam `/api/chat` and run up your Anthropic bill.
- **Conversation stored as one big JSON blob:** The `messages` column in `conversation_history` grows unbounded. Should paginate or split by session.
- **No real-time sync:** If you have the app open on two devices, changes on one don't appear on the other until refresh. Supabase Realtime could fix this.

### Security
- **No input sanitization on tool executor:** Claude's tool outputs are treated as trusted. Should validate with Zod schemas.
- **No API rate limiting:** The Anthropic API key could be abused if someone discovers the endpoint.
- **Admin client bypass:** The tool executor uses the service role key which bypasses RLS. It manually scopes queries to `user_id`, but a bug could expose data.

---

## 10. Ways to Improve

### Design & Aesthetics (High Impact)
1. **Custom font:** Add Inter or a similar clean sans-serif via `next/font`
2. **Smooth animations:** Add `framer-motion` for page transitions, sheet slide-ups, and message appear animations
3. **Better color palette:** Create a cohesive design system with primary, secondary, surface colors
4. **Custom app icon:** Replace the green square with a proper designed icon
5. **Skeleton loaders:** Show content-shaped placeholders while data loads (instead of a spinner)
6. **Message animations:** New messages should fade/slide in, not just appear

### Scrolling & Performance (High Impact)
1. **Virtualize the message list:** Only render messages visible on screen
   ```bash
   npm install @tanstack/react-virtual
   ```
2. **Memoize ChatMessage components:** Prevent re-renders of old messages when new tokens arrive
3. **Debounce the streaming text updates:** Instead of updating state on every token, batch them (e.g., every 50ms)
4. **Lazy load the pantry page:** Don't fetch pantry data until the user navigates to that tab

### Loading Speed
1. **Preload critical data:** Use Next.js `loading.tsx` with Suspense boundaries
2. **Optimize bundle size:** Analyze with `npm run build` — check if `react-markdown` is too heavy (consider `marked` as a lighter alternative)
3. **Add a service worker:** Cache static assets for instant repeat loads
4. **Use Edge Runtime:** Move the chat API route to Edge Runtime for lower latency:
   ```typescript
   export const runtime = "edge";
   ```

### Features (Phase 2)
1. **Recipes page:** Save recipes suggested by Claude, browse history
2. **Cooking log:** Record what you cooked, auto-deduct ingredients
3. **Multiple conversations:** Start new chats, browse old ones
4. **Conversation summarization:** Summarize old messages to maintain context without token bloat
5. **Real-time sync:** Use Supabase Realtime subscriptions so changes appear across devices
6. **Push notifications:** "Your chicken breast expires tomorrow!" (requires web push setup)
7. **Barcode scanning:** Use the camera to scan grocery barcodes and auto-add items
8. **Grocery list generation:** Ask Claude "What do I need to buy for tacos?" → generates a shopping list

### Code Quality
1. **Add tests:** Use Vitest for unit tests, Playwright for end-to-end tests
2. **Add error tracking:** Integrate Sentry for production error monitoring
3. **Add API rate limiting:** Use Vercel's built-in rate limiting or `upstash/ratelimit`
4. **Generate Supabase types:** Use `supabase gen types` to auto-generate TypeScript types from your database schema
5. **Add CI/CD:** Set up GitHub Actions to run lint + type check + tests on every PR

---

## 11. Commands Reference

### Development
```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Build for production (catches TypeScript errors)
npm run start        # Run the production build locally
npm run lint         # Run ESLint to check code quality
```

### Git Workflow
```bash
git status           # See what files changed
git add <file>       # Stage a file for commit
git commit -m "msg"  # Create a commit
git push origin main # Push to GitHub (triggers Vercel deploy)
git log --oneline    # See commit history
```

### Dependencies
```bash
npm install <pkg>      # Add a production dependency
npm install -D <pkg>   # Add a dev dependency
npm uninstall <pkg>    # Remove a dependency
```

### Database
```bash
# Seed sample data (after signing up a user):
npx tsx scripts/seed.ts your-email@example.com
```

### Deployment
```bash
# Vercel auto-deploys when you push to main
# To deploy manually:
npx vercel            # Deploy to preview
npx vercel --prod     # Deploy to production
```

### Debugging
```bash
# Check if the build passes (catches most errors):
npm run build

# Check TypeScript errors without building:
npx tsc --noEmit

# See what's in your .env.local:
cat .env.local

# Test an API endpoint:
curl http://localhost:3000/api/pantry

# Check Vercel deployment logs:
# Go to vercel.com → your project → Deployments → click latest → Logs
```

---

## Summary

The mental model for building a full-stack app like this:

1. **Start with the data model** — what are you storing? (pantry items, conversations)
2. **Set up auth** — who can access what? (Supabase + RLS)
3. **Build CRUD** — can you create, read, update, delete? (API routes + hooks)
4. **Add the special sauce** — what makes your app unique? (Claude integration)
5. **Polish** — make it feel good (animations, loading states, error handling)
6. **Deploy** — get it in front of users (Vercel + GitHub)

Every feature follows the same pattern: **database schema → API route → React hook → UI component**. Once you understand that pattern, you can build anything.
