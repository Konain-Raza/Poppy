import { authenticate } from "../shopify.server";

const createMetaObjectDefinitionAndInstance = async () => {
  const { admin } = await authenticate.admin(request);
    const type = "donation-settings-objectss";  // MetaObject type
    const handle = "donation-settings-objecsts-2023";  // Unique handle for this instance
  
    try {
      // Step 1: Query for existing MetaObjects of type 'donation-settings-objects'
      const queryResponse = await admin.graphql(
        `#graphql
          query GetMetaObjects {
            metaobjects(first: 10, type: "${type}") {
              edges {
                node {
                  id
                  fields {
                    key
                    jsonValue
                  }
                }
              }
            }
          }`
      );
  
      const queryData = await queryResponse.json();
      const existingMetaObject = queryData.data.metaobjects.edges.find(
        (edge) => edge.node.fields.some(field => field.key === "donationProductVariant")
      );
  
      // Step 2: If a MetaObject instance with the key "donationProductVariant" exists, return it
      if (existingMetaObject) {
        console.log("MetaObject instance with type:", type, "already exists.");
        return { success: true, message: `MetaObject type '${type}' already exists.`, metaObject: existingMetaObject.node };
      }
  
      // Step 3: If no MetaObject exists, create the MetaObject Definition and Instance
  
      // Create MetaObject Definition
      const metaObjectDefinitionData = {
        name: "Donation Settings",
        type: type,
        fieldDefinitions: [
          {
            name: "settings",
            key: "donationProductVariant",
            type: "json",
          },
        ],
      };
  
      const definitionResponse = await admin.graphql(
        `#graphql
          mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
            metaobjectDefinitionCreate(definition: $definition) {
              metaobjectDefinition {
                name
                type
                fieldDefinitions {
                  name
                  key
                }
              }
              userErrors {
                field
                message
                code
              }
            }
          }`,
        {
          variables: {
            definition: metaObjectDefinitionData,
          },
        }
      );
  
      const definitionData = await definitionResponse.json();
  
      if (definitionData.data.metaobjectDefinitionCreate.userErrors.length > 0) {
        console.error("Error creating MetaObject Definition:", definitionData.data.metaobjectDefinitionCreate.userErrors);
        return { success: false, message: definitionData.data.metaobjectDefinitionCreate.userErrors };
      }
  
      console.log("MetaObject Definition created successfully:", definitionData.data.metaobjectDefinitionCreate.metaobjectDefinition);
  
      // Step 4: Create MetaObject Instance based on the definition
      const metaObjectData = {
        type: type,
        handle: handle,
        fields: [
          {
            key: "donationProductVariant",  // Key from the MetaObject Definition
            value: JSON.stringify({ variantId: "12345", amount: 100, currency: "USD", description: "Donation for cause" })  // Properly formatted value
          }
        ]
      };
  
      const createResponse = await admin.graphql(
        `#graphql
          mutation CreateMetaObjectInstance($metaobject: MetaobjectCreateInput!) {
            metaobjectCreate(metaobject: $metaobject) {
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
          }`,
        {
          variables: {
            metaobject: metaObjectData,
          },
        }
      );
  
      const createData = await createResponse.json();
      console.log(createData);
      if (createData.data.metaobjectCreate.userErrors.length > 0) {
        console.error("Error creating MetaObject Instance:", createData.data.metaobjectCreate.userErrors);
        return { success: false, message: createData.data.metaobjectCreate.userErrors };
      }
  
      console.log("MetaObject Instance created successfully:", createData.data.metaobjectCreate.metaobject);
  
      return { success: true, message: "MetaObject Definition and Instance created successfully.", metaobject: createData};
  
    } catch (error) {
      console.error("Request failed:", error);
      return { success: false, message: "An error occurred during the request." };
    }
  };
  
  export default createMetaObjectDefinitionAndInstance;