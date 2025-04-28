
const upsertMetaObject = async (admin,  handle, fields) => {
  const type = "alertium-by-konain-bhai"; // MetaObject type

  try {
// Step 1: Ensure MetaObject Definition exists
const definitionCheck = await admin.graphql(
  `#graphql
    {
      metaobjectDefinitionByType(type: "alertium-by-konain-bhai") {
        id
        name
      }
    }`
);

const defCheckData = await definitionCheck.json();
const definitionExists = defCheckData.data.metaobjectDefinitionByType;

    if (!definitionExists) {
      const createDef = await admin.graphql(
        `#graphql
          mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
            metaobjectDefinitionCreate(definition: $definition) {
              metaobjectDefinition {
                type
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
            definition: {
              name: "Popup Settings",
              type,
              fieldDefinitions: [
                { name: "alertStatus", key: "alertStatus", type: "single_line_text_field" }, // changed to a valid type
                { name: "title", key: "title", type: "single_line_text_field" },
                { name: "description", key: "description", type: "multi_line_text_field" }, // changed to a valid type
                { name: "image", key: "image", type: "single_line_text_field" }, // for image, use file_reference
                { name: "primaryText", key: "primaryText", type: "single_line_text_field" },
                { name: "secondaryText", key: "secondaryText", type: "single_line_text_field" },
                { name: "selectedProducts", key: "selectedProducts", type: "json" },
                { name: "selectedCollections", key: "selectedCollections", type: "json" },

                { name: "countryRestriction", key: "countryRestriction", type: "single_line_text_field" },
                { name: "selectedCountries", key: "selectedCountries", type: "json" },
                { name: "scheduleStatus", key: "scheduleStatus", type: "single_line_text_field" },
                { name: "startDate", key: "startDate", type: "date_time" }, // changed to date_time type
                { name: "endDate", key: "endDate", type: "date_time" }, // changed to date_time type
                { name: "showPosition", key: "showPosition", type: "single_line_text_field" },
                { name: "userOnly", key: "userOnly", type: "single_line_text_field" },
                { name: "selectBy", key: "selectBy", type: "single_line_text_field" },
                { name: "removeWatermark", key: "removeWatermark", type: "single_line_text_field" }


              ],
              
            },
          },
        }
      );
      

      const defResult = await createDef.json();
      if (defResult.data.metaobjectDefinitionCreate.userErrors.length > 0) {
        console.error("Definition creation failed:", defResult.data.metaobjectDefinitionCreate.userErrors);
        return { success: false, message: "Definition creation error", error: defResult.data.metaobjectDefinitionCreate.userErrors };
      }

      console.log("MetaObject Definition created!");
    }

    // Step 2: Upsert MetaObject (create or update)
    const upsert = await admin.graphql(
        `#graphql
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
          }`,
        {
          variables: {
            handle: {
              type: type,
              handle: handle,
            },
              metaobject: {
                "fields": fields
              }
          },
        }
      );
      

    const upsertData = await upsert.json();
    if (upsertData.data.metaobjectUpsert.userErrors.length > 0) {
      console.error("Upsert error:", upsertData.data.metaobjectUpsert.userErrors);
      return { success: false, message: "Upsert failed", error: upsertData.data.metaobjectUpsert.userErrors };
    }

    console.log("MetaObject upserted successfully:", upsertData.data.metaobjectUpsert.metaobject);
    return { success: true, data: upsertData.data.metaobjectUpsert.metaobject };

  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: "Unexpected error", error };
  }
};

export default upsertMetaObject;
