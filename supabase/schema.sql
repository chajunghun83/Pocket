-- Pocket 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- https://supabase.com/dashboard/project/gzxbckioutctwxbevqmk/sql/new

-- ==========================================
-- 1. 가계부 테이블 (transactions)
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'fixed', 'variable')),
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 0) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ==========================================
-- 2. 자산 관리 테이블 (assets)
-- ==========================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount DECIMAL(15, 0) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_date ON assets(date);

-- ==========================================
-- 3. 부채 관리 테이블 (debts)
-- ==========================================
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('borrow', 'repay')),
  amount DECIMAL(15, 0) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date);

-- ==========================================
-- 4. 주식 보유 테이블 (stocks)
-- ==========================================
CREATE TABLE IF NOT EXISTS stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  market VARCHAR(10) NOT NULL CHECK (market IN ('KR', 'US')),
  broker VARCHAR(20) NOT NULL CHECK (broker IN ('namu', 'toss', 'isa')),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  avg_price DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL CHECK (currency IN ('KRW', 'USD')),
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_market ON stocks(market);
CREATE INDEX IF NOT EXISTS idx_stocks_broker ON stocks(broker);

-- ==========================================
-- 5. 사용자 설정 테이블 (settings)
-- ==========================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) DEFAULT 'dark',
  default_currency VARCHAR(10) DEFAULT 'all',
  use_budget_goal BOOLEAN DEFAULT TRUE,
  budget_goal DECIMAL(15, 0) DEFAULT 5000000,
  auto_refresh_interval INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- ==========================================
-- Row Level Security (RLS) 정책
-- ==========================================

-- RLS 활성화
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 모든 접근 허용 정책 (개인 사용 앱이므로 간소화)
CREATE POLICY "Allow all access" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- updated_at 자동 갱신 트리거
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 완료 메시지
-- ==========================================
-- 테이블 생성 완료!
-- 이제 앱에서 Supabase 연동을 사용할 수 있습니다.






