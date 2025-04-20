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
import {
  EditIcon,DeleteIcon
} from '@shopify/polaris-icons';
export default function AlertCard({ onDelete, alert }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const {
    id,
    handle,
    title,
    description,
    image,
    alertStatus,
    primaryText,
    secondaryText,
    selectedProducts,
    selectedCountries,
    countryRestriction,
    scheduleStatus,
    startDate,
    endDate,
    showPosition,
    userOnly,
  } = alert;

  const handleEdit = () => {
    navigate("/app/settings/", { state: { alert } });
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleConfirmDelete = async () => {
    await onDelete(id);
    closeModal();
  };

  return (
    <>
   <Box paddingBlockEnd="400">
   <Card
        roundedAbove="sm"
        padding="400"
      >
        <BlockStack gap="200">
          <InlineStack align="space-between">
            <Text
              as="h2"
              variant="headingMd"
              fontWeight="bold"
            >
              {title}
            </Text>
            <InlineStack gap="100">
              <Badge tone={alertStatus === "enable" ? "success" : "critical"} progress="complete">
                {alertStatus}
              </Badge>
             {scheduleStatus === "enable" &&  <Badge tone="success" progress="complete">
                {scheduleStatus}
              </Badge>}
            </InlineStack>
          </InlineStack>

          <Text as="p">{description}</Text>

          {/* Actions */}
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
   </Box>

      {/* 🧾 Delete Confirmation Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Are you sure you want to delete this alert?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleConfirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeModal,
          },
        ]}
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
