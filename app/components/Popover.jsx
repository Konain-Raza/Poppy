import { Button, Popover, ActionList } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { QuestionCircleIcon } from "@shopify/polaris-icons";
export default function SupportPopover({
  jiraUrl = "https://your-jira-support-link.com",
  whatsappUrl = "https://wa.me/1234567890",
}) {
  const [popoverActive, setPopoverActive] = useState(false);

  const togglePopoverActive = useCallback(
    () => setPopoverActive((active) => !active),
    [],
  );

  const activator = (
    <Button onClick={togglePopoverActive} icon={QuestionCircleIcon} disclosure>
      Get Support
    </Button>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      <Popover
        active={popoverActive}
        activator={activator}
        autofocusTarget="above"
        onClose={togglePopoverActive}
      >
        <ActionList
          actionRole="menuitem"
          items={[
            {
            icon:"https://img.icons8.com/ios/50/whatsapp--v1.png",
              content: "Submit Ticket",
              onAction: () => {
                window.open(jiraUrl, "_blank");
                togglePopoverActive();
              },
            },
            {
              content: "WhatsApp Help",
              onAction: () => {
                window.open(whatsappUrl, "_blank");
                togglePopoverActive();
              },
            },
          ]}
        />
      </Popover>
    </div>
  );
}
