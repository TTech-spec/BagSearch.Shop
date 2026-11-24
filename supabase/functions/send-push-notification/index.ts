import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationPayload = {
  /** "all" sends to every active subscription (needs PUSH_TRIGGER_SECRET). */
  audience?: "all";
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
    const broadcast = payload.audience === "all";
    if (broadcast && (!internalTriggerSecret || authHeader !== `Bearer ${internalTriggerSecret}`)) {
      // Sending to everyone must never be possible without the secret.
      return json({ error: "Broadcast needs PUSH_TRIGGER_SECRET" }, 401);
    }
    if ((!broadcast && !payload.sellerId) || !payload.title || !payload.body) {
      return json({ error: "Missing sellerId (or audience: \"all\"), title, or body" }, 400);
    }

    // Load subscriptions: one user's, or everyone's in pages of 1000.
    const subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[] = [];
    for (let from = 0; ; from += 1000) {
      let q = supabaseAdmin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("is_active", true)
        .order("id")
        .range(from, from + 999);
      if (!broadcast) q = q.eq("user_id", payload.sellerId!);
      const { data, error: subscriptionError } = await q;
      if (subscriptionError) throw subscriptionError;
      subscriptions.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }

    if (!subscriptions?.length) {
      return json({ success: true, sent: 0, message: "No active subscriptions." });
    }

    let sent = 0;
    const staleIds: string[] = [];
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || (broadcast ? "/" : "/seller-profile"),
      tag: payload.tag || payload.notificationId || "bagsearch-notification",
      notificationId: payload.notificationId || null,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
    });

    const sendOne = async (subscription: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, pushPayload, { TTL: 60 * 60 * 24 });
        sent += 1;
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : 0;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(subscription.id);
          return;
        }
        console.error("Push delivery failed", subscription.id, error);
      }
    };
    for (let i = 0; i < subscriptions.length; i += 25) {
      await Promise.all(subscriptions.slice(i, i + 25).map(sendOne));
    }

    if (staleIds.length) {
      await supabaseAdmin
        .from("push_subscriptions")
        .update({ is_active: false })
        .in("id", staleIds);
    }

    return json({ success: true, sent, total: subscriptions.length, cleanedUp: staleIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return json({ error: message }, 500);
  }
});
