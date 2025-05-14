import { useFetcher } from "@remix-run/react";
import { authenticate, PRO_PLAN } from "../shopify.server";
import {
  Page,
  Card,
  Text,
  BlockStack,
  Button,
  Box,
  InlineGrid,
  Icon,
  InlineStack,
} from "@shopify/polaris";
import useAppStore from "../store/Store";
import updateBillingMetaobject from "../services/updateBillingMetaobject";
import { CheckIcon } from "@shopify/polaris-icons";

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
          returnUrl: `https://admin.shopify.com/store/${shopName}/apps/popup-and-disclaimer/app/`,
        });
      },
    });
    console.log("🏁 Billing already active or just activated, redirecting...");
    await updateBillingMetaobject(admin, "pro");
    console.log("📝 Updated billing metaobject to 'free'");
    return redirect("/app"); // ✅ Proper redirect
  }

  console.log("❌ Plan not recognized, fallback...");
  return redirect("/app"); // ✅ Fallback
};

export default function PricingPage() {
  const fetcher = useFetcher();
  let isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const { plan, metaobjects } = useAppStore(); // Zustand plan object
  const plans = [
    {
      type: "free",
      title: "Free",
      price: "$0 ",
      duration: "/ Lifetime",
      description: "Essential features to get started",
      features: [
        "2 Popups with Fundamental Controls",
        "Site-wide & Product Page Targeting",
        "Unlimited Product and Collection Integrations",
        "Basic Customer Support",
      ],
    },
    {
      type: "pro",
      title: "Pro",
      price: "$10",
      duration: "/ Month",

      description: "Everything you need for growth",
      features: [
        "Enjoy Unlimited Customized Popups",
        "Maintenance Mode Notifications",
        "Exit-Intent Popups",
        "Priority Support",
        "Remove the Watermark",
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
    <Page>
      <InlineStack align="center" blockAlign="center">
        <BlockStack gap={300}>
          <Text variant="heading2xl" as="h3" alignment="center">
          🔓 Unlock More with Our Premium Plan 
          </Text>
          <Text alignment="center" variant="bodyLg">
          Get advanced features, priority support, and unbeatable value — all in our premium plan. Upgrade Now!
          </Text>
        </BlockStack>
      </InlineStack>
      <Box paddingBlockStart={800}>
        <InlineStack align="center" blockAlign="baseline" gap="400">
          {plans.map((plan) => (
            <Box
              shadow={300}
              key={plan.type}
              style={{
                width: "full",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Card roundedAbove="sm" padding="800">
                <Box
                  style={{
                    height: "350px",
                    width: "300px",
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "start",
                  }}
                >
                  <BlockStack gap="300">
                    <Text variant="headingMd" alignment="left">
                      {plan.title}
                    </Text>

                    <InlineStack align="start" blockAlign="center" gap={100}>
                      <Text variant="heading3xl" as="h2">
                        {plan.price}
                      </Text>
                      <Text>{plan.duration}</Text>
                    </InlineStack>

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
                      <Text variant="bodyLg" alignment="left">
                        {plan.description}
                      </Text>
                    )}
                    <Box>
                      <BlockStack gap="300">
                        <Box paddingBlock={300}>
                          <Button
                            fullWidth
                            size="large"
                            variant={
                              plan.type === "free" ? "secondary" : "primary"
                            }
                            onClick={() =>
                              handlePlanSelect(
                                hasProPlan && plan.type === "pro"
                                  ? "free"
                                  : "pro",
                              )
                            }
                            disabled={
                              (plan.type === "free" && hasProPlan) ||
                              (plan.type === "pro" && hasProPlan) ||
                              isLoading
                            }
                            loading={isLoading}
                          >
                            {plan.type === "free"
                              ? hasProPlan
                                ? "Already Upgraded"
                                : "Free Plan Activated "
                              : plan.type === "pro"
                                ? hasProPlan
                                  ? "You are on a Pro Plan"
                                  : "Upgrade to Pro"
                                : "Select Plan"}
                          </Button>
                        </Box>
                        <ul
                          style={{
                            paddingLeft: 0,
                            margin: 0,
                            listStyle: "none",
                          }}
                        >
                          {plan.features.map((item, idx) => (
                            <li
                              key={idx}
                              style={{
                                marginBlockEnd: "10px",
                                listStyle: "none",
                                fontSize: "1rem",
                                alignItems: "start",
                                display: "flex",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "1rem",
                                }}
                              >
                                <Icon tone="green-12" source={CheckIcon} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </BlockStack>
                    </Box>
                    {/* Feature list */}

                    {/* Button(s) */}
                  </BlockStack>
                </Box>
              </Card>
            </Box>
          ))}
        </InlineStack>
      </Box>
    </Page>
  );
}
