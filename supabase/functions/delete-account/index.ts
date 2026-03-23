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
      
      // Delete product views for these products
      const { error: viewsError } = await adminClient.from('product_views').delete().in('product_id', productIds)
      if (viewsError) {
        console.error('Error deleting product views for seller products:', viewsError.message)
        // Continue anyway
      }

      // Delete products
      const { error: productsError } = await adminClient.from('products').delete().in('id', productIds)
      if (productsError) {
        console.error('Error deleting products:', productsError.message)
        // If products can't be deleted, it might be due to a foreign key violation
        // that we don't know about yet. Throw to notify user.
        throw productsError
      }
    }

    // 3. Delete common user data
    // We don't use Promise.all here to avoid potential issues with non-existent tables
    // and to better handle errors
    const tablesToDeleteFrom = [
      { table: 'product_views', column: 'buyer_id' },
      { table: 'search_history', column: 'user_id' },
      { table: 'saved_items', column: 'user_id' },
      { table: 'orders', column: 'user_id' },
    ]

    for (const { table, column } of tablesToDeleteFrom) {
      try {
        const { error } = await adminClient.from(table).delete().eq(column, userId)
        if (error) {
          console.error(`Error deleting from ${table}:`, error.message)
          // We continue anyway, as the table might not exist
        }
      } catch (err) {
        console.error(`Unexpected error deleting from ${table}:`, err)
      }
    }

    const { error: deleteUserError } = await adminClient.from('users').delete().eq('user_id', userId)
    if (deleteUserError) {
      console.error('Error deleting from users table:', deleteUserError.message)
      // Continue to try and delete the auth user anyway
    }

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError.message)
      throw deleteAuthError
    }

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
