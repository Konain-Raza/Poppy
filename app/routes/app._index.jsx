import { json } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import { Page, EmptyState, Text, Box, Button } from "@shopify/polaris";
import useAppStore from "../store/Store.js";
import AlertCard from "../components/AlertCard.jsx";
import DeleteMetaobject from "../services/deleteMetaobject.js";
import { ExternalIcon, LockIcon, PlusIcon } from "@shopify/polaris-icons";
import { useEffect } from "react";
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
    return id;
  } catch (error) {
    return json({ error: "Error deleting item" }, { status: 500 });
  }
};

export default function Index() {
  const { metaobjects, setMetaobjects, plan } = useAppStore();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  const deletedId = fetcher.data;
  useEffect(() => {
    if (deletedId) {
      console.log("Deleted Id:", deletedId);

      const updatedMetaobjects = metaobjects.filter(
        (metaobject) => metaobject.id !== deletedId,
      );

      console.log("After deleting", updatedMetaobjects);
      setMetaobjects(updatedMetaobjects);
    }
  }, [deletedId]);

  useEffect(() => {
    const updated = location.state?.updatedMetaobject;
    if (updated) {
      const index = metaobjects.findIndex((obj) => obj.id === updated.id);
      const newMetaobjects = [...metaobjects];

      if (index !== -1) {
        newMetaobjects[index] = updated; // update existing
      } else {
        newMetaobjects.push(updated); // add new
      }

      setMetaobjects(newMetaobjects);
    }
  }, [location.state]);
  const isCreatePopupDisabled =
    !(
      plan?.hasActivePayment &&
      plan?.appSubscriptions?.length > 0 &&
      plan.appSubscriptions[0]?.status === "ACTIVE" &&
      plan.appSubscriptions[0]?.name === "Pro Plan"
    ) && metaobjects?.length >= 2;

  const confirmDeleteAlert = async (id) => {
    fetcher.submit(
      {
        id,
      },
      { method: "POST" },
    );
  };

  const handleSave = () => {
    navigate("/app/settings");
  };
  return (
    <Page
      title={`Welcome to Popup & Disclaimer! 🤩`}
      subtitle="Create stunning alerts, disclaimers, and pop-ups that convert, inform, and delight – all in just a few clicks"
      hasSubtitleMaxWidth={false}
      primaryAction={{
        content: "Create Popup",
        disabled: isCreatePopupDisabled,
        icon: PlusIcon,
        onAction: () => {
          navigate("/app/settings");
        },
      }}
      secondaryActions={[
        {
          content: "Docs",
          external: "true",
          icon: ExternalIcon,
          url: "https://www.facebook.com/business/learn/facebook-page-build-audience",
        },
      ]}
    >
      {metaobjects && metaobjects.length > 0 ? (
        <>
          <Box paddingBlockEnd={300}>
            <Text variant="headingMd" as="h6">
              All Popups & Disclaimers
            </Text>
          </Box>

    {/* Case: isCreatePopupDisabled is false → show all normally */}
    {!isCreatePopupDisabled &&
      metaobjects.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDelete={confirmDeleteAlert}
          blur={false}
        />
      ))}

    {/* Case: isCreatePopupDisabled is true */}
    {isCreatePopupDisabled && (
      <>
        {/* First 2 cards - normal */}
        {metaobjects.slice(0, 2).map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDelete={confirmDeleteAlert}
            blur={false}
          />
        ))}

        {/* Remaining cards - inside blur */}
        {metaobjects.length > 2 && (
  <div style={{ position: "relative" }}>
    {/* Centered Upgrade Button */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "auto", // allow click
      }}
    >
      <Button  icon={LockIcon} size="large" onClick={() => navigate("/app/pricing")}>
        Upgrade to Unlock
      </Button>
    </div>

    {/* Blurred Cards */}
    <div
      style={{
        filter: "blur(4px)",
        pointerEvents: "none", // disables interaction with blurred cards
        transition: "filter 0.3s ease",
      }}
    >
      {metaobjects.slice(2).map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDelete={confirmDeleteAlert}
          blur={false}
        />
      ))}
    </div>
  </div>
)}

      </>
    )}
  </>
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
