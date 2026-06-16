import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get userId from request body — client already verified the session
    const body = await req.json().catch(() => ({}))
    const userId: string = body?.userId

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify the user actually exists before deleting
    const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(userId)
    if (getUserError || !user) {
      return new Response(JSON.stringify({ error: 'User not found: ' + (getUserError?.message ?? 'no user') }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete seller's products
    const { data: products } = await adminClient
      .from('products')
      .select('id')
      .or(`user_id.eq.${userId},seller_id.eq.${userId}`)

    if (products && products.length > 0) {
      const productIds = products.map((p: { id: string }) => p.id)
      await adminClient.from('product_views').delete().in('product_id', productIds)
      await adminClient.from('products').delete().in('id', productIds)
    }

    // Clean up user data from other tables (ignore errors for missing tables)
    for (const { table, column } of [
      { table: 'product_views', column: 'buyer_id' },
      { table: 'search_history', column: 'user_id' },
      { table: 'saved_items', column: 'user_id' },
      { table: 'orders', column: 'user_id' },
    ]) {
      try { await adminClient.from(table).delete().eq(column, userId) } catch (_) {}
    }

    try { await adminClient.from('users').delete().eq('user_id', userId) } catch (_) {}

    // Delete the auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) throw new Error('Failed to delete auth user: ' + deleteAuthError.message)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('delete-account error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
