import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useRouteError,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import en from "@shopify/polaris/locales/en.json";
import { json } from "@remix-run/node";
import useAppStore from "../store/Store";
import { useEffect, useState } from "react";
import { Box, Button, InlineStack, Text } from "@shopify/polaris";
import BannerModal from "../components/BannerModal";
import checkAppEmbedStatus from "../services/checkAppEmbedStatus";
import SupportPopover from "../components/Popover";
import updateBillingMetaobject from "../services/updateBillingMetaobject";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { billing, admin } = await authenticate.admin(request);
  const plan = await billing.check();
  if (plan.hasActivePayment == true) {
    await updateBillingMetaobject(admin, "pro");
  }
  const { themeId, isEnabled } = await checkAppEmbedStatus(admin);
  const type = "alertium-by-konain-bhai";

  const queryResponse = await admin.graphql(`
      {
        shop {
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
        collections(first: 250) {
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
    value: node.id,
    label: node.title,
  }));

  const collections = queryData.data.collections.edges.map(({ node }) => ({
    value: node.id,
    label: node.title,
  }));

  const shop = queryData.data?.shop || "";

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

  const apiKey = process.env.SHOPIFY_API_KEY || "";

  return json({
    products,
    collections,
    metaobjects,
    shop,
    themeId,
    appEmbedStatus: isEnabled,
    apiKey,
    plan,
  });
};

export default function App() {
  const location = useLocation();
  const {
    setProducts,
    setMetaobjects,
    setCollections,
    setShop,
    setPlan,
    setAppEmbed,
    setTheme,
  } = useAppStore();
  const {
    products,
    collections,
    metaobjects,
    shop,
    apiKey,
    plan,
    appEmbedStatus,
    themeId,
  } = useLoaderData();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setAppEmbed(appEmbedStatus);
    setShowModal(!appEmbedStatus);
    setTheme(themeId);
    setProducts(products);
    setMetaobjects(metaobjects);
    setCollections(collections);
    setShop(shop);
    setPlan(plan);
    console.log("App Plan", plan);
  }, [location]);
  const previewTheme = () => {
    const themeEditorId = themeId.split("/").pop();
    const shopName = shop?.name;
    console.log(shop, shopName);
    console.log(themeId);
    const extensionId = "246aa213-aa58-4398-af2b-c884b7c494d8";
    const extensionName = "poppy-popup";
    const editorUrl = `https://admin.shopify.com/store/${shopName}/themes/${themeEditorId}/editor?context=apps&template=index&activateAppId=${extensionId}/${extensionName}`;
    window.open(editorUrl, "_blank");
  };

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={en}>
      <NavMenu>
        <Link to="/app" rel="home">
          Popup Disclaimer
        </Link>
        <Link to="/app/pricing">Pricing</Link>
      </NavMenu>
      <Outlet />
      <SupportPopover />
      <Box paddingBlockEnd={800} paddingBlockStart={800}>
        <InlineStack align="center" blockAlign="center">
          <Text variant="bodyLg" >
            For help or setup guidance, contact us at{" "}
            <Link>contact@objects.ws</Link>.
          </Text>
        </InlineStack>
      </Box>
      <BannerModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onPrimary={() => {
          previewTheme();
          setShowModal(false);
        }}
      />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
