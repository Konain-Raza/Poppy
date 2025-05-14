import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { shopifyApp, BillingInterval } from "@shopify/shopify-app-remix/server";
import prisma from "./db.server";
export const FREE_PLAN = "Free Plan";
export const PRO_PLAN = "Pro Plan";
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "8401dba5e37a862351d8eb2c49b01276",
  apiSecretKey:
    process.env.SHOPIFY_API_SECRET || "e2c8a3954cb04585bbc975f4d0bc",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(",") || [
    "read_metaobjects",
    "write_files",
    "write_metaobject_definitions",
    "write_metaobjects",
    "write_products",
    "write_themes",
  ],
  appUrl:
    process.env.SHOPIFY_APP_URL || "https://popup-disclaimer.affiliatewoo",
  authPathPrefix: "/auth",
  billing: {
    [PRO_PLAN]: {
      amount: 9.99,
      currencyCode: "USD",
      test: true,
      interval: BillingInterval.Every30Days, // monthly subscription
    },
  },
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
