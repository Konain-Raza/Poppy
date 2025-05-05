import React from 'react';
import { Modal, BlockStack, Banner } from '@shopify/polaris';

function BannerModal({
  open,
  onClose,
  onPrimary,
}) {
  return (
    <Modal
      open={open}
    //   onClose={onClose}
      title="Activate App Embed to Get Started"
    >
      <Modal.Section>
        <BlockStack>
          <Banner
            onDismiss={onClose}
            tone="info"
            action={{
              content: 'Enable App Embed',
              onAction: onPrimary,
            
            }}
          >
            <p>
              Turn on the app embed in your theme to show pop‑ups, warnings, and alerts on your storefront. Enable it now to continue.
            </p>
          </Banner>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

export default BannerModal;
