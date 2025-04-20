export async function getStagedUploadTarget(admin, file) {
    try {
      console.log("🟢 Starting staged upload request for file:", file);
  
      // Step 1: Create staged upload target
      const response = await admin.graphql(
        `#graphql
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            input: [
              {
                filename: file.filename,
                mimeType: file.mimeType,
                resource: "IMAGE",
                httpMethod: "POST",
                fileSize: file.fileSize?.toString(),
              },
            ],
          },
        }
      );
  
      const json = await response.json();
      console.log("🟢 Raw response from stagedUploadsCreate:", JSON.stringify(json, null, 2));
  
      const target = json?.data?.stagedUploadsCreate?.stagedTargets?.[0];
      const errors = json?.data?.stagedUploadsCreate?.userErrors;
  
      if (!target) {
        console.error("🔴 Staged upload failed:", errors);
        throw new Error(errors?.[0]?.message || "Failed to create staged upload target.");
      }
  
      console.log("✅ Staged upload target generated successfully.");
  
      // Step 2: Now, use the resourceUrl returned from the staged upload in the fileCreate mutation
      const createFileRes = await admin.graphql(
        `#graphql
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              id
              fileStatus
              alt
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            files: [
              {
                alt: file.filename || "Uploaded image",
                contentType: "IMAGE",
                filename:file.filename, 
                originalSource: target.resourceUrl,
              },
            ],
          },
        }
      );
  
      const createFileJson = await createFileRes.json();
      console.log("📎 fileCreate response:", JSON.stringify(createFileJson, null, 2));
  
      const createdFile = createFileJson?.data?.fileCreate?.files?.[0];
      const fileCreateErrors = createFileJson?.data?.fileCreate?.userErrors;
  
      if (!createdFile) {
        console.error("⚠️ File creation failed:", fileCreateErrors);
        throw new Error(fileCreateErrors?.[0]?.message || "Failed to create file in Shopify.");
      }
  
      console.log("✅ File successfully created in Shopify and available on CDN.");
  
      return {
        id: createdFile.id,
        resourceUrl: target.resourceUrl,
        fileStatus: createdFile.fileStatus,
      };
    } catch (error) {
      console.error("🔥 Error in staged upload process:", error);
      throw new Error("Error while uploading and creating file. " + error.message);
    }
  }
  