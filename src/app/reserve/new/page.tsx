"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { format } from "date-fns";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Container,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReservationForm, {
  ReservationFormData,
} from "@/components/ReservationForm";

function ReserveNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationType, setReservationType] = useState("メンバー募集");

  const [formData, setFormData] = useState<ReservationFormData>({
    date: null,
    startTime: "09:00",
    endTime: "12:00",
    maxMembers: 99,
    memberNames: [],
    purpose: "練習",
    comment: "",
    lineNotify: true,
  });

  useEffect(() => {
    const dateFromParams = searchParams.get("date");
    if (dateFromParams) {
      setFormData((prev) => ({
        ...prev,
        date: new Date(dateFromParams + "T00:00:00"),
      }));
    }
  }, [searchParams]);

  // ▼▼▼ ここを修正しました ▼▼▼
  useEffect(() => {
    // ログイン済みで、かつユーザー名が存在する場合のみ実行
    if (status === "authenticated" && session?.user?.name) {
      const userName = session.user.name;
      setFormData((prev) => ({
        ...prev,
        // メンバーリストの重複を防ぎつつ、先頭にログインユーザーを追加
        memberNames: [
          userName,
          ...prev.memberNames.filter((name) => name !== userName),
        ],
      }));
    }
  }, [status, session]);
  // ▲▲▲ ここまで修正 ▲▲▲

  useEffect(() => {
    if (reservationType === "ボールのみ予約") {
      setFormData((prev) => ({
        ...prev,
        maxMembers: 1,
        purpose: "ボールのみ予約",
        memberNames: prev.memberNames.slice(0, 1),
        lineNotify: false,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        maxMembers: 99,
        purpose: "練習",
      }));
    }
  }, [reservationType]);

  const handleSubmit = async () => {
    const userId = (session?.user as any)?.id;
    if (status !== "authenticated" || !userId) {
      alert("ログイン情報が取得できませんでした。再度ログインしてください。");
      signIn("line");
      return;
    }

    if (!formData.date) {
      alert("日付を選択してください。");
      return;
    }
    if (
      reservationType === "ボールのみ予約" &&
      (!formData.memberNames[0] || formData.memberNames[0].trim() === "")
    ) {
      alert("代表者名を入力してください。");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      date: format(formData.date, "yyyy-MM-dd"),
      lineUserId: userId, // セッションからLINEユーザーIDを追加
      purpose:
        reservationType === "ボールのみ予約"
          ? "ボールのみ予約"
          : formData.purpose,
      maxMembers:
        reservationType === "ボールのみ予約" ? 1 : formData.maxMembers,
      lineNotify: undefined,
    };

    const res = await fetch("/api/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const result = await res.json();
      alert("予約を作成しました");

      if (reservationType !== "ボールのみ予約" && formData.lineNotify) {
        try {
          await fetch("/api/line/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reservationDetails: {
                id: result.id,
                date: format(formData.date, "yyyy/MM/dd"),
                startTime: formData.startTime,
                endTime: formData.endTime,
                maxMembers: formData.maxMembers,
                ownerName: formData.memberNames[0] || "名無し",
                purpose: formData.purpose,
                comment: formData.comment,
              },
            }),
          });
        } catch (lineError) {
          console.error("LINE通知の送信に失敗しました:", lineError);
          alert(
            "LINE通知の送信に失敗しました。詳細はコンソールを確認してください。"
          );
        }
      }

      router.push("/");
      router.refresh();
    } else {
      const error = await res.json();
      alert(`予約作成失敗: ${error.error}`);
    }
    setIsSubmitting(false);
  };

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status !== "authenticated") {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          予約を作成するにはLINEログインが必要です。
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => signIn("line")}
        >
          LINEでログインして予約作成に進む
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          キャンセル
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
          新規コート予約
        </Typography>
        <Box sx={{ width: 40 }} />
      </Stack>

      <ReservationForm
        formData={formData}
        setFormData={setFormData}
        reservationType={reservationType}
        setReservationType={setReservationType}
      />

      <Stack spacing={2} mt={3}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.date || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "この内容で予約する"}
        </Button>
        <Button fullWidth variant="outlined" onClick={() => router.back()}>
          キャンセル
        </Button>
      </Stack>
    </Container>
  );
}

const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "80vh",
    }}
  >
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>フォームを読み込み中...</Typography>
  </Box>
);

export default function ReserveNewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReserveNewForm />
    </Suspense>
  );
}
