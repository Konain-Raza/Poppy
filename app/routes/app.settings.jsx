import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Page,
  Card,
  Text,
  TextField,
  Select,
  BlockStack,
  InlineGrid,
  Box,
  Divider,
  DropZone,
  Thumbnail,
} from "@shopify/polaris";
import { useFetcher, useLocation, useNavigate } from "@remix-run/react";
import AutocompleteSelect from "../components/SearchFilter";
import DatePickerSingle from "../components/DatePicker";
import { countries } from "../constants/countries";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import useAppStore from "../store/Store";
import upsertMetaObject from "../services/upsertMetaobject";
import { getStagedUploadTarget } from "../services/uploadMedia";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  let formData = await request.formData();
  const payload = JSON.parse(formData.get("payload"));
  console.log("Payload", payload);
  const imageFile = payload?.fileData;
  let imageUrl = null;
  if (imageFile && imageFile.fileSize > 0) {
    const { uploadUrl, resourceUrl, parameters } = await getStagedUploadTarget(admin, imageFile);
    
    // You might still need to POST the file to uploadUrl here using fetch or axios
    // If not already handled on frontend
    if (resourceUrl) {
      imageUrl = resourceUrl;
    } else {
      console.warn("Image upload did not return resourceUrl.");
    }
  }
  
  const fields = [
    {
      key: "alertStatus",
      value: payload.alertStatus || "active",
    },
    {
      key: "title",
      value: payload.title || "New Feature Announcement",
    },
    {
      key: "description",
      value:
        payload.description ||
        "This is a description for the new feature announcement.",
    },
    {
      key: "image",
      value: imageUrl || "none", 
    },
    {
      key: "primaryText",
      value: payload.primaryText || "The feature is live and ready for use!",
    },
    {
      key: "secondaryText",
      value:
        payload.secondaryText ||
        "This feature will improve user experience by providing more flexibility.",
    },
    {
      key: "selectedProducts",
      value: JSON.stringify(
        payload.selectedProducts || ["collection1", "collection2"],
      ),
    },
    {
      key: "countryRestriction",
      value: payload.countryRestriction || "US",
    },
    {
      key: "selectedCountries",
      value: JSON.stringify(payload.selectedCountries || ["US", "CA", "GB"]),
    },
    {
      key: "scheduleStatus",
      value: payload.scheduleStatus || "scheduled",
    },
    {
      key: "startDate",
      value: payload.startDate || "2025-05-01T00:00:00Z",
    },
    {
      key: "endDate",
      value: payload.endDate || "2025-05-15T00:00:00Z",
    },
    {
      key: "showPosition",
      value: payload.showPosition || "top",
    },
    {
      key: "userOnly",
      value: String(payload.userOnly ?? true), // force to string, handles boolean too
    },
  ];

  console.log(payload.handle);
  const handle = payload.handle;


  await upsertMetaObject(admin, handle, fields);

  console.log(payload);
  return json({ success: true });
};

