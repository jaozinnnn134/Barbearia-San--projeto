-- =============================================================================
-- Barbearia San Thiago — Infraestrutura PostgreSQL (Supabase)
-- Execute este script completo no SQL Editor do Supabase
-- =============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM (
    'Agendado',
    'Confirmado',
    'Em atendimento',
    'Finalizado',
    'Cancelado',
    'Não compareceu'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'confirmation',
    'reminder_30min',
    'cancellation',
    'reschedule'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_log_action AS ENUM (
    'admin_login',
    'admin_logout',
    'customer_created',
    'customer_deleted',
    'appointment_created',
    'appointment_updated',
    'appointment_cancelled',
    'appointment_rescheduled',
    'appointment_status_changed',
    'service_created',
    'service_updated',
    'service_deleted',
    'settings_updated',
    'schedule_blocked',
    'schedule_unblocked',
    'setup_completed',
    'export_generated'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_role AS ENUM (
    'admin',
    'professional'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- FUNÇÕES UTILITÁRIAS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_whatsapp(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits TEXT;
BEGIN
  digits := regexp_replace(phone, '\D', '', 'g');
  IF length(digits) = 11 THEN
    RETURN '55' || digits;
  ELSIF length(digits) = 13 AND left(digits, 2) = '55' THEN
    RETURN digits;
  ELSIF length(digits) = 12 AND left(digits, 2) = '55' THEN
    RETURN digits;
  ELSE
    RETURN digits;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_appointment_protocol()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
  new_protocol TEXT;
  attempt INT := 0;
BEGIN
  year_part := to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY');
  LOOP
    attempt := attempt + 1;
    seq_part := lpad(floor(random() * 10000)::TEXT, 4, '0');
    new_protocol := 'ST-' || year_part || '-' || seq_part;
    IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE protocol = new_protocol) THEN
      RETURN new_protocol;
    END IF;
    IF attempt > 50 THEN
      RAISE EXCEPTION 'Não foi possível gerar protocolo único após 50 tentativas';
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- TABELAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  whatsapp TEXT,
  role public.profile_role NOT NULL DEFAULT 'professional',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  duration INTEGER NOT NULL CHECK (duration > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_whatsapp_unique UNIQUE (whatsapp)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status public.appointment_status NOT NULL DEFAULT 'Agendado',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_duration INTEGER NOT NULL CHECK (total_duration > 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointments_time_valid CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.appointment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  price_at_booking NUMERIC(10, 2) NOT NULL CHECK (price_at_booking >= 0),
  duration_at_booking INTEGER NOT NULL CHECK (duration_at_booking > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id, service_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  status public.notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason TEXT,
  date_override DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT schedules_time_valid CHECK (
    (start_time IS NULL AND end_time IS NULL)
    OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  CONSTRAINT schedules_day_or_date CHECK (
    (day_of_week IS NOT NULL AND date_override IS NULL)
    OR (day_of_week IS NULL AND date_override IS NOT NULL)
    OR (day_of_week IS NULL AND date_override IS NULL AND is_blocked = TRUE)
  )
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action public.activity_log_action NOT NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_primary ON public.profiles(is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services(sort_order);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON public.customers(whatsapp);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON public.customers(last_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_protocol ON public.appointments(protocol);
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment ON public.appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON public.notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_schedules_profile ON public.schedules(profile_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date_override ON public.schedules(date_override);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON public.schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- =============================================================================
-- CONSTRAINT DE EXCLUSÃO MÚTUA (ANTI-OVERBOOKING)
-- Impede sobreposição temporal para o mesmo profissional em agendamentos ativos
-- =============================================================================

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_overlap;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status NOT IN ('Cancelado', 'Não compareceu'));

-- =============================================================================
-- TRIGGERS — updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_schedules_updated_at ON public.schedules;
CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TRIGGER — Normalização de WhatsApp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.normalize_customer_whatsapp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.whatsapp := public.normalize_whatsapp(NEW.whatsapp);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_normalize_whatsapp ON public.customers;
CREATE TRIGGER trg_customers_normalize_whatsapp
  BEFORE INSERT OR UPDATE OF whatsapp ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_customer_whatsapp();

-- =============================================================================
-- TRIGGER — Atualização de estatísticas do cliente ao finalizar atendimento
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_customer_stats_on_finalize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Finalizado' AND (OLD.status IS DISTINCT FROM 'Finalizado') THEN
    UPDATE public.customers
    SET
      total_visits = total_visits + 1,
      total_spent = total_spent + NEW.total_price,
      last_visit_at = NEW.end_time,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_update_customer_stats ON public.appointments;
CREATE TRIGGER trg_appointments_update_customer_stats
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats_on_finalize();

-- =============================================================================
-- TRIGGER — Auto-criação de perfil ao registrar usuário auth
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Administrador'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.profile_role, 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — LGPD
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_public_primary" ON public.profiles;
CREATE POLICY "profiles_select_public_primary"
  ON public.profiles FOR SELECT
  USING (is_primary = TRUE);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR id = auth.uid())
  WITH CHECK (public.is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- SERVICES — leitura pública de serviços ativos (fluxo de agendamento)
DROP POLICY IF EXISTS "services_select_active" ON public.services;
CREATE POLICY "services_select_active"
  ON public.services FOR SELECT
  USING (active = TRUE);

DROP POLICY IF EXISTS "services_admin_all" ON public.services;
CREATE POLICY "services_admin_all"
  ON public.services FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CUSTOMERS — dados sensíveis protegidos; mutações via Server Actions (service role)
DROP POLICY IF EXISTS "customers_admin_select" ON public.customers;
CREATE POLICY "customers_admin_select"
  ON public.customers FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "customers_admin_update" ON public.customers;
CREATE POLICY "customers_admin_update"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "customers_admin_delete" ON public.customers;
CREATE POLICY "customers_admin_delete"
  ON public.customers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- SETTINGS — leitura pública apenas de chaves operacionais do agendamento
DROP POLICY IF EXISTS "settings_select_public_booking" ON public.settings;
CREATE POLICY "settings_select_public_booking"
  ON public.settings FOR SELECT
  USING (key IN ('business_hours', 'holidays'));

DROP POLICY IF EXISTS "settings_admin_all" ON public.settings;
CREATE POLICY "settings_admin_all"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APPOINTMENTS — protegidos; criação via Server Actions com service role
DROP POLICY IF EXISTS "appointments_admin_select" ON public.appointments;
CREATE POLICY "appointments_admin_select"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "appointments_admin_update" ON public.appointments;
CREATE POLICY "appointments_admin_update"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "appointments_admin_delete" ON public.appointments;
CREATE POLICY "appointments_admin_delete"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- APPOINTMENT_SERVICES
DROP POLICY IF EXISTS "appointment_services_admin_select" ON public.appointment_services;
CREATE POLICY "appointment_services_admin_select"
  ON public.appointment_services FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "appointment_services_admin_all" ON public.appointment_services;
CREATE POLICY "appointment_services_admin_all"
  ON public.appointment_services FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTIFICATIONS — somente admin
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications;
CREATE POLICY "notifications_admin_all"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SCHEDULES — leitura pública para cálculo de slots
DROP POLICY IF EXISTS "schedules_select_public" ON public.schedules;
CREATE POLICY "schedules_select_public"
  ON public.schedules FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "schedules_admin_all" ON public.schedules;
CREATE POLICY "schedules_admin_all"
  ON public.schedules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ACTIVITY_LOGS — somente admin
DROP POLICY IF EXISTS "activity_logs_admin_select" ON public.activity_logs;
CREATE POLICY "activity_logs_admin_select"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "activity_logs_admin_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_admin_insert"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- =============================================================================
-- REALTIME — Habilitar para tabelas administrativas
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;

-- =============================================================================
-- SEED — Configurações operacionais
-- =============================================================================

INSERT INTO public.settings (key, value, description)
VALUES
  (
    'business_hours',
    '{
      "timezone": "America/Sao_Paulo",
      "regular": {
        "tuesday_to_saturday": { "start": "09:00", "end": "19:00" },
        "sunday_and_holidays": { "start": "09:00", "end": "12:00" },
        "monday": { "closed": true }
      },
      "slot_interval_minutes": 10
    }'::JSONB,
    'Horários de expediente da barbearia'
  ),
  (
    'holidays',
    '{"dates": []}'::JSONB,
    'Feriados com expediente reduzido (09:00-12:00)'
  ),
  (
    'setup',
    '{"completed": false, "completed_at": null, "completed_by": null}'::JSONB,
    'Flag de setup inicial — bloqueia /setup após conclusão'
  ),
  (
    'notification_whatsapp_enabled',
    'false'::JSONB,
    'Habilita envio de notificações WhatsApp'
  )
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =============================================================================
-- SEED — Serviços reais da Barbearia San Thiago
-- =============================================================================

INSERT INTO public.services (name, duration, price, active, sort_order)
VALUES
  ('Alisamento', 30, 50.00, TRUE, 1),
  ('Barba', 30, 25.00, TRUE, 2),
  ('Bigode', 10, 5.00, TRUE, 3),
  ('Cavanhaque', 10, 10.00, TRUE, 4),
  ('Corte', 30, 35.00, TRUE, 5),
  ('Corte Barba e Sobrancelha', 60, 75.00, TRUE, 6),
  ('Corte e Barba', 60, 60.00, TRUE, 7),
  ('Corte e Sobrancelha', 45, 50.00, TRUE, 8),
  ('Corte Infantil', 30, 35.00, TRUE, 9),
  ('Corte na Tesoura', 60, 45.00, TRUE, 10),
  ('Pezinho', 10, 10.00, TRUE, 11),
  ('Pigmentação Barba', 30, 25.00, TRUE, 12),
  ('Pigmentação Cabelo', 30, 25.00, TRUE, 13),
  ('Sobrancelha', 10, 15.00, TRUE, 14)
ON CONFLICT (name) DO UPDATE
SET
  duration = EXCLUDED.duration,
  price = EXCLUDED.price,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =============================================================================
-- SEED — Bloqueio padrão de segunda-feira (será vinculado ao perfil no /setup)
-- Nota: schedules exige profile_id; será populado na Etapa de Setup
-- =============================================================================

-- =============================================================================
-- GRANTS — Permissões para roles Supabase
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT SELECT ON public.schedules TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.appointment_services TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.schedules TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
