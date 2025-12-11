-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Users can upload files to their organization folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their organization" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to org folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view org files" ON storage.objects;

-- Create organization-scoped storage policies
-- Files are stored in: {organization_id}/{user_id}/{filename}

-- INSERT: Users can only upload to their organization's folder
CREATE POLICY "Users can upload to their organization folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  );

-- SELECT: Users can only view files in their organization's folder
-- Super admins can view all files
CREATE POLICY "Users can view files in their organization"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads' AND
    (
      (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
      OR is_super_admin(auth.uid())
    )
  );

-- DELETE: Admins can only delete files in their organization
-- Super admins can delete any file
CREATE POLICY "Admins can delete organization files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads' AND
    is_admin(auth.uid()) AND
    (
      (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
      OR is_super_admin(auth.uid())
    )
  );

-- UPDATE: Admins can update files in their organization
CREATE POLICY "Admins can update organization files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads' AND
    is_admin(auth.uid()) AND
    (
      (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
      OR is_super_admin(auth.uid())
    )
  );