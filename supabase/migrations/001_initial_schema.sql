-- ============================================================
-- Enable required extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM: pantry item categories
-- ============================================================
CREATE TYPE pantry_category AS ENUM (
  'produce',
  'dairy',
  'protein',
  'pantry',
  'spice',
  'other'
);

-- ============================================================
-- TABLE: pantry_items
-- ============================================================
CREATE TABLE pantry_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        pantry_category NOT NULL DEFAULT 'other',
  quantity        DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  unit            TEXT NOT NULL DEFAULT 'unit',
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date DATE
);

-- Prevent duplicate items (same name + category) per user
CREATE UNIQUE INDEX idx_unique_user_item
  ON pantry_items (user_id, LOWER(name), category);

-- Fast lookups
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_category ON pantry_items(user_id, category);
CREATE INDEX idx_pantry_items_expiration ON pantry_items(user_id, expiration_date)
  WHERE expiration_date IS NOT NULL;

-- ============================================================
-- TABLE: conversation_history
-- ============================================================
CREATE TABLE conversation_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary     TEXT
);

CREATE INDEX idx_conversation_history_user_id
  ON conversation_history(user_id);
CREATE INDEX idx_conversation_history_updated
  ON conversation_history(user_id, updated_at DESC);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_conversation_history_updated_at
  BEFORE UPDATE ON conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- Pantry Items
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pantry items"
  ON pantry_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pantry items"
  ON pantry_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items"
  ON pantry_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items"
  ON pantry_items FOR DELETE
  USING (auth.uid() = user_id);

-- Conversation History
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON conversation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversation_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversation_history FOR DELETE
  USING (auth.uid() = user_id);
