"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { SpecialEvent } from "@/types";

type Props = {
  event: SpecialEvent | null;
  open: boolean;
  onClose: () => void;
};

export default function SpecialEventDetailDialog({
  event,
  open,
  onClose,
}: Props) {
  if (!event) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{event.eventName}</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {event.memo || "メモはありません。"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
