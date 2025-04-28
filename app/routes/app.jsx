import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import en from "@shopify/polaris/locales/en.json";
import { json } from "@remix-run/node";
import useAppStore from "../store/Store";
import { useEffect } from "react";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const { billing, admin } = await authenticate.admin(request);
  const plan = await billing.check();
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
    id: node.id,
    title: node.title,
  }));

  const collections = queryData.data.collections.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
  }));

  const shop = queryData.data?.shop?.shopOwnerName || "";

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
    apiKey,
    plan,
  });
};

export default function App() {
  const { setProducts, setMetaobjects, setCollections, setShop, setPlan } =
    useAppStore();
  const { products, collections, metaobjects, shop, apiKey, plan } = useLoaderData();
console.log(metaobjects)

  useEffect(() => {
    setProducts(products);
    setMetaobjects(metaobjects);
    setCollections(collections);
    setShop(shop);
    setPlan(plan)
    
  }, [apiKey]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={en}>
      <NavMenu>
        <Link to="/app" rel="home">
          Poppy
        </Link>
        <Link to="/app/settings">Settings</Link>
        <Link to="/app/pricing">Pricing</Link>
      </NavMenu>
      <Outlet />
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
