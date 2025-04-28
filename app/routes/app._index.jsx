import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import { Page, EmptyState, Text } from "@shopify/polaris";
import useAppStore from "../store/Store.js";
import AlertCard from "../components/AlertCard.jsx";
import DeleteMetaobject from "../services/deleteMetaobject.js";
import { PlusIcon } from "@shopify/polaris-icons";
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let formData = await request.formData();
  console.log(formData);
  const id = formData.get("id");

  try {
    await DeleteMetaobject(admin, id);
    // navigate("app/home")
    return true; // Redirect back after successful deletion
  } catch (error) {
    return json({ error: "Error deleting item" }, { status: 500 });
  }
};

export default function Index() {
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const { metaobjects, shop, plan } = useAppStore();
  const isCreatePopupDisabled = (
    !(
      plan?.hasActivePayment &&
      plan?.appSubscriptions?.length > 0 &&
      plan.appSubscriptions[0]?.status === "ACTIVE" &&
      plan.appSubscriptions[0]?.name === "Pro Plan"
    ) && metaobjects?.length >= 2
  );
  
  const confirmDeleteAlert = async (id) => {
    fetcher.submit(
      {
        id,
      },
      { method: "POST" },
    );
  };

  const handleSave = () => {
    navigate("app/settings");
  };
  return (
    <Page
      title={`Hey ${shop}! 🎉 Ready to make popups that wow? 🤩`}
      primaryAction={{
        content: "Create Popup",
        disabled: isCreatePopupDisabled,
        icon: PlusIcon,
        onAction: () => {
          navigate("/app/settings");
        },
      }}
    >
      {metaobjects && metaobjects.length > 0 ? (
        metaobjects.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDelete={confirmDeleteAlert}
          />
        ))
      ) : (
        <EmptyState
          heading="Create your custom popups, warnings, and alerts"
          action={{
            content: "Create Popup",
            onAction: handleSave,
          }}
          secondaryAction={{
            content: "Learn More",
            url: "https://your-docs-url.com",
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text>
            Add smart popups and warnings that engage your customers at key
            moments. Customize messages, styling, and display settings for
            ultimate flexibility.
          </Text>
        </EmptyState>
      )}
    </Page>
  );
}
