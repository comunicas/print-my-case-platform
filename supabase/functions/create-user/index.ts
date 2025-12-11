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
    const { name, email, password, organizationName } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating user: ${email} for organization: ${organizationName || name}`);

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

    // Create organization for the new user
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

    console.log(`Organization created with ID: ${orgData.id}`);

    // Update profile with organization_id (profile should be created by trigger)
    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        organization_id: orgData.id,
        name: name 
      })
      .eq('id', newUser.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Update user role to org_admin (trigger creates viewer by default)
    const { error: roleUpdateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: 'org_admin' })
      .eq('user_id', newUser.id);

    if (roleUpdateError) {
      console.error('Error updating role:', roleUpdateError);
    }

    console.log(`User ${email} setup complete`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: name,
          organization: orgData
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
