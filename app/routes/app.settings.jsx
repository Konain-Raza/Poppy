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
  Modal,
  Checkbox,
  Button,
  InlineStack,
  Label,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useFetcher, useLocation, useNavigate } from "@remix-run/react";
import AutocompleteSelect from "../components/SearchFilter";
import DatePickerSingle from "../components/DatePicker";
import { countries } from "../constants/countries";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import useAppStore from "../store/Store";
import upsertMetaObject from "../services/upsertMetaobject";
import { getStagedUploadTarget } from "../services/uploadMedia";
import PremiumBadge from "../components/PremiumBadge";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin, redirect } = await authenticate.admin(request);
  let formData = await request.formData();
  const image = formData.get("image");
  console.log("Image", image);

  const payload = JSON.parse(formData.get("payload"));
  let resourceUrl = "";

  if (image && typeof image === "object" && image.size > 0) {
    const result = await getStagedUploadTarget(admin, image);
    resourceUrl = result.resourceUrl || "";
  }
  console.log("Payload", payload);
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
      value: resourceUrl || "",
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
      key: "selectedCollections",
      value: JSON.stringify(
        payload.selectedCollections || ["collection1", "collection2"],
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
      key: "selectBy",
      value: payload.selectBy || "products",
    },
    {
      key: "userOnly",
      value: String(payload.userOnly ?? true),
    },
    {
      key: "removeWatermark",
      value: String(payload.removeWatermark ?? true),
    },
  ];

  console.log("Fields", fields);
  const handle = payload.handle;

  const { metaobject } = await upsertMetaObject(admin, handle, fields);
  return json({ success: true, metaobject });
};

