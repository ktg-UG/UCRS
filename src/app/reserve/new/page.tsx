"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { format, getDay } from "date-fns";
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
import { ReservationEvent } from "@/types";
import { POST } from "@/app/api/reservation/route";

function ReserveNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationType, setReservationType] = useState("メンバー募集");
  
  const [reservationCreated, setReservationCreated] = useState(false);
  const [newReservation, setNewReservation] = useState<ReservationEvent | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  const [formData, setFormData] = useState<ReservationFormData>({
    date: null,
    startTime: "09:00",
    endTime: "12:00",
    maxMembers: 99,
    memberNames: [],
    purpose: "練習",
    comment: "",
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
      if (reservationType === "ボールのみ予約") {
        router.push("/");
        router.refresh();
      }else {
        setNewReservation(result);
        setReservationCreated(true);
      }
    } else {
      const error = await res.json();
      alert(`予約作成失敗: ${error.error}`);
    }
    setIsSubmitting(false);
  };
  
  const handleShareOnLine = () => {
    if (!newReservation || !formData.date) return;

    const weekdays = ["(日)", "(月)", "(火)", "(水)", "(木)", "(金)", "(土)"];
    const dayOfWeek = weekdays[getDay(formData.date)];
    const formattedDate = `${format(formData.date, "M月d日")}${dayOfWeek}`;

    // LINEに送信するメッセージを作成
    const message = `テニスの募集です！🎾\n\n` +
      `【日時】: ${formattedDate} ${formData.startTime}〜${formData.endTime}\n` +
      `【募集主】: ${formData.memberNames[0] || '未設定'}\n` +
      `【目的】: ${formData.purpose}\n\n` +
      (formData.comment ? `【コメント】: \n${formData.comment}\n\n` : '') +
      `詳細の確認や参加/編集はこちらから↓\n` +
      `${window.location.origin}/reserve/${newReservation.id}?edit=true`;

    // メッセージをURLエンコード
    const encodedMessage = encodeURIComponent(message);
    const lineUrl = `https://line.me/R/msg/text/?${encodedMessage}`;

    // LINEの共有URLを開く
    window.open(lineUrl, '_blank');
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

{reservationCreated ? (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" gutterBottom>✅ 予約が完了しました</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            ボタンを押して、LINEグループに募集内容を共有してください。
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#06C755', '&:hover': { backgroundColor: '#04A544' } }}
              size="large"
              onClick={handleShareOnLine}
            >
              LINEでグループに共有する
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              共有せずにトップへ戻る
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
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
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "この内容で予約する"
              )}
            </Button>
            <Button fullWidth variant="outlined" onClick={() => router.back()}>
              キャンセル
            </Button>
          </Stack>
        </>
      )}
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
