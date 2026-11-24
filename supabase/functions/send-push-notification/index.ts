import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationPayload = {
  /** "all" sends to every active subscription (needs PUSH_TRIGGER_SECRET). */
  audience?: "all";
  /** Scheduled daily messages: picks its own text and audience (needs PUSH_TRIGGER_SECRET). */
  campaign?: "morning" | "afternoon" | "evening";
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

// ── Daily campaigns ───────────────────────────────────────────────────────────
// Each run picks the next message in its list (by day), so people don't get the
// same words every day. Edit the lists here to change what is sent.
const MORNING = [
  { title: "New bags just landed 👜", body: "Fresh arrivals are in. See them before they go." },
  { title: "Good morning from BagSearch", body: "Start the day with today's newest bags." },
  { title: "Spotted a bag you love?", body: "Upload a photo and find it in seconds with Visual Search." },
];
const AFTERNOON_NO_LISTING = [
  { title: "You haven't listed a bag yet", body: "It's free and takes two minutes. Buyers are searching now." },
  { title: "Your shop is empty", body: "Add your first bag and start getting orders on BagSearch." },
  { title: "Buyers are waiting", body: "List your first bag today — add a photo, price and you're live." },
];
const EVENING = [
  { title: "New: Factory Direct 🏭", body: "Buy straight from verified bag factories at factory prices.", url: "/factory" },
  { title: "Hot deals tonight 🔥", body: "Bags at lower prices, for a short time.", url: "/hot-deals" },
  { title: "Get order updates instantly", body: "Track your orders and seller replies in your profile.", url: "/profile" },
  { title: "Found it in a photo?", body: "Visual Search finds matching bags from any picture.", url: "/products" },
];
const dayIndex = () => Math.floor(Date.now() / 86_400_000);
const pick = <T,>(list: T[]) => list[dayIndex() % list.length];

/** Sellers who have no products yet. */
async function sellersWithoutListings(): Promise<Set<string>> {
  const { data: sellers, error } = await supabaseAdmin.from("users").select("user_id").eq("role", "seller").limit(10000);
  if (error) throw error;
  const ids = new Set((sellers ?? []).map((s: { user_id: string }) => s.user_id));
  const { data: owners, error: prodErr } = await supabaseAdmin.from("products").select("user_id").limit(50000);
  if (prodErr) throw prodErr;
  for (const p of owners ?? []) ids.delete((p as { user_id: string }).user_id);
  return ids;
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
    let onlyUsers: Set<string> | null = null;
    if (payload.campaign) {
      if (!internalTriggerSecret || authHeader !== `Bearer ${internalTriggerSecret}`) {
        return json({ error: "Campaigns need PUSH_TRIGGER_SECRET" }, 401);
      }
      payload.audience = "all";
      payload.tag = `bagsearch-${payload.campaign}`;
      if (payload.campaign === "morning") {
        Object.assign(payload, { url: "/products" }, pick(MORNING));
      } else if (payload.campaign === "afternoon") {
        onlyUsers = await sellersWithoutListings();
        if (!onlyUsers.size) return json({ success: true, sent: 0, message: "Every seller has a listing." });
        Object.assign(payload, { url: "/upload-product" }, pick(AFTERNOON_NO_LISTING));
      } else if (payload.campaign === "evening") {
        Object.assign(payload, pick(EVENING));
      } else {
        return json({ error: "Unknown campaign" }, 400);
      }
    }
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
        .select("id, user_id, endpoint, p256dh, auth")
        .eq("is_active", true)
        .order("id")
        .range(from, from + 999);
      if (!broadcast) q = q.eq("user_id", payload.sellerId!);
      const { data, error: subscriptionError } = await q;
      if (subscriptionError) throw subscriptionError;
      subscriptions.push(...(data ?? []).filter((d: { user_id: string }) => !onlyUsers || onlyUsers.has(d.user_id)));
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

    return json({ success: true, sent, total: subscriptions.length, cleanedUp: staleIds.length, campaign: payload.campaign ?? null, title: payload.title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return json({ error: message }, 500);
  }
});