function AlertPopupSettingsPage() {
  const navigate = useNavigate();

  const { products, metaobject } = useAppStore();
  if (!products || !metaobject) {
    navigate("/app");
  }
  const fetcher = useFetcher();
  const location = useLocation();
  const alertData = location.state?.alert;

  const enableDisableOptions = [
    { label: "Enable", value: "enable" },
    { label: "Disable", value: "disable" },
  ];
  const [fileData, setFileData] = useState({
    filename: "",
    fileSize: 0,
    mimeType: "",
    resource: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [alertStatus, setAlertStatus] = useState("disable");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [primaryText, setPrimaryText] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [countryRestriction, setCountryRestriction] = useState("disable");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState("disable");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPosition, setShowPosition] = useState("addToCart");
  const [userOnly, setUserOnly] = useState("disable");
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    collections: "",
    countries: "",
  });

  useEffect(() => {
    if (alertData) {
      console.log("Alert", alertData);
      setAlertStatus(alertData.alertStatus || "disable");
      setTitle(alertData.title || "");
      setDescription(alertData.description || "");
      setImage(alertData.image || null);
      setPrimaryText(alertData.primaryText || "");
      setSecondaryText(alertData.secondaryText || "");
      setSelectedProducts(alertData.selectedProducts || []);
      setCountryRestriction(alertData.countryRestriction || "disable");
      setSelectedCountries(alertData.selectedCountries || []);
      setScheduleStatus(alertData.scheduleStatus || "disable");
      setStartDate(new Date(alertData.startDate) || new Date());
      setEndDate(new Date(alertData.endDate) || new Date());
      setShowPosition(alertData.showPosition || "addToCart");
      setUserOnly(alertData.userOnly || "disable");
    }
  }, [alertData]);

  useEffect(() => {
   

    const allSelected = metaobject &&
      metaobject.flatMap((obj) => obj.selectedProducts || [])
      .filter((id) => !alertData?.selectedProducts?.includes(id));

    const filteredProducts = products && products?.length>0 &&
      products.filter((product) => !allSelected.includes(product.id))
      .map((product) => ({
        label: product.title,
        value: product.id,
      }));


    setAllProducts(filteredProducts);
  }, [products, metaobject, alertData]);

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleDrop = useCallback(async (_dropFiles, acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setImage(base64);
      setFileData({
        filename: file.name, // File name with extension
        fileSize: file.size, // File size in bytes
        mimeType: file.type, // MIME type of the file
        resource: "IMAGE", // Base64 string of the file
      });
    }
  }, []);
  const resetFields = () => {
    setAlertStatus("disable");
    setTitle("");
    setDescription("");
    setImage(null);
    setPrimaryText("");
    setSecondaryText("");
    setSelectedProducts([]);
    setCountryRestriction("disable");
    setSelectedCountries([]);
    setScheduleStatus("disable");
    setStartDate(new Date());
    setEndDate(new Date());
    setShowPosition("addToCart");
    setUserOnly("disable");
    setErrors({
      title: "",
      description: "",
      collections: "",
      countries: "",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    let hasError = false;
    const newErrors = {
      title: "",
      description: "",
      collections: "",
      countries: "",
    };

    if (!title.trim()) {
      newErrors.title = "Title is required";
      hasError = true;
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
      hasError = true;
    }
    if (selectedProducts.length === 0) {
      newErrors.collections = "Select at least one product.";
      hasError = true;
    }

    if (countryRestriction === "enable" && selectedCountries.length === 0) {
      newErrors.countries = "Select at least one country";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) {
      shopify.toast.show(
        "📛 Couldn’t complete the save. Please check everything",
      );
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        handle: alertData?.handle || `alert-${(metaobject?.length || 0) + 1}`,
        fileData,
        alertStatus,
        title,
        description,
        image,
        primaryText,
        secondaryText,
        selectedProducts,
        countryRestriction,
        selectedCountries,
        scheduleStatus,
        startDate,
        endDate,
        showPosition,
        userOnly,
      };

      fetcher.submit(
        {
          metaobjectId: metaobject.id,
          payload: JSON.stringify(payload),
        },
        { method: "POST" },
      );

      shopify.toast.show("✅ All set! Popup saved without a hitch");
      navigate("/app");
    } catch (error) {
      console.error("Error in submitting form:", error);
      shopify.toast.show(
        "📛 Couldn’t complete the save. Please check everything",
      );
    } finally {
      setIsSaving(false);
      resetFields();
    }
  };

  return (
    <Page
      backAction={{ content: "Back to Dashboard", url: "/app" }}
      title="Popup Configuration"
      primaryAction={{
        content: isSaving ? "Saving..." : "Save Settings",
        onAction: handleSave,
        loading: isSaving,
        disabled: isSaving,
      }}
      divider
    >
      <Box paddingBlockEnd="1000">
        <BlockStack gap="400">
          {/* Popup Content Settings */}
          <Section
            title="Popup Content"
            description="Customize the content, layout, and buttons shown in the popup."
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label="Popup Status"
                  options={enableDisableOptions}
                  value={alertStatus}
                  onChange={setAlertStatus}
                  disabled={isSaving}
                  helpText="Enable or disable this popup on your store."
                />

                <TextField
                  label="Headline"
                  value={title}
                  onChange={setTitle}
                  maxLength={60}
                  required
                  disabled={isSaving}
                  error={errors.title}
                  helpText="A short, bold title for your popup (e.g., 'Limited Time Offer!')."
                />

                <TextField
                  label="Message"
                  maxLength={300}
                  value={description}
                  onChange={setDescription}
                  multiline
                  disabled={isSaving}
                  required
                  error={errors.description}
                  helpText="Describe the message or offer you want to show to your customers."
                />

                <TextField
                  label="Primary Button Label"
                  value={primaryText}
                  disabled={isSaving}
                  maxLength={20}
                  onChange={setPrimaryText}
                  helpText="Main call-to-action (e.g., 'Shop Now', 'Subscribe')."
                />

                <TextField
                  label="Secondary Button Label"
                  value={secondaryText}
                  disabled={isSaving}
                  maxLength={20}
                  onChange={setSecondaryText}
                  helpText="Optional secondary action (e.g., 'No thanks', 'Dismiss')."
                />

                <DropZone
                  label="Popup Image"
                  onDrop={handleDrop}
                  allowMultiple={false}
                  disabled={isSaving}
                >
                  {!image ? (
                    <DropZone.FileUpload />
                  ) : (
                    <InlineGrid align="center" alignItems="center">
                      <Thumbnail size="small" alt="Popup" source={image} />
                      <Text variant="bodyMd">Image Uploaded</Text>
                    </InlineGrid>
                  )}
                </DropZone>
              </BlockStack>
            </Card>
          </Section>

          <Divider />

          {/* Product Filter */}
          <Section
            title="Target Products"
            description="Choose which products this popup will appear on."
          >
            <Card>
              <AutocompleteSelect
                optionsData={allProducts}
                disabled={isSaving}
                label="Select Products"
                placeholder="Type to search products"
                onSelectChange={setSelectedProducts}
                error={errors.collections}
                preselectedOptions={alertData?.selectedProducts || []}
                disable={isSaving}
              />
            </Card>
          </Section>

          <Divider />

          {/* Display Position */}
          <Section
            title="Popup Trigger"
            description="Determine when the popup should appear."
          >
            <Card>
              <Select
                label="Trigger Event"
                options={[
                  { label: "On Product Visit", value: "onVisit" },
                  { label: "Checkout", value: "checkout" },
                  { label: "Add to Cart", value: "addToCart" },
                ]}
                value={showPosition}
                disabled={isSaving}
                onChange={setShowPosition}
              />
            </Card>
          </Section>

          <Divider />

          {/* Schedule */}
          <Section
            title="Schedule Popup"
            description="Set a time window for when the popup should be active."
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label="Enable Schedule"
                  disabled={isSaving}
                  options={enableDisableOptions}
                  value={scheduleStatus}
                  onChange={setScheduleStatus}
                />
                {scheduleStatus === "enable" && (
                  <InlineGrid columns={{ xs: "1fr", md: "1fr 1fr" }} gap="400">
                    <DatePickerSingle
                      label="Start Date"
                      selectedDate={startDate}
                      onDateChange={setStartDate}
                    />
                    <DatePickerSingle
                      label="End Date"
                      selectedDate={endDate}
                      onDateChange={setEndDate}
                      disableBefore={startDate}
                    />
                  </InlineGrid>
                )}
              </BlockStack>
            </Card>
          </Section>

          <Divider />

          {/* Customer Filter */}
          <Section
            title="User Visibility"
            description="Show popup only to logged-in users."
          >
            <Card>
              <Select
                label="Logged-in Only"
                options={enableDisableOptions}
                value={userOnly}
                disabled={isSaving}
                onChange={setUserOnly}
              />
            </Card>
          </Section>

          {/* Country Restriction */}
          <Section
            title="Geolocation Filter"
            description="Restrict popup visibility to specific countries."
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label="Enable Country Restriction"
                  options={enableDisableOptions}
                  value={countryRestriction}
                  disabled={isSaving}
                  onChange={setCountryRestriction}
                />
                {countryRestriction === "enable" && (
                  <AutocompleteSelect
                    optionsData={countries}
                    disable={isSaving}
                    preselectedOptions={alertData?.selectedCountries || []}
                    label="Target Countries"
                    placeholder="Search by country name"
                    error={errors.countries}
                    onSelectChange={setSelectedCountries}
                    selected={selectedCountries}
                  />
                )}
              </BlockStack>
            </Card>
          </Section>
        </BlockStack>
      </Box>
    </Page>
  );
}

const Section = ({ title, description, children }) => (
  <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
    <Box>
      <BlockStack gap="200">
        <Text as="h3" variant="headingMd">
          {title}
        </Text>
        <Text variant="bodyMd">{description}</Text>
      </BlockStack>
    </Box>
    <Box>{children}</Box>
  </InlineGrid>
);

export default AlertPopupSettingsPage;
