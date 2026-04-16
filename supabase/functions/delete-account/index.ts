import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user from token
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: " + (userError?.message ?? "no user") }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);

    // Delete products for this user
    const { data: products } = await adminClient
      .from("products")
      .select("id")
      .or(`user_id.eq.${userId},seller_id.eq.${userId}`);

    if (products && products.length > 0) {
      const productIds = products.map((p: { id: string }) => p.id);

      // Delete product views first
      const { error: viewsError } = await adminClient
        .from("product_views")
        .delete()
        .in("product_id", productIds);
      if (viewsError) {
        console.error("Error deleting product views:", viewsError.message);
      }

      // Delete products
      const { error: productsError } = await adminClient
        .from("products")
        .delete()
        .in("id", productIds);
      if (productsError) {
        console.error("Error deleting products:", productsError.message);
        throw productsError;
      }
    }

    // Delete user-related data from other tables
    const tablesToDelete = [
      { table: "product_views", column: "buyer_id" },
      { table: "search_history", column: "user_id" },
      { table: "saved_items", column: "user_id" },
      { table: "orders", column: "user_id" },
    ];

    for (const { table, column } of tablesToDelete) {
      try {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq(column, userId);
        if (error) {
          console.error(`Error deleting from ${table}:`, error.message);
        }
      } catch (err) {
        console.error(`Unexpected error deleting from ${table}:`, err);
      }
    }

    // Delete auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError.message);
      throw deleteAuthError;
    }

    console.log(`Successfully deleted account for user: ${userId}`);
    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Delete account error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
