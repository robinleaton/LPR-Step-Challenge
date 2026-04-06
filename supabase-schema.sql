-- ============================================
-- LPR STEP CHALLENGE - SUPABASE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  date_of_birth DATE,
  country TEXT DEFAULT 'NZ',
  avatar_stage INTEGER DEFAULT 1,
  total_steps BIGINT DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_subscribed BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'trial', -- trial, active, cancelled, expired
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  push_subscription JSONB,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP LOGS TABLE
-- ============================================
CREATE TABLE step_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  steps INTEGER NOT NULL,
  date DATE NOT NULL,
  source TEXT DEFAULT 'manual', -- apple_health, google_fit, manual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- CHALLENGES TABLE
-- ============================================
CREATE TABLE challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  prize_pool JSONB, -- [{ place: 1, amount: 500, description: "Cash prize" }]
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  sponsor_link TEXT,
  gender_filter TEXT, -- 'male', 'female', 'all'
  min_age INTEGER,
  max_age INTEGER,
  country_filter TEXT DEFAULT 'NZ',
  is_active BOOLEAN DEFAULT TRUE,
  paid_only BOOLEAN DEFAULT TRUE, -- only paid subscribers eligible for prizes
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHALLENGE ENTRIES TABLE
-- ============================================
CREATE TABLE challenge_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_steps BIGINT DEFAULT 0,
  is_eligible BOOLEAN DEFAULT FALSE, -- paid + meets age/gender criteria
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- SPONSORS TABLE
-- ============================================
CREATE TABLE sponsors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  link TEXT,
  tagline TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general', -- reminder, achievement, leaderboard, challenge
  is_read BOOLEAN DEFAULT FALSE,
  sent_email BOOLEAN DEFAULT FALSE,
  sent_push BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD VIEW (real-time)
-- ============================================
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  p.id,
  p.full_name,
  p.gender,
  p.date_of_birth,
  p.country,
  p.avatar_stage,
  p.total_steps,
  p.is_subscribed,
  p.subscription_status,
  EXTRACT(YEAR FROM AGE(p.date_of_birth)) AS age,
  RANK() OVER (ORDER BY p.total_steps DESC) AS overall_rank
FROM profiles p
WHERE p.total_steps > 0
ORDER BY p.total_steps DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update avatar stage based on total steps
CREATE OR REPLACE FUNCTION update_avatar_stage()
RETURNS TRIGGER AS $$
BEGIN
  NEW.avatar_stage := CASE
    WHEN NEW.total_steps >= 1200000 THEN 5
    WHEN NEW.total_steps >= 750000  THEN 4
    WHEN NEW.total_steps >= 350000  THEN 3
    WHEN NEW.total_steps >= 50000   THEN 2
    ELSE 1
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update avatar stage
CREATE TRIGGER trigger_update_avatar_stage
  BEFORE UPDATE OF total_steps ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_stage();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update total steps when step_log is inserted/updated
CREATE OR REPLACE FUNCTION update_total_steps()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_steps = (
    SELECT COALESCE(SUM(steps), 0)
    FROM step_logs
    WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_total_steps
  AFTER INSERT OR UPDATE ON step_logs
  FOR EACH ROW EXECUTE FUNCTION update_total_steps();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Step logs: users manage own
CREATE POLICY "Users can view own step logs" ON step_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own step logs" ON step_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own step logs" ON step_logs FOR UPDATE USING (auth.uid() = user_id);

-- Challenges: public read
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);
CREATE POLICY "Only admins can manage challenges" ON challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Challenge entries
CREATE POLICY "Users can view all entries" ON challenge_entries FOR SELECT USING (true);
CREATE POLICY "Users can manage own entries" ON challenge_entries FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Sponsors: public read, admin write
CREATE POLICY "Sponsors viewable by everyone" ON sponsors FOR SELECT USING (true);
CREATE POLICY "Only admins can manage sponsors" ON sponsors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE step_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- SET ROBIN AS ADMIN (run after first signup)
-- ============================================
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'robinleaton@leatonperformance.co.nz';
