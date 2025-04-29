const DeleteMetaobject = async (admin, id) => {
  try {
    const response = await admin.graphql(
      `#graphql
      mutation DeleteMetaobject($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          id: id,
        },
      }
    );

    const data = await response.json(); // ✅ always parse JSON here
    console.log("GraphQL Result:", data);

    const deletion = data?.data?.metaobjectDelete;

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