function AlertPopupSettingsPage() {
  // Imports and Setup

  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher();
  const { products, metaobjects, collections, plan, setMetaobjects } =
    useAppStore();
  const alertData = location.state?.alert;

  // Plan Values

  const hasProPlan =
    plan?.hasActivePayment &&
    plan?.appSubscriptions?.length > 0 &&
    plan.appSubscriptions[0]?.status === "ACTIVE" &&
    plan.appSubscriptions[0]?.name === "Pro Plan";

  const isCreatePopupDisabled = !hasProPlan && metaobjects?.length >= 2;

  if (!products || !metaobjects) navigate("/app");

  // UI State

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    collections: "",
    countries: "",
  });

  // Form Input States

  const [alertStatus, setAlertStatus] = useState("inactive");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [primaryText, setPrimaryText] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [countryRestriction, setCountryRestriction] = useState("inactive");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState("disable");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPosition, setShowPosition] = useState("addToCart");
  const [userOnly, setUserOnly] = useState("disable");
  const [selectBy, setSelectBy] = useState("products");
  const [selectedCollections, setSelectedCollections] = useState([]);

  // Dropdown Options

  const [positionOptions, setPositionOptions] = useState([
    { label: "Site Wite", value: "sitewite" },
    { label: "Buy Now", value: "buynow" },
    { label: "Add to Cart", value: "addToCart" },
    { label: "Maintainance", value: "maintainance" },
    { label: "Product Page (Pro)", value: "productPage" },
    { label: "Close Intent (Pro)", value: "closeIntent" },
  ]);
  const [allProducts, setAllProducts] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
  const enableDisableOptions = [
    { label: "Enable", value: "enable" },
    { label: "Disable", value: "disable" },
  ];
  const activeInactiveOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "inactive" },
  ];

  // useEffect – Guard if popup creation is disabled

  useEffect(() => {
    if (!alertData && isCreatePopupDisabled) {
      shopify.toast.show(
        "🚫 No alert data and creation is disabled. Upgrade the plan to create more...",
      );
      navigate("/app");
    }
  }, [alertData, isCreatePopupDisabled, navigate]);

  // useEffect – Populate fields from alert data

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
      setSelectBy(alertData.selectBy || "products");
      setRemoveWatermark(alertData.removeWatermark || false);
      setSelectedCollections(alertData.selectedCollections || []);
    }
  }, [alertData]);

  // useEffect – Update products/collections/options

  useEffect(() => {
    const allSelected = metaobjects
      ?.flatMap((obj) => obj.selectedProducts || [])
      .filter((id) => !alertData?.selectedProducts?.includes(id));

    const filteredProducts =
      products?.length > 0
        ? products
            .filter((product) => !allSelected.includes(product.id))
            .map((product) => ({
              label: product.title,
              value: product.id,
            }))
        : [];

    const filteredCollections =
      collections?.length > 0
        ? collections.map((collection) => ({
            label: collection.title,
            value: collection.id,
          }))
        : [];

    const metaobjectPositions = metaobjects?.map((obj) => obj.showPosition);
    const filteredOptions = positionOptions.filter((option) => {
      if (alertData?.showPosition === option.value) return true;
      return (
        !["sitewite", "maintainance", "closeIntent"].includes(option.value) ||
        !metaobjectPositions.includes(option.value)
      );
    });

    setPositionOptions(filteredOptions);
    setAllProducts(filteredProducts);
    setAllCollections(filteredCollections);
  }, [products, metaobjects, alertData]);

  // useEffect – Handle fetcher update
  useEffect(() => {
    if (fetcher.state === "submitting") {
      setIsSaving(true); // start loading
    }

    if (fetcher.state === "idle" && fetcher.data?.metaobject) {
      const flattenMetaobject = (obj) => {
        const flat = { id: obj.id };
        for (const field of obj.fields) {
          flat[field.key] = field.value;
        }
        return flat;
      };

      setIsSaving(false); // stop loading
      shopify.toast.show("New Pop Created");
      navigate("/app", {
        state: {
          updatedMetaobject: flattenMetaobject(fetcher.data.metaobject),
        },
      });
    }
  }, [fetcher.state, fetcher.data]);

  // Callback – File Drop

  const handleDrop = useCallback((_dropFiles, acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) setImage(file);
  }, []);

  // Handler – Reset Fields

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

  // Handler – Pro Feature Access

  const handleProFeature = (callback) => {
    if (!hasProPlan) {
      setShowUpgradeModal(true);
    } else {
      callback();
    }
  };

  // Handler – Save

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
        handle: alertData?.handle || `alert-${(metaobjects?.length || 0) + 1}`,
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
        selectedCollections,
        selectBy,
        removeWatermark,
        userOnly,
      };

      const formData = new FormData();
      formData.append("image", image);
      formData.append("payload", JSON.stringify(payload));

      fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
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
                  options={activeInactiveOptions}
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
                  multiline={true}
                  disabled={isSaving}
                  maxHeight={3}
                  required
                  error={errors.description}
                  helpText="Describe the message or offer you want to show to your customers."
                />
                {(showPosition != "maintainance" ||
                  showPosition != "sitewite") && (
                  <>
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
                  </>
                )}
                {image ? (
                  <InlineStack align="start" blockAlign="center" gap="300">
                    <Thumbnail
                      size="large"
                      alt="Popup"
                      source={
                        typeof image === "string"
                          ? image
                          : image instanceof File
                            ? URL.createObjectURL(image)
                            : ""
                      }
                      transparent
                    />
                    <Box>
                      <Button
                        onClick={() => setImage(null)}
                        destructive
                        icon={DeleteIcon}
                        variant="primary"
                        tone="critical"
                      ></Button>
                    </Box>
                  </InlineStack>
                ) : (
                  <DropZone
                    label="Popup Image"
                    onDrop={handleDrop}
                    allowMultiple={false}
                    disabled={isSaving}
                  >
                    <DropZone.FileUpload />
                  </DropZone>
                )}
              </BlockStack>
            </Card>
          </Section>

          <Divider />

          <Section
            title="Targeting Rules"
            description=" Choose when and where your pop-up should appear, and target specific products or collections."
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label="Show Popup When"
                  options={positionOptions}
                  value={showPosition}
                  disabled={isSaving}
                  onChange={(value) => {
                    if (
                      (value === "closeIntent" || value === "productPage") &&
                      !hasProPlan
                    ) {
                      setShowUpgradeModal(true);
                    } else {
                      setShowPosition(value);
                    }
                  }}
                />

                {/* Show Select By and Autocomplete only if not Site Wide */}
                {showPosition !== "sitewite" &&
                  showPosition !== "maintainance" &&
                  showPosition !== "closeIntent" && (
                    <>
                      <Select
                        label="Target By"
                        options={[
                          { label: "Products", value: "products" },
                          { label: "Collections", value: "collections" },
                        ]}
                        value={selectBy}
                        disabled={isSaving}
                        onChange={(value) => setSelectBy(value)}
                      />

                      {selectBy === "products" ? (
                        <AutocompleteSelect
                          optionsData={allProducts}
                          disabled={isSaving}
                          label="Select Products"
                          placeholder="Type to search products"
                          onSelectChange={(selected) => {
                            setSelectedProducts(selected); // Set selected products
                            setSelectedCollections([]); // Clear selected collections
                          }}
                          error={errors.products}
                          preselectedOptions={selectedProducts || []}
                          disable={isSaving}
                        />
                      ) : (
                        <AutocompleteSelect
                          optionsData={allCollections}
                          disabled={isSaving}
                          label="Select Collections"
                          placeholder="Type to search collections"
                          onSelectChange={(selected) => {
                            setSelectedCollections(selected); // Set selected collections
                            setSelectedProducts([]); // Clear selected products
                          }}
                          error={errors.collections}
                          preselectedOptions={
                            selectedCollections || []
                          }
                          disable={isSaving}
                        />
                      )}
                    </>
                  )}
              </BlockStack>
            </Card>
          </Section>

          <Divider />
          <Section
            title="Branding Options"
            description=" Enable or remove the “Powered by Poppy” watermark from your pop-up."
          >
            <Card>
              <BlockStack gap="400">
              <Box>
                  <InlineStack align="space-between">
                    <Label>Set Display Time</Label>
                    <PremiumBadge />
                  </InlineStack>
                 <Box paddingBlockStart={100}>
                 <Checkbox
                  label=" Remove “Powered by Poppy” branding"
                  checked={removeWatermark == true}
                  disabled={isSaving}
                  onChange={(checked) => {
                    if (!hasProPlan) {
                      setShowUpgradeModal(true);
                    } else {
                      setRemoveWatermark(checked);
                    }
                  }}
                />
                 </Box>
                </Box>
               
              </BlockStack>
            </Card>
          </Section>
          {/* Schedule */}
          <Section
            title="Schedule Popup"
            description=" Set a specific time range for when this pop-up should be shown."
          >
            <Card>
              <BlockStack gap="400">
                <Box>
                  <InlineStack align="space-between">
                    <Label>Set Display Time</Label>
                    <PremiumBadge />
                  </InlineStack>
                 <Box paddingBlockStart={200}>
                 <Select
                    disabled={isSaving}
                    options={enableDisableOptions}
                    value={scheduleStatus}
                    onChange={(value) =>
                      handleProFeature(() => setScheduleStatus(value))
                    }
                  />
                 </Box>
                </Box>
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
            title="Audience Visibility"
            description=" Choose who sees the pop-up based on login status."
          >
            <Card>
              <Select
                label="Limit to Logged-in Users"
                options={enableDisableOptions}
                value={userOnly}
                disabled={isSaving}
                onChange={setUserOnly}
              />
            </Card>
          </Section>

          {/* Country Restriction */}
          <Section
            title="Country Targeting"
            description="Control which countries can see this pop-up."
          >
            <Card>
              <BlockStack gap="400">
                <Select
                  label="Restrict by Country"
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
      {showUpgradeModal && (
        <Modal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade to Pro"
          primaryAction={{
            content: "Upgrade Now",
            onAction: () => navigate("/app/pricing"),
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setShowUpgradeModal(false),
            },
          ]}
        >
          <Modal.Section>
            <Text>
              This feature is available only on the <strong>Pro Plan</strong>.
              Upgrade to unlock it!
            </Text>
          </Modal.Section>
        </Modal>
      )}
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
