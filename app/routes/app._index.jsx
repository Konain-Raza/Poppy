import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server.js";
import { Page, EmptyState, Text } from "@shopify/polaris";
import useAppStore from "../store/Store.js";
import { useEffect } from "react";
import AlertCard from "../components/AlertCard.jsx";
import DeleteMetaobject from "../services/deleteMetaobject.js";
import { PlusIcon } from "@shopify/polaris-icons";
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const type = "alertium-by-konain-bhai";

  const queryResponse = await admin.graphql(`
    {
      shop{
  name
  shopOwnerName
}
      products(first: 200) {
        edges {
          node {
            id
            title
          }
        }
      }
      metaobjects(type: "${type}", first: 250) {
        edges {
          node {
            id
            handle
            displayName
            fields {
              key
              jsonValue
            }
          }
        }
      }
    }
  `);

  const queryData = await queryResponse.json();

  const products = queryData.data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
  }));

  const shop = queryData.data?.shop?.shopOwnerName;

  const metaobjects = queryData.data.metaobjects.edges.map(({ node }) => {
    const fields = Object.fromEntries(
      node.fields.map((field) => [field.key, field.jsonValue]),
    );

    return {
      id: node.id,
      handle: node.handle,
      displayName: node.displayName,
      ...fields,
    };
  });

  return json({ products, metaobjects, shop });
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
  const { setProducts, setMetaobject } = useAppStore();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const { products, metaobjects, shop } = useLoaderData();
  useEffect(() => {
    setProducts(products);
    setMetaobject(metaobjects);
  }, [products, metaobjects]);
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
        icon: PlusIcon,
        onAction: () => {
          navigate("/app/settings");
        },
      }}
    >
      {metaobjects.length > 0 ? (
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
