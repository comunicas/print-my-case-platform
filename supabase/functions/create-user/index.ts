import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to identify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create client with user's token to verify their identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callingUser) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller's role
    const { data: callerRoleData, error: callerRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (callerRoleError || !callerRoleData) {
      console.error('Error getting caller role:', callerRoleError);
      return new Response(
        JSON.stringify({ error: 'Não foi possível verificar suas permissões' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerRole = callerRoleData.role;
    const isCallerSuperAdmin = callerRole === 'super_admin';
    const isCallerOrgAdmin = callerRole === 'org_admin';

    console.log(`Caller ${callingUser.email} has role: ${callerRole}`);

    // Only super_admin and org_admin can create users
    if (!isCallerSuperAdmin && !isCallerOrgAdmin) {
      console.error(`User ${callingUser.email} with role ${callerRole} tried to create user`);
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller's organization
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', callingUser.id)
      .single();

    if (callerProfileError) {
      console.error('Error getting caller profile:', callerProfileError);
    }

    const callerOrgId = callerProfile?.organization_id;

    // Parse request body
    let { 
      name, 
      email, 
      password, 
      createNewOrganization = false,
      organizationId,
      organizationName,
      role = 'operator'
    } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['super_admin', 'org_admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Role inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== PERMISSION VALIDATION BY CALLER ROLE ==========

    // org_admin restrictions
    if (isCallerOrgAdmin) {
      // org_admin cannot create new organizations
      if (createNewOrganization) {
        console.warn(`org_admin ${callingUser.email} tried to create new organization`);
        return new Response(
          JSON.stringify({ error: 'Você não tem permissão para criar novas organizações' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // org_admin must belong to an organization
      if (!callerOrgId) {
        console.error(`org_admin ${callingUser.email} has no organization`);
        return new Response(
          JSON.stringify({ error: 'Você precisa estar vinculado a uma organização para criar usuários' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // org_admin can only create users in their own organization
      if (organizationId && organizationId !== callerOrgId) {
        console.warn(`org_admin ${callingUser.email} tried to create user in different org: ${organizationId}. Forcing to ${callerOrgId}`);
      }
      // Force organization to caller's org
      organizationId = callerOrgId;
      createNewOrganization = false;

      // org_admin cannot create super_admin or org_admin
      if (role === 'super_admin' || role === 'org_admin') {
        console.warn(`org_admin ${callingUser.email} tried to create user with role: ${role}`);
        return new Response(
          JSON.stringify({ error: 'Você só pode criar usuários com permissão de operador ou visualizador' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // super_admin restrictions (minimal)
    if (isCallerSuperAdmin) {
      // Only super_admin can create another super_admin (already verified by being here)
      // super_admin can do everything else
    }

    // Role assignment validation for both
    if (role === 'super_admin' && !isCallerSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Apenas super_admin pode criar outro super_admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== END PERMISSION VALIDATION ==========

    // If linking to existing organization, verify it exists
    let targetOrganizationId = organizationId;
    let targetOrganization = null;

    if (!createNewOrganization) {
      if (!organizationId) {
        return new Response(
          JSON.stringify({ error: 'organizationId é obrigatório quando não está criando nova organização' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existingOrg, error: orgCheckError } = await supabaseAdmin
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single();

      if (orgCheckError || !existingOrg) {
        console.error('Organization not found:', orgCheckError);
        return new Response(
          JSON.stringify({ error: 'Organização não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetOrganization = existingOrg;
      console.log(`Linking user to existing organization: ${existingOrg.name} (${existingOrg.id})`);
    }

    console.log(`Creating user: ${email}, role: ${role}, createNewOrg: ${createNewOrganization}, targetOrg: ${targetOrganizationId}`);

    // Create the new user
    const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      
      let errorMessage = createUserError.message;
      if (createUserError.message.includes('already been registered')) {
        errorMessage = 'Este email já está cadastrado no sistema';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUser = newUserData.user;
    console.log(`User created with ID: ${newUser.id}`);

    // Create organization only if requested (only super_admin can do this)
    if (createNewOrganization) {
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: organizationName || name,
          owner_id: newUser.id
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.id);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar organização: ' + orgError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetOrganizationId = orgData.id;
      targetOrganization = orgData;
      console.log(`Organization created with ID: ${orgData.id}`);
    }

    // Wait for trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update profile with organization_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        organization_id: targetOrganizationId,
        name: name 
      })
      .eq('id', newUser.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Update user role (trigger creates viewer by default)
    const { error: roleUpdateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: role })
      .eq('user_id', newUser.id);

    if (roleUpdateError) {
      console.error('Error updating role:', roleUpdateError);
    }

    console.log(`User ${email} setup complete with role ${role} in org ${targetOrganizationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: name,
          role: role,
          organization: targetOrganization
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
