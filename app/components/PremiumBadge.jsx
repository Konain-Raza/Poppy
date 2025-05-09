import { Badge, Box } from "@shopify/polaris";
import React from "react";

const PremiumBadge = () => {
  return <Box>
    <div style={{
      backgroundColor: "#FFFFD3",
      padding: "4px 10px", 
      borderRadius: '20px', 
      color: "black", 
      fontWeight:"bold",
      // border: "1px solid gray"
    }}>⭐ Pro</div>
  </Box>;
};

export default PremiumBadge;