// src/app/reserve/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Container,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReservationForm, {
  ReservationFormData,
} from "@/components/ReservationForm";
import { ReservationEvent } from "@/types";

export default function ReserveDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").pop();

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationType, setReservationType] = useState("メンバー募集");

  const [formData, setFormData] = useState<ReservationFormData>({
    date: null,
    startTime: "09:00",
    endTime: "12:00",
    maxMembers: 1,
    memberNames: [],
    purpose: "",
    comment: "", // stateに初期値を追加
  });

  useEffect(() => {
    if (id) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/reservation/id/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "データの取得に失敗しました");
          }
          const data: ReservationEvent = await response.json();
          setReservationType(
            data.purpose === "ボールのみ予約"
              ? "ボールのみ予約"
              : "メンバー募集"
          );
          setFormData({
            ...data,
            purpose: data.purpose || "",
            comment: data.comment || "", // 取得したデータをセット
            date: new Date(data.date + "T00:00:00"),
          });
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [id]);

  const handleSave = async () => {
    if (!formData.date) return;
    setIsSubmitting(true);
    const payload = { ...formData, date: format(formData.date, "yyyy-MM-dd") };

    try {
      const res = await fetch(`/api/reservation/id/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("予約を更新しました");
        setEditMode(false);
        router.refresh(); 
      } else {
        const errorData = await res.json();
        alert(`更新失敗: ${errorData.error}`);
      }
    } catch (err) {
      alert("更新処理中にエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("本当にこの募集を削除しますか？")) {
      try {
        const res = await fetch(`/api/reservation/id/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          alert("募集を削除しました");
          router.push("/");
          router.refresh();
        } else {
          const error = await res.json();
          alert(`削除失敗: ${error.error}`);
        }
      } catch (err) {
        alert("削除処理中にエラーが発生しました");
      }
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Typography color="error" align="center" p={4}>
        エラー: {error}
      </Typography>
    );

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
          募集詳細・編集
        </Typography>
        <Box sx={{ width: 40 }} />
      </Stack>
      <ReservationForm
        formData={formData}
        setFormData={setFormData}
        reservationType={reservationType}
        setReservationType={setReservationType}
        disabled={!editMode}
        isEditMode={true}
      />
      <Stack spacing={2} mt={3}>
        {!editMode ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => setEditMode(true)}
          >
            編集する
          </Button>
        ) : (
          <>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "この内容で保存する"
              )}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={() => setEditMode(false)}
            >
              キャンセル
            </Button>
          </>
        )}
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={handleDelete}
          sx={{ mt: 1 }}
        >
          この募集を削除する
        </Button>
      </Stack>
    </Container>
  );
}