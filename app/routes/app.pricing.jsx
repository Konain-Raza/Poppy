import { useFetcher } from "@remix-run/react";
import { authenticate, PRO_PLAN } from "../shopify.server";
import { Page, Card, Layout, Text, BlockStack, Button } from "@shopify/polaris";
import useAppStore from "../store/Store";

export const action = async ({ request }) => {
  console.log("🚀 Action triggered");

  const { billing, redirect, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const { shop } = session;
  let shopName = shop.replace(".myshopify.com", "");
  const plan = formData.get("plan");

  console.log("📦 Received plan from formData:", plan);

  if (plan === "free") {
    console.log(
      "✅ Free plan selected, checking if Pro subscription exists...",
    );

    const { hasActivePayment, appSubscriptions } = await billing.check({
      plans: [PRO_PLAN],
      isTest: true,
    });

    if (hasActivePayment && appSubscriptions.length > 0) {
      const subscriptionId = appSubscriptions[0].id;
      console.log(`⚡ Canceling subscription ID: ${subscriptionId}`);

      await billing.cancel({
        subscriptionId,
        isTest: true, // Remove in production
        prorate: true,
      });

      console.log("✅ Subscription canceled successfully");
    } else {
      console.log("ℹ️ No active Pro subscription found.");
    }

    return redirect("/app"); // ✅ Proper redirect
  }

  if (plan === "pro") {
    console.log("✅ Pro plan selected, checking billing...");
    await billing.require({
      plans: [PRO_PLAN],
      isTest: true,
      onFailure: async () => {
        console.log("⚡ Billing not active, requesting billing now...");
        return billing.request({
          plan: PRO_PLAN,
          isTest: true,
          returnUrl: `https://admin.shopify.com/store/${shopName}/apps/poppy-4/app/`,
        });
      },
    });
    console.log("🏁 Billing already active or just activated, redirecting...");
    return redirect("/app/pricing"); // ✅ Proper redirect
  }

  console.log("❌ Plan not recognized, fallback...");
  return redirect("/app"); // ✅ Fallback
};

export default function PricingPage() {
  const fetcher = useFetcher();
  const { plan } = useAppStore(); // Zustand plan object

  const handlePlanSelect = (planName) => {
    fetcher.submit({ plan: planName }, { method: "POST" });
  };

  // 👇 Determine Pro Plan status safely
  const hasProPlan =
    plan?.hasActivePayment &&
    plan?.appSubscriptions?.length > 0 &&
    plan.appSubscriptions[0]?.status === "ACTIVE" &&
    plan.appSubscriptions[0]?.name === "Pro Plan";

  return (
    <Page title="Choose Your Plan">
      <Layout>
        <Layout.Section>
          <Card title="Free Plan" sectioned>
            <BlockStack gap="400">
              <Text variant="headingMd">Start for Free</Text>
              <Text variant="bodyMd" tone="subdued">
                Basic features available, no billing required.
              </Text>
              <Button
                fullWidth
                onClick={() => handlePlanSelect("free")}
                disabled={!hasProPlan} // Only enable if Pro is active
              >
                {hasProPlan ? "Switch to Free Plan" : "Already on Free Plan"}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Pro Plan" sectioned>
            <BlockStack gap="400">
              <Text variant="headingMd">$9.99 / month</Text>
              <Text variant="bodyMd" tone="subdued">
                Unlock premium features and priority support.
              </Text>
              <Button
                primary
                fullWidth
                onClick={() => handlePlanSelect(hasProPlan ? "free" : "pro")}
              >
                {hasProPlan ? "Cancel Pro Plan" : "Choose Pro Plan"}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
