# Pantry + Cooking Assistant PWA

## Overview
Build a mobile-first Progressive Web App for managing a home pantry
and planning cooking through a conversational AI interface. The app
should be installable on iPhone and feel native.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (Postgres + Auth + Realtime)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514) with tool use
- **Hosting**: Vercel-ready (but local dev first)
- **PWA**: next-pwa for service worker, manifest.json, offline support

## Core Data Models

### PantryItem
- id, user_id, name, category (produce/dairy/protein/pantry/spice/other),
  quantity (float), unit (string), added_at, updated_at, expiration_date (optional)

### Recipe
- id, user_id, title, description, ingredients (jsonb array referencing
  pantry categories), instructions (text), cuisine_type, difficulty,
  created_at, source (ai_generated | manual | external_url)

### CookingLog
- id, user_id, recipe_id (nullable), title, notes, photos (array of URLs),
  cooked_at, rating (1-5, optional)

### ConversationHistory
- id, user_id, messages (jsonb array), created_at, summary (text, optional)

## Claude Tool Use Integration
The chat interface should use Claude with the following tools:

1. **update_pantry** - Add, remove, or modify pantry items. Claude should
   parse natural language like "I bought 2 lbs of butter and a dozen eggs"
   into structured updates. Return confirmation of changes.

2. **query_pantry** - Search/filter current pantry. Supports queries like
   "what proteins do I have?" or "anything expiring this week?"

3. **suggest_recipe** - Given pantry contents + optional constraints
   (cuisine, difficulty, time), suggest recipes using available ingredients.
   Flag any missing ingredients.

4. **log_cooking** - Record that the user cooked something. Auto-deduct
   used ingredients from pantry.

5. **search_recipes** - Search the user's saved recipes and cooking history.

## Pages / Views

1. **Chat** (default/home) - Full-screen conversational interface with Claude.
   Quick-action buttons above input: "What can I cook?", "Update pantry",
   "Log a meal". Message input should be sticky at bottom. This is the
   PRIMARY interface — everything else is secondary.

2. **Pantry** - Visual grid/list of current pantry items grouped by category.
   Swipe to delete, tap to edit quantity. Search/filter bar at top.

3. **Recipes** - Saved recipes and cooking log as a feed. Filter by cuisine,
   date, rating. Tap to expand full recipe.

4. **Settings** - Dietary preferences, cuisine interests, cooking skill level,
   Supabase auth (magic link).

## Mobile-First UX Requirements
- Bottom tab navigation (Chat, Pantry, Recipes, Settings)
- All touch targets >= 44px
- Swipe gestures for common actions (delete pantry item, archive recipe)
- Pull-to-refresh on list views
- Haptic-style visual feedback on actions
- Dark mode support via Tailwind
- manifest.json with proper icons for iOS home screen install
- Splash screen configuration for iOS standalone mode
- viewport meta tag for safe areas (notch handling)

## Auth
- Supabase Auth with magic link (email) — no passwords
- Row-level security on all tables scoped to user_id
- Store Supabase session in httpOnly cookie for SSR

## API Routes
- POST /api/chat — accepts messages array, streams Claude response with
  tool use. Executes tool calls against Supabase, returns results to Claude
  for final response.
- GET/POST/PATCH/DELETE /api/pantry — CRUD for pantry items
- GET/POST /api/recipes — CRUD for recipes
- GET/POST /api/cooking-log — CRUD for cooking log

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY

## Development Setup
- Include a seed script that populates sample pantry data
- Include Supabase migration SQL files in /supabase/migrations
- README with setup instructions

## Key Implementation Notes
- Stream Claude responses using the Anthropic SDK's streaming API
- When Claude calls a tool, execute it server-side, then send the tool
  result back to Claude for a natural language confirmation
- Pantry updates from chat should optimistically update the UI
- Conversation history: keep last 20 messages in context, summarize
  older ones into a system prompt prefix
- Use Supabase Realtime to sync pantry changes across tabs/devices