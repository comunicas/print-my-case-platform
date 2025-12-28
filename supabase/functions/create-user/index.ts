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

    // Create client with user's token to verify they are super_admin
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

    // Check if calling user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !roleData) {
      console.error('User is not super_admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Apenas super_admin pode criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { 
      name, 
      email, 
      password, 
      createNewOrganization = true,
      organizationId,
      organizationName,
      role = 'org_admin'
    } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['org_admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Role inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If linking to existing organization, verify it exists
    let targetOrganizationId = organizationId;
    let targetOrganization = null;

    if (!createNewOrganization) {
      if (!organizationId) {
        return new Response(
          JSON.stringify({ error: 'organizationId é obrigatório quando createNewOrganization é false' }),
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

    console.log(`Creating user: ${email}, role: ${role}, createNewOrg: ${createNewOrganization}`);

    // Create the new user
    const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUser = newUserData.user;
    console.log(`User created with ID: ${newUser.id}`);

    // Create organization only if requested
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
        // Cleanup: delete the user if org creation fails
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

    // Update profile with organization_id (profile should be created by trigger)
    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

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

    console.log(`User ${email} setup complete with role ${role}`);

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
