import json from "@remix-run/node";
import crypto from "crypto";

const SHOPIFY_WEBHOOK_SECRET = "e0e9e8efa153496a482a43e7cebb683304829646700db9e29022aa0faab01c82"; // Make sure this is set in your environment

async function verifyShopifyWebhook(request) {
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader || !SHOPIFY_WEBHOOK_SECRET) {
    console.error("🚨 Missing HMAC header or Webhook Secret!");
    return false;
  }

  const body = await request.text(); // Read request body once
  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64");

  const isValid = crypto.timingSafeEqual(Buffer.from(generatedHmac), Buffer.from(hmacHeader));

  if (!isValid) console.error("🚨 Invalid Shopify Webhook Signature");
  return isValid;
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  if (!(await verifyShopifyWebhook(request))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(await request.text()); // Read body again
    console.log("✅ Verified Shopify Webhook:", payload);

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("🚨 Error parsing JSON:", error);
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
