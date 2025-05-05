import { useFetcher } from "@remix-run/react";
import { authenticate, PRO_PLAN } from "../shopify.server";
import {
  Page,
  Card,
  Layout,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Box,
  CalloutCard,
  Image,
  InlineGrid,
} from "@shopify/polaris";
import useAppStore from "../store/Store";
import updateBillingMetaobject from "../services/updateBillingMetaobject";
import upsertMetaObject from "../services/upsertMetaobject";

export const action = async ({ request }) => {
  console.log("🚀 Action triggered");

  const { billing, redirect, session, admin } =
    await authenticate.admin(request);
  const formData = await request.formData();
  const { shop } = session;
  let shopName = shop.replace(".myshopify.com", "");
  const plan = formData.get("plan");
  const metaobjectsRaw = formData.get("metaobjects");
  const metaobjects = JSON.parse(metaobjectsRaw);

  console.log("Metaobjects", metaobjects);
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
      if (metaobjects?.length > 2) {
        for (const [index, metaobject] of metaobjects.entries()) {
          const isFirstTwo = index < 2;
          const isRemaining = index >= 2;

          const showPositionProValues = ["productPage", "closeIntent"];

          const fields = [
            {
              key: "alertStatus",
              value: isRemaining ? "inactive" : metaobject.alertStatus || "",
            },
            { key: "title", value: metaobject.title || "" },
            { key: "description", value: metaobject.description || "" },
            { key: "image", value: metaobject.image || "" },
            { key: "primaryText", value: metaobject.primaryText || "" },
            { key: "secondaryText", value: metaobject.secondaryText || "" },
            {
              key: "selectedProducts",
              value: JSON.stringify(metaobject.selectedProducts || []),
            },
            {
              key: "selectedCollections",
              value: JSON.stringify(metaobject.selectedCollections || []),
            },
            {
              key: "countryRestriction",
              value: metaobject.countryRestriction || "",
            },
            {
              key: "selectedCountries",
              value: JSON.stringify(metaobject.selectedCountries || []),
            },
            {
              key: "scheduleStatus",
              value:
                isFirstTwo && metaobject.scheduleStatus === "enable"
                  ? "disable"
                  : metaobject.scheduleStatus || "",
            },
            {
              key: "startDate",
              value: metaobject.startDate || "",
            },
            {
              key: "endDate",
              value: metaobject.endDate || "",
            },
            {
              key: "showPosition",
              value:
                isFirstTwo &&
                showPositionProValues.includes(metaobject.showPosition)
                  ? "addToCart"
                  : metaobject.showPosition || "",
            },
            { key: "selectBy", value: metaobject.selectBy || "" },
            { key: "userOnly", value: String(metaobject.userOnly ?? true) },
            {
              key: "removeWatermark",
              value:
                isFirstTwo && metaobject.removeWatermark === true
                  ? "false"
                  : String(metaobject.removeWatermark ?? true),
            },
          ];

          console.log(
            `[DEBUG] Updating metaobject #${index}: ${metaobject.handle}`,
          );
          const response = await upsertMetaObject(
            admin,
            metaobject.handle,
            fields,
          );
          console.log(`[DEBUG] Updated: ${metaobject.handle}`, response);
        }

        console.log("[DEBUG] All metaobjects processed.");
      } else {
        console.log("[DEBUG] metaobjects.length <= 2, skipping update.");
      }

      console.log("✅ Subscription canceled successfully");
    } else {
      console.log("ℹ️ No active Pro subscription found.");
    }
    await updateBillingMetaobject(admin, "free");
    console.log("📝 Updated billing metaobject to 'free'");

    return redirect("/app");
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
    await updateBillingMetaobject(admin, "pro");
    console.log("📝 Updated billing metaobject to 'free'");
    return redirect("/app/pricing"); // ✅ Proper redirect
  }

  console.log("❌ Plan not recognized, fallback...");
  return redirect("/app"); // ✅ Fallback
};

export default function PricingPage() {
  const fetcher = useFetcher();
  const { plan, metaobjects } = useAppStore(); // Zustand plan object
  const plans = [
    {
      type: "free",
      title: "Free",
      price: "$0 / Lifetime",
      description: "Essential features to get started",
      features: [
        "2 popups with fundamental controls",
        "Site-wide & Product page targeting",
        "Unlimited product and collection integrations",
        "Basic customer support",
      ],
    },
    {
      type: "pro",
      title: "Pro",
      price: "$10 / month",
      description: "Everything you need for growth",
      features: [
        "Unlimited custom popups",
        "Maintenance mode notifications",
        "Exit-intent conversion",
        "Priority support",
        "Branding-free experience: Remove our watermark",
      ],
    },
  ];

  const handlePlanSelect = (planName) => {
    fetcher.submit(
      { plan: planName, metaobjects: JSON.stringify(metaobjects) },
      { method: "POST" },
    );
  };

  // 👇 Determine Pro Plan status safely
  const hasProPlan =
    plan?.hasActivePayment &&
    plan?.appSubscriptions?.length > 0 &&
    plan.appSubscriptions[0]?.status === "ACTIVE" &&
    plan.appSubscriptions[0]?.name === "Pro Plan";

  return (
    <Page title="Choose Your Plan">
      {/* Two-plan cards side by side */}
      <InlineGrid columns={3} gap="100">
        {plans.map((plan) => (
          <Box key={plan.type} width="100%" maxWidth="300px">
            <Card roundedAbove="sm" padding="400">
              <BlockStack gap="300">
                {/* Plan Title */}
                <Text variant="headingMd" fontWeight="bold" alignment="left">
                  {plan.title}
                </Text>

                {/* Plan Price */}
                <Text variant="headingXl" as="h1" alignment="left">
                  {plan.price}
                </Text>

                {/* Description or trial */}
                {plan.trial && (
                  <Text
                    variant="bodySm"
                    alignment="left"
                    tone="subdued"
                    as="p"
                    fontWeight="medium"
                    background="bg-surface-secondary"
                    padding="100"
                    borderRadius="base"
                  >
                    {plan.trial}
                  </Text>
                )}
                {plan.description && (
                  <Text variant="bodySm" alignment="left">
                    {plan.description}
                  </Text>
                )}
                <Box paddingBlock={400}>
                  <BlockStack gap="100">
                    <Button
                      fullWidth
                      variant={plan.type === "free" ? "primary" : "secondary"}
                      onClick={() =>
                        handlePlanSelect(
                          hasProPlan && plan.type === "pro"
                            ? "free"
                            : plan.type,
                        )
                      }
                      disabled={plan.type === "free" && !hasProPlan}
                    >
                      {plan.type === "free"
                        ? hasProPlan
                          ? "Switch to Free Plan"
                          : "Already on Free Plan"
                        : hasProPlan
                          ? "Cancel Pro Plan"
                          : `Upgrade to Pro`}
                    </Button>
                  </BlockStack>
                </Box>
                {/* Feature list */}
                <Box paddingInlineStart="300">
                  <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
                    {plan.features.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBlockEnd: "7px",
                          listStyle: "disc",
                          fontSize: "0.83rem",
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Box>

                {/* Button(s) */}
              </BlockStack>
            </Card>
          </Box>
        ))}
      </InlineGrid>
    </Page>
  );
}
