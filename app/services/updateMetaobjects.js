const updateMetaObjectInstance = async (admin, metaObjectId, fieldsToUpdate) => {
    try {
      // Ensure metaObjectId is in the correct format
      if (!metaObjectId || !metaObjectId.startsWith("gid://shopify/Metaobject/")) {
        throw new Error("Invalid MetaObject ID format");
      }
  
      const mutation = `
        mutation UpdateMetaObject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
          metaobjectUpdate(id: $id, metaobject: $metaobject) {
            metaobject {
              id
              type
              fields {
                key
                value
              }
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `;
  
      // Ensure that fieldsToUpdate has the correct structure
      const variables = {
        id: metaObjectId,  // MetaObject ID to update
        metaobject: {
          fields:  JSON.stringify({ variantId: "12345", amount: 100, currency: "USD", description: "Donation for cause" },{ variantId: "12345", amount: 100, currency: "USD", description: "Donation for cause" })  // Properly formatted value
        }
      };
  
      // Perform the GraphQL request
      const response = await admin.graphql(mutation, { variables });
      const responseData = await response.json();
  
      // Handle GraphQL errors
      if (responseData.errors) {
        console.error("GraphQL Errors:", responseData.errors);
        return { success: false, message: `GraphQL Error: ${responseData.errors.map(e => e.message).join(", ")}` };
      }
  
      // Handle user errors (e.g., invalid field names or values)
      if (responseData.data.metaobjectUpdate.userErrors.length > 0) {
        console.error("User Errors:", responseData.data.metaobjectUpdate.userErrors);
        return { success: false, message: `User Error: ${responseData.data.metaobjectUpdate.userErrors.map(e => e.message).join(", ")}` };
      }
  
      // If no errors, log and return the updated MetaObject instance
      console.log("MetaObject Instance updated successfully:", responseData.data.metaobjectUpdate.metaobject);
  
      return {
        success: true,
        message: "MetaObject Instance updated successfully.",
        metaobject: responseData.data.metaobjectUpdate.metaobject,
      };
  
    } catch (error) {
      console.error("Request failed:", error);
      return { success: false, message: "An error occurred during the request." };
    }
  };
  
  export default updateMetaObjectInstance;
  