import React, { useState } from "react";
import {
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  InlineStack,
  Text,
  Badge,
  Modal,
  Box,
} from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";

export default function AlertCard({ onDelete, alert, blur = false }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const {
    id,
    title,
    description,
    alertStatus,
    showPosition,
    scheduleStatus,
    countryRestriction,
    userOnly,
  } = alert;
  const buttonTextMap = {
    "addToCart": "Add to Cart",
    "productPage": "Product Page",
    "buynow": "Buy Now",
    "closeIntent": "Close Intent",
    "maintainance": "Maintenance",
    "sitewite": "Sitewide"
  };
  const buttonText = buttonTextMap[showPosition] || showPosition;
  const handleEdit = () => {
    navigate("/app/settings/", { state: { alert } });
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleConfirmDelete = async () => {
    await onDelete(id);
    closeModal();
  };

  const handleUpgrade = () => {
    navigate("/app/pricing"); // or any route you want
  };

  return (
    <>
      <Box paddingBlockEnd="400" position="relative">
        <div style={{ position: "relative" }}>
          {/* Overlay Upgrade Button */}
          {blur && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                pointerEvents: "auto",
              }}
            >
              <Button variant="primary" onClick={handleUpgrade}>
                Upgrade to Unlock
              </Button>
            </div>
          )}

          {/* Blurred Content */}
          <div
            style={{
              filter: blur ? "blur(4px)" : "none",
              pointerEvents: blur ? "none" : "auto",
              transition: "filter 0.3s ease",
            }}
          >
            <Card roundedAbove="sm" padding="400">
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    {title}
                  </Text>
                  <InlineStack gap="100">
                    <Badge
                      tone={alertStatus === "Active" ? "success" : "critical"}
                      progress="complete"
                    >
                      {alertStatus === "Active" ? "Active" : "Inactive"}
                    </Badge>
                    <Badge tone="info" progress="complete">
                      {buttonText}
                    </Badge>
                    {scheduleStatus === "enable" && (
                      <Badge tone="success" progress="complete">
                        Scheduled
                      </Badge>
                    )}
                    {countryRestriction === "enable" && (
                      <Badge tone="warning" progress="complete">
                        Country Locked
                      </Badge>
                    )}
                    {userOnly === "enable" && (
                      <Badge tone="info" progress="complete">
                        User-Only Access
                      </Badge>
                    )}
                  </InlineStack>
                </InlineStack>

                <Text as="p">{description}</Text>

                <InlineStack align="end">
                  <ButtonGroup>
                    <Button
                      variant="secondary"
                      tone="critical"
                      icon={DeleteIcon}
                      onClick={openModal}
                      style={{ backgroundColor: "#f44336", color: "#fff" }}
                    >
                      Delete
                    </Button>
                    <Button variant="primary" icon={EditIcon} onClick={handleEdit}>
                      Edit
                    </Button>
                  </ButtonGroup>
                </InlineStack>
              </BlockStack>
            </Card>
          </div>
        </div>
      </Box>

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Are you sure you want to delete this alert?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleConfirmDelete,
        }}
        secondaryActions={[{ content: "Cancel", onAction: closeModal }]}
      >
        <Modal.Section>
          <Text as="p">
            This action cannot be undone. Are you sure you want to delete{" "}
            <strong>{title}</strong>?
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}
