
const checkAppEmbedStatus = async (admin) => {
  const appSlug = "popup-disclaimer"; // from the Shopify app URL
  const blockName = "poppy-popup"; // matches your extension block name
  const appHandle = `shopify://apps/${appSlug}/blocks/${blockName}`;

  try {
    // 1. Fetch the main theme
    const themeResponse = await admin.graphql(`
      query {
        themes(first: 20) {
          edges {
            node {
              id
              role
              name
            }
          }
        }
      }
    `);
    const themeData = await themeResponse.json();

    const themes = themeData.data.themes.edges;
    const mainTheme = themes.find((t) => t.node.role === "MAIN");

    if (!mainTheme) {
      console.error("Main theme not found");
      return { themeId: null, isEnabled: false };
    }

    const themeId = mainTheme.node.id;

    // 2. Fetch settings_data.json for that theme
    const settingsResponse = await admin.graphql(
      `
      query getThemeFile($id: ID!) {
        theme(id: $id) {
          files(filenames: ["config/settings_data.json"], first: 1) {
            nodes {
              filename
              body {
                ... on OnlineStoreThemeFileBodyText {
                  content
                }
              }
            }
          }
        }
      }
    `,
      {
        variables: { id: themeId },
      },
    );

    const settingsData = await settingsResponse.json();
    const rawContent =
      settingsData?.data?.theme?.files?.nodes?.[0]?.body?.content ?? "";
    if (!rawContent) {
      console.warn("settings_data.json not found or empty");
      return { themeId, isEnabled: false };
    }

    const cleaned = rawContent.replace(/\/\*[\s\S]*?\*\//g, ""); // Clean multi-line comments
    const parsedData = JSON.parse(cleaned);

    // 3. Check for app embed block
    const blocks = parsedData?.current?.blocks;
    console.log(blocks);

    if (!blocks) {
      return { themeId, isEnabled: false };
    }

    for (const blockId of Object.keys(blocks)) {
      const block = blocks[blockId];
      if (block?.type?.includes(appHandle)) {
        const isDisabled = block.disabled === true;
        return { themeId, isEnabled: !isDisabled };
      }
    }

    return { themeId, isEnabled: false };
  } catch (error) {
    console.error("Error in checkAppEmbedStatus:", error);
    return { themeId: null, isEnabled: false };
  }
};

export default checkAppEmbedStatus;
