import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tipos de eventos de auditoria
type AuditEventType = 
  | 'user_creation_attempt'
  | 'user_creation_success'
  | 'user_creation_failed'
  | 'permission_violation'
  | 'organization_creation'
  | 'role_assignment';

// Interface para evento de auditoria
interface AuditEvent {
  event_type: AuditEventType;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  target_email?: string;
  target_role?: string;
  organization_id?: string;
  organization_name?: string;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// Função helper para registrar audit log
// deno-lint-ignore no-explicit-any
async function logAuditEvent(
  supabaseAdmin: any,
  event: AuditEvent
) {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        event_type: event.event_type,
        actor_id: event.actor_id || null,
        actor_email: event.actor_email || null,
        actor_role: event.actor_role || null,
        target_email: event.target_email || null,
        target_role: event.target_role || null,
        organization_id: event.organization_id || null,
        organization_name: event.organization_name || null,
        success: event.success,
        error_message: event.error_message || null,
        metadata: event.metadata || {},
        ip_address: event.ip_address || null,
        user_agent: event.user_agent || null,
      });
    
    if (error) {
      console.error('Error logging audit event:', error);
    } else {
      console.log(`Audit log recorded: ${event.event_type} - success: ${event.success}`);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Capturar contexto da requisição para auditoria
  const ipAddress = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Create Supabase client with service role for admin operations (needed for audit logs even on errors)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

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
      
      await logAuditEvent(supabaseAdmin, {
        event_type: 'permission_violation',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        success: false,
        error_message: 'Não foi possível verificar permissões do usuário',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { reason: 'role_not_found' }
      });
      
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
      
      await logAuditEvent(supabaseAdmin, {
        event_type: 'permission_violation',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        actor_role: callerRole,
        success: false,
        error_message: 'Usuário sem permissão tentou criar usuário',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { reason: 'insufficient_role', caller_role: callerRole }
      });
      
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

    // Log attempt
    await logAuditEvent(supabaseAdmin, {
      event_type: 'user_creation_attempt',
      actor_id: callingUser.id,
      actor_email: callingUser.email,
      actor_role: callerRole,
      target_email: email,
      target_role: role,
      organization_id: organizationId || callerOrgId,
      success: true,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { 
        createNewOrganization,
        organizationName,
        requested_organization_id: organizationId
      }
    });

    if (!name || !email || !password) {
      await logAuditEvent(supabaseAdmin, {
        event_type: 'user_creation_failed',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        actor_role: callerRole,
        target_email: email,
        success: false,
        error_message: 'Dados obrigatórios não fornecidos',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { missing_fields: { name: !name, email: !email, password: !password } }
      });
      
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['super_admin', 'org_admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      await logAuditEvent(supabaseAdmin, {
        event_type: 'user_creation_failed',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        actor_role: callerRole,
        target_email: email,
        target_role: role,
        success: false,
        error_message: 'Role inválido',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { invalid_role: role }
      });
      
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
        
        await logAuditEvent(supabaseAdmin, {
          event_type: 'permission_violation',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          success: false,
          error_message: 'org_admin tentou criar nova organização',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { 
            violation_type: 'create_org_denied',
            attempted_org_name: organizationName
          }
        });
        
        return new Response(
          JSON.stringify({ error: 'Você não tem permissão para criar novas organizações' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // org_admin must belong to an organization
      if (!callerOrgId) {
        console.error(`org_admin ${callingUser.email} has no organization`);
        
        await logAuditEvent(supabaseAdmin, {
          event_type: 'permission_violation',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          success: false,
          error_message: 'org_admin sem organização tentou criar usuário',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { violation_type: 'no_org_assigned' }
        });
        
        return new Response(
          JSON.stringify({ error: 'Você precisa estar vinculado a uma organização para criar usuários' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // org_admin can only create users in their own organization
      if (organizationId && organizationId !== callerOrgId) {
        console.warn(`org_admin ${callingUser.email} tried to create user in different org: ${organizationId}. Forcing to ${callerOrgId}`);
        
        await logAuditEvent(supabaseAdmin, {
          event_type: 'permission_violation',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          organization_id: callerOrgId,
          success: false,
          error_message: 'org_admin tentou criar usuário em outra organização',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { 
            violation_type: 'wrong_org',
            attempted_org_id: organizationId,
            forced_org_id: callerOrgId
          }
        });
      }
      // Force organization to caller's org
      organizationId = callerOrgId;
      createNewOrganization = false;

      // org_admin cannot create super_admin or org_admin
      if (role === 'super_admin' || role === 'org_admin') {
        console.warn(`org_admin ${callingUser.email} tried to create user with role: ${role}`);
        
        await logAuditEvent(supabaseAdmin, {
          event_type: 'permission_violation',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          target_role: role,
          organization_id: callerOrgId,
          success: false,
          error_message: 'org_admin tentou criar usuário com role elevado',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { 
            violation_type: 'elevated_role',
            attempted_role: role
          }
        });
        
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
      await logAuditEvent(supabaseAdmin, {
        event_type: 'permission_violation',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        actor_role: callerRole,
        target_email: email,
        target_role: role,
        success: false,
        error_message: 'Não-super_admin tentou criar super_admin',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { violation_type: 'create_super_admin_denied' }
      });
      
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
        await logAuditEvent(supabaseAdmin, {
          event_type: 'user_creation_failed',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          success: false,
          error_message: 'organizationId não fornecido',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { reason: 'missing_organization_id' }
        });
        
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
        
        await logAuditEvent(supabaseAdmin, {
          event_type: 'user_creation_failed',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          organization_id: organizationId,
          success: false,
          error_message: 'Organização não encontrada',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { attempted_org_id: organizationId }
        });
        
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
      
      await logAuditEvent(supabaseAdmin, {
        event_type: 'user_creation_failed',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        actor_role: callerRole,
        target_email: email,
        target_role: role,
        organization_id: targetOrganizationId,
        organization_name: targetOrganization?.name,
        success: false,
        error_message: errorMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { supabase_error: createUserError.message }
      });
      
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
        
        await logAuditEvent(supabaseAdmin, {
          event_type: 'user_creation_failed',
          actor_id: callingUser.id,
          actor_email: callingUser.email,
          actor_role: callerRole,
          target_email: email,
          target_role: role,
          organization_name: organizationName || name,
          success: false,
          error_message: 'Erro ao criar organização',
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { supabase_error: orgError.message }
        });
        
        return new Response(
          JSON.stringify({ error: 'Erro ao criar organização: ' + orgError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetOrganizationId = orgData.id;
      targetOrganization = orgData;
      console.log(`Organization created with ID: ${orgData.id}`);
      
      // Log organization creation
      await logAuditEvent(supabaseAdmin, {
        event_type: 'organization_creation',
        actor_id: callingUser.id,
        actor_email: callingUser.email,
        actor_role: callerRole,
        organization_id: orgData.id,
        organization_name: orgData.name,
        success: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { new_org_owner_id: newUser.id, new_org_owner_email: email }
      });
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

    // Log role assignment
    await logAuditEvent(supabaseAdmin, {
      event_type: 'role_assignment',
      actor_id: callingUser.id,
      actor_email: callingUser.email,
      actor_role: callerRole,
      target_email: email,
      target_role: role,
      organization_id: targetOrganizationId,
      organization_name: targetOrganization?.name,
      success: !roleUpdateError,
      error_message: roleUpdateError?.message,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { new_user_id: newUser.id }
    });

    console.log(`User ${email} setup complete with role ${role} in org ${targetOrganizationId}`);

    // Log success
    await logAuditEvent(supabaseAdmin, {
      event_type: 'user_creation_success',
      actor_id: callingUser.id,
      actor_email: callingUser.email,
      actor_role: callerRole,
      target_email: email,
      target_role: role,
      organization_id: targetOrganizationId,
      organization_name: targetOrganization?.name,
      success: true,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { 
        new_user_id: newUser.id,
        created_new_organization: createNewOrganization
      }
    });

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
    
    // Log unexpected error
    await logAuditEvent(supabaseAdmin, {
      event_type: 'user_creation_failed',
      success: false,
      error_message: errorMessage,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { unexpected_error: true }
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
