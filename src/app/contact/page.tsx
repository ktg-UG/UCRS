// src/app/contact/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  IconButton,
  Box,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function ContactPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("お問い合わせ内容を入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/line/send-contact-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        alert("メッセージを送信しました。");
        setMessage("");
        router.push("/");
      } else {
        const errorData = await res.json();
        alert(`送信に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error(
        "お問い合わせメッセージの送信中にエラーが発生しました:",
        error
      );
      alert("送信中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
          お問い合わせ
        </Typography>
        <Box sx={{ width: 40 }} />
      </Stack>

      <TextField
        label="お問い合わせ内容"
        multiline
        rows={6}
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="ご意見・ご要望・不具合の報告などをご記入ください。"
        variant="outlined"
      />

      <Stack spacing={2} mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? <CircularProgress size={24} /> : "送信する"}
        </Button>
        <Button variant="outlined" onClick={() => router.back()} fullWidth>
          キャンセル
        </Button>
      </Stack>
    </Container>
  );
}
