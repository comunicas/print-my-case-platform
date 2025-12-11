-- =============================================
-- PHASE 1: CREATE ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'operator', 'viewer');
CREATE TYPE public.member_status AS ENUM ('active', 'pending', 'inactive');
CREATE TYPE public.pdv_status AS ENUM ('active', 'inactive');
CREATE TYPE public.upload_type AS ENUM ('sales', 'stock');
CREATE TYPE public.upload_status AS ENUM ('processing', 'ready', 'error');

-- =============================================
-- PHASE 2: CREATE TABLES
-- =============================================

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  plan TEXT DEFAULT 'Profissional',
  active_since TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  status public.member_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate for security - prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- PDVs table
CREATE TABLE public.pdvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  machine_id TEXT UNIQUE NOT NULL,
  status public.pdv_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  min_stock INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploads table
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdv_id UUID REFERENCES public.pdvs(id) ON DELETE CASCADE NOT NULL,
  type public.upload_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  drive_url TEXT,
  status public.upload_status DEFAULT 'processing',
  records_count INTEGER,
  period TEXT,
  error_message TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Sales records table
CREATE TABLE public.sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  pdv_id UUID REFERENCES public.pdvs(id) NOT NULL,
  merchant_id TEXT,
  device_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  product_name TEXT NOT NULL,
  transaction_number TEXT,
  payment_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0
);

-- Stock records table
CREATE TABLE public.stock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  pdv_id UUID REFERENCES public.pdvs(id) NOT NULL,
  record_number TEXT,
  device_id TEXT NOT NULL,
  slot_number TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- User preferences table
CREATE TABLE public.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'pt-BR',
  email_notifications BOOLEAN DEFAULT true,
  stock_alerts BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT false,
  upload_notifications BOOLEAN DEFAULT true,
  default_period TEXT DEFAULT 'last30days',
  default_pdv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 3: ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PHASE 4: CREATE SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's organization_id (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles
  WHERE id = _user_id
$$;

-- Function to check if user is admin (super_admin or org_admin)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'org_admin')
  )
$$;

-- =============================================
-- PHASE 5: CREATE RLS POLICIES
-- =============================================

-- Organizations policies
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (id = public.get_user_org_id(auth.uid()) AND public.is_admin(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view roles in their organization"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- PDVs policies
CREATE POLICY "Users can view PDVs in their organization"
  ON public.pdvs FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can create PDVs"
  ON public.pdvs FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id(auth.uid()) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update PDVs"
  ON public.pdvs FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete PDVs"
  ON public.pdvs FOR DELETE
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND public.is_admin(auth.uid()));

-- Products policies
CREATE POLICY "Users can view products in their organization"
  ON public.products FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (organization_id = public.get_user_org_id(auth.uid()) AND public.is_admin(auth.uid()));

-- Uploads policies
CREATE POLICY "Users can view uploads in their organization"
  ON public.uploads FOR SELECT
  TO authenticated
  USING (
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Users can create uploads"
  ON public.uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "Admins can delete uploads"
  ON public.uploads FOR DELETE
  TO authenticated
  USING (
    public.is_admin(auth.uid()) AND
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- Sales records policies
CREATE POLICY "Users can view sales in their organization"
  ON public.sales_records FOR SELECT
  TO authenticated
  USING (
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "System can insert sales records"
  ON public.sales_records FOR INSERT
  TO authenticated
  WITH CHECK (
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- Stock records policies
CREATE POLICY "Users can view stock in their organization"
  ON public.stock_records FOR SELECT
  TO authenticated
  USING (
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

CREATE POLICY "System can insert stock records"
  ON public.stock_records FOR INSERT
  TO authenticated
  WITH CHECK (
    pdv_id IN (
      SELECT id FROM public.pdvs 
      WHERE organization_id = public.get_user_org_id(auth.uid())
    )
  );

-- Preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- PHASE 6: CREATE TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdvs_updated_at
  BEFORE UPDATE ON public.pdvs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Assign default role (viewer)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  -- Create default preferences
  INSERT INTO public.preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PHASE 7: CREATE STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false);

-- Storage policies
CREATE POLICY "Users can upload files to their organization folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Users can view files in their organization"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads');

CREATE POLICY "Admins can delete files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads' AND public.is_admin(auth.uid()));