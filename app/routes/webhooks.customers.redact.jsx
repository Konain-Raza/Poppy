import {json} from "@remix-run/node";
import crypto from "crypto";

const SHOPIFY_WEBHOOK_SECRET = "e0e9e8efa153496a482a43e7cebb683304829646700db9e29022aa0faab01c82";

async function verifyShopifyWebhook(request, rawBody) {
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader || !SHOPIFY_WEBHOOK_SECRET) {
    console.error("🚨 Missing HMAC header or Webhook Secret!");
    return false;
  }

  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");

  const hmacBuffer = Buffer.from(hmacHeader, "base64");
  const generatedBuffer = Buffer.from(generatedHmac, "base64");

  if (hmacBuffer.length !== generatedBuffer.length) {
    console.error("🚨 HMAC length mismatch");
    return false;
  }

  const isValid = crypto.timingSafeEqual(generatedBuffer, hmacBuffer);

  if (!isValid) console.error("🚨 Invalid Shopify Webhook Signature");
  return isValid;
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const rawBody = await request.text();

    if (!(await verifyShopifyWebhook(request, rawBody))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error("🚨 JSON parse error:", err);
      return json({ error: "Bad Request - Invalid JSON" }, { status: 400 });
    }

    console.log("✅ Verified Shopify Webhook:", payload);

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("🚨 Webhook handling error:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
