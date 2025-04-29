const convertBlobToFile = async (blobUrl, fileName) => {
  const response = await fetch(blobUrl); // Fetch the blob data
  const blob = await response.blob();   // Get the blob data
  const file = new File([blob], fileName, { type: blob.type }); // Create a File object
  return file;
};


export async function getStagedUploadTarget(admin, file) {
  try {
    console.log("🟢 Starting staged upload request for file:", file);
    // if (!file || !file.name || !file.type) {
    //   throw new Error('File must have a valid name and MIME type');
    // }
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
              filename: "comment.png",
              mimeType: "image/png",
              resource: "IMAGE", // For image upload
              httpMethod: "POST", // POST for file upload
              fileSize: "17358",
            },
          ],
        },
      },
    );

    const json = await response.json();
    console.log(
      "🟢 Raw response from stagedUploadsCreate:",
      JSON.stringify(json, null, 2),
    );

    const target = json?.data?.stagedUploadsCreate?.stagedTargets?.[0];
    const errors = json?.data?.stagedUploadsCreate?.userErrors;

    if (!target) {
      console.error("🔴 Staged upload failed:", errors);
      throw new Error(
        errors?.[0]?.message || "Failed to create staged upload target.",
      );
    }

    console.log("✅ Staged upload target generated successfully.");

    // Step 2: Upload the file to the generated URL
    const uploadUrl = target.url;
    const formData = new FormData();

    // Include the parameters from the staged upload in the form data
    target.parameters.forEach((param) => {
      formData.append(param.name, param.value);
    });

    // Attach the file to the request
    formData.append("file", file); // Assuming 'file' is a File object (e.g., from a file input)

    // Upload file to Shopify using the generated URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
    console.log(uploadUrl);
    if (!uploadResponse.ok) {
      throw new Error("File upload to Shopify failed.");
    }

    console.log("✅ File uploaded successfully to Shopify.");

    // Return the resource URL from the response
    return {
      resourceUrl: target.resourceUrl, // This URL can be used in your store
      message: "Upload and storage successful",
    };
  } catch (error) {
    console.error("🔥 Error in staged upload process:", error);
    throw new Error(
      "Error while uploading and creating file. " + error.message,
    );
  }
}
