const DeleteMetaobject = async (admin, id) => {
    const query = `
      mutation DeleteMetaobject($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
            code
          }
        }
      }
    `;
  
    const variables = { id };
  
    try {
      const result = await admin.graphql(query, { variables });
  
      console.log("GraphQL Result:", result);
  
      const deletion = result?.data?.metaobjectDelete;
  
      if (deletion?.userErrors?.length > 0) {
        console.error("Metaobject deletion errors:", deletion.userErrors);
        return {
          success: false,
          errors: deletion.userErrors,
        };
      }
  
      if (deletion?.deletedId) {
        return {
          success: true,
          deletedId: deletion.deletedId,
        };
      } else {
        console.error("Error: deletedId not found in response.");
        return {
          success: false,
          errors: ["deletedId not found in the response."],
        };
      }
  
    } catch (error) {
      console.error("GraphQL DeleteMetaobject failed:", error);
      return {
        success: false,
        errors: [error.message || "Unknown error"],
      };
    }
  };
  
  export default DeleteMetaobject;
  