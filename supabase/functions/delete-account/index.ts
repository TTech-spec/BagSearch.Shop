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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (userError?.message ?? 'no user') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    const { data: products } = await adminClient
      .from('products')
      .select('id')
      .or(`user_id.eq.${userId},seller_id.eq.${userId}`)

    if (products && products.length > 0) {
      const productIds = products.map((p: { id: string }) => p.id)
      await adminClient.from('product_views').delete().in('product_id', productIds)
      await adminClient.from('products').delete().in('id', productIds)
    }

    await Promise.all([
      adminClient.from('search_history').delete().eq('user_id', userId),
      adminClient.from('saved_items').delete().eq('user_id', userId),
      adminClient.from('orders').delete().eq('user_id', userId),
    ])

    await adminClient.from('users').delete().eq('user_id', userId)

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) throw deleteAuthError

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
