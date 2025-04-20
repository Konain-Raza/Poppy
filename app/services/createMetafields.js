export const createMetafieldDefinition = async (admin) => {
  // Define the metafield definition details
  const metafieldDefinition = {
    namespace: 'hurry-cart',    // Namespace for the metafield
    key: 'settings',            // Key for the metafield
    type: 'json',               // Type of the metafield (json in your case)
    ownerType: 'SHOP',          // Owner type (the owner is a SHOP)
    name: 'Hurry Cart Settings' // Human-readable name for the metafield definition
  };

  // GraphQL mutation to create the metafield definition
  const createDefinitionQuery = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  try {
    // Create the metafield definition
    const createDefinitionResponse = await admin.graphql(createDefinitionQuery, {
      variables: {
        definition: metafieldDefinition,
      },
    });

    // Log the full response for debugging
    console.log("Create Definition Response:", JSON.stringify(createDefinitionResponse, null, 2));

    // Check for errors in the response
    const { userErrors, createdDefinition } = createDefinitionResponse?.data?.metafieldDefinitionCreate || {};

    if (userErrors && userErrors.length) {
      console.error("User Errors:", userErrors);
      throw new Error("Failed to create metafield definition due to errors.");
    }

    if (createdDefinition) {
      console.log(
        "Metafield Definition Created:",
        `ID: ${createdDefinition.id}, Name: ${createdDefinition.name}, Namespace: ${createdDefinition.namespace}, Key: ${createdDefinition.key}`
      );
      return createdDefinition.id;
    } else {
      console.error("Unexpected error, no createdDefinition found.");
      throw new Error("Failed to create metafield definition.");
    }
  } catch (error) {
    console.error("Error in createMetafieldDefinition:", error);
    throw error;
  }
};
