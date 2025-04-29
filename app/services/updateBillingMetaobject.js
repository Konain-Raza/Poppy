const updateBillingMetaobject = async (admin, planValue) => {
    const type = "poppy-billing"; // new type just for billing info
    const handle = "poppy-billing-setting"; 
  
    try {
      // Step 1: Ensure Metaobject Definition exists
      const definitionCheck = await admin.graphql(`
        #graphql
        {
          metaobjectDefinitionByType(type: "${type}") {
            id
          }
        }
      `);
  
      const defCheckData = await definitionCheck.json();
      const definitionExists = defCheckData.data.metaobjectDefinitionByType;
  
      if (!definitionExists) {
        const createDef = await admin.graphql(`
          #graphql
          mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
            metaobjectDefinitionCreate(definition: $definition) {
              metaobjectDefinition {
                id
              }
              userErrors {
                field
                message
                code
              }
            }
          }
        `, {
          variables: {
            definition: {
              name: "Billing Info",
              type,
              fieldDefinitions: [
                { name: "Plan", key: "plan", type: "single_line_text_field" }
              ],
            },
          },
        });
  
        const defResult = await createDef.json();
        if (defResult.data.metaobjectDefinitionCreate.userErrors.length > 0) {
          console.error("Definition creation failed:", defResult.data.metaobjectDefinitionCreate.userErrors);
          return { success: false, message: "Definition creation error", error: defResult.data.metaobjectDefinitionCreate.userErrors };
        }
  
        console.log("Billing Metaobject Definition created.");
      }
  
      // Step 2: Upsert Metaobject (create or update)
      const upsert = await admin.graphql(`
        #graphql
        mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
          metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
            metaobject {
              id
              handle
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
      `, {
        variables: {
          handle: {
            type,
            handle,
          },
          metaobject: {
            fields: [
              {
                key: "plan",
                value: planValue,
              },
            ],
          },
        },
      });
  
      const upsertData = await upsert.json();
      if (upsertData.data.metaobjectUpsert.userErrors.length > 0) {
        console.error("Upsert error:", upsertData.data.metaobjectUpsert.userErrors);
        return { success: false, message: "Upsert failed", error: upsertData.data.metaobjectUpsert.userErrors };
      }
  
      console.log("Billing MetaObject upserted successfully:", upsertData.data.metaobjectUpsert.metaobject);
      return { success: true, data: upsertData.data.metaobjectUpsert.metaobject };
  
    } catch (error) {
      console.error("Unexpected error:", error);
      return { success: false, message: "Unexpected error", error };
    }
  };
  
  export default updateBillingMetaobject;
  