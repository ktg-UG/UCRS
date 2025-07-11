"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onClose: () => void;
  onEventAdd: () => void;
};

export default function SpecialEventDialog({
  open,
  onClose,
  onEventAdd,
}: Props) {
  const [type, setType] = useState("new_balls");
  const [date, setDate] = useState<Date | null>(new Date());
  const [eventName, setEventName] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: string | null
  ) => {
    if (newType !== null) {
      setType(newType);
    }
  };

  const handleSubmit = async () => {
    if (!date) {
      setError("日付を選択してください。");
      return;
    }
    if (type === "event" && !eventName.trim()) {
      setError("イベント名を入力してください。");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const payload = {
      type,
      date: format(date, "yyyy-MM-dd"),
      eventName: type === "event" ? eventName : null,
      memo: type === "event" ? memo : null,
    };

    try {
      const res = await fetch("/api/special-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert("イベントを追加しました。");
        onEventAdd(); // 親コンポーネントに通知
        handleClose();
      } else {
        setError(data.error || "イベントの追加に失敗しました。");
      }
    } catch (err) {
      setError("通信エラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // ダイアログを閉じるときにstateをリセット
    setType("new_balls");
    setDate(new Date());
    setEventName("");
    setMemo("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>イベントを追加</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <ToggleButtonGroup
            color="primary"
            value={type}
            exclusive
            onChange={handleTypeChange}
            fullWidth
          >
            <ToggleButton value="new_balls">新球入荷</ToggleButton>
            <ToggleButton value="event">その他イベント</ToggleButton>
          </ToggleButtonGroup>

          <DatePicker
            label="日付"
            value={date}
            onChange={(newDate) => setDate(newDate)}
            format="yyyy/MM/dd"
            slotProps={{ textField: { fullWidth: true } }}
          />

          {type === "event" && (
            <>
              <TextField
                label="イベント名"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                fullWidth
              />
              <TextField
                label="メモ (任意)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>キャンセル</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          追加する
        </Button>
      </DialogActions>
    </Dialog>
  );
}
