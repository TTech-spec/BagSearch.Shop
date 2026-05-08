const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  website?: string;
  message?: string;
};

const CONTACT_EMAIL = "info@bagsearch.shop";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL") || "BagSearch Contact <onboarding@resend.dev>";

    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const payload = (await req.json()) as ContactPayload;
    const firstName = (payload.firstName || "").trim();
    const lastName = (payload.lastName || "").trim();
    const email = (payload.email || "").trim();
    const phone = (payload.phone || "").trim();
    const website = (payload.website || "").trim();
    const message = (payload.message || "").trim();

    if (!firstName || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a0a00">
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Website:</strong> ${website || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${message}</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject: `New contact form message from ${fullName}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(resendData?.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id || null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
