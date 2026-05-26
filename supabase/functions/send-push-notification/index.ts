import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationPayload = {
  sellerId?: string;
  notificationId?: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const vapidSubject = Deno.env.get("WEB_PUSH_VAPID_SUBJECT") ?? "mailto:info@bagsearch.shop";
const vapidPublicKey = Deno.env.get("WEB_PUSH_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("WEB_PUSH_PRIVATE_KEY") ?? "";
const internalTriggerSecret = Deno.env.get("PUSH_TRIGGER_SECRET") ?? "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase admin environment variables are missing.");
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("Web push VAPID keys are missing.");
    }

    const authHeader = req.headers.get("authorization") || "";
    if (internalTriggerSecret && authHeader !== `Bearer ${internalTriggerSecret}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    const payload = (await req.json()) as NotificationPayload;
    if (!payload.sellerId || !payload.title || !payload.body) {
      return json({ error: "Missing sellerId, title, or body" }, 400);
    }

    const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", payload.sellerId)
      .eq("is_active", true);

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscriptions?.length) {
      return json({ success: true, sent: 0, message: "No active subscriptions for user." });
    }

    let sent = 0;
    const staleIds: string[] = [];
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/seller-profile",
      tag: payload.tag || payload.notificationId || "bagsearch-notification",
      notificationId: payload.notificationId || null,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }, pushPayload);

        sent += 1;
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : 0;

        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(subscription.id);
          continue;
        }

        console.error("Push delivery failed", subscription.id, error);
      }
    }

    if (staleIds.length) {
      await supabaseAdmin
        .from("push_subscriptions")
        .update({ is_active: false })
        .in("id", staleIds);
    }

    return json({ success: true, sent, cleanedUp: staleIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return json({ error: message }, 500);
  }
});
