-- Fix: organizations.owner_id FK blocks user deletion from auth.users
ALTER TABLE public.organizations
  DROP CONSTRAINT organizations_owner_id_fkey,
  ADD CONSTRAINT organizations_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id)
    ON DELETE SET NULL;