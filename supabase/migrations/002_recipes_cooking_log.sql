-- ============================================================
-- ENUMs
-- ============================================================
CREATE TYPE recipe_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE recipe_source AS ENUM ('ai_generated', 'manual', 'external_url');

-- ============================================================
-- TABLE: recipes
-- ============================================================
CREATE TABLE recipes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  ingredients   JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions  TEXT NOT NULL,
  cuisine_type  TEXT,
  difficulty    recipe_difficulty,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source        recipe_source NOT NULL DEFAULT 'ai_generated'
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_cuisine ON recipes(user_id, cuisine_type)
  WHERE cuisine_type IS NOT NULL;
CREATE INDEX idx_recipes_created ON recipes(user_id, created_at DESC);

CREATE TRIGGER set_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: cooking_logs
-- ============================================================
CREATE TABLE cooking_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id   UUID REFERENCES recipes(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  notes       TEXT,
  cooked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cooking_logs_user_id ON cooking_logs(user_id);
CREATE INDEX idx_cooking_logs_cooked ON cooking_logs(user_id, cooked_at DESC);
CREATE INDEX idx_cooking_logs_recipe ON cooking_logs(recipe_id)
  WHERE recipe_id IS NOT NULL;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- Recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Cooking Logs
ALTER TABLE cooking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cooking logs"
  ON cooking_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cooking logs"
  ON cooking_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cooking logs"
  ON cooking_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cooking logs"
  ON cooking_logs FOR DELETE USING (auth.uid() = user_id);
