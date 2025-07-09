"use client";

import React, { useState } from "react";
import { Box, Button, IconButton } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AdminLoginDialog from "./AdminLoginDialog";
import { useAdmin } from "@/contexts/AdminContext";

export default function AdminMenu() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isAdmin, logout } = useAdmin();

  const handleAdminClick = () => {
    if (isAdmin) {
      if (window.confirm("管理者モードを終了しますか？")) {
        logout();
      }
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 1300 }}>
        <IconButton
          onClick={handleAdminClick}
          color={isAdmin ? "primary" : "default"}
        >
          <AdminPanelSettingsIcon />
        </IconButton>
      </Box>
      {!isAdmin && (
        <AdminLoginDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </>
  );
}
