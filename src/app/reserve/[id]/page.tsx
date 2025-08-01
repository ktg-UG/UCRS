// src/app/reserve/[id]/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { ReservationEvent } from "@/types";

function ReserveDetailPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = pathname.split("/").pop();
  const { data: session, status } = useSession();

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
    comment: "",
  });

  const [initialMemberNames, setInitialMemberNames] = useState<string[]>([]);
  const [memberEditOnly, setMemberEditOnly] = useState(false);

  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setEditMode(true);
      setMemberEditOnly(true);
    }
  }, [searchParams]);

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
          const initialData = {
            ...data,
            purpose: data.purpose || "",
            comment: data.comment || "",
            date: new Date(data.date + "T00:00:00"),
          };
          setFormData(initialData);
          setInitialMemberNames(data.memberNames); // 初期メンバーを保存
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

    // 型定義を修正
    let payload: Partial<Omit<ReservationFormData, "date">> & {
      date: string;
      memberNames: string[];
    };

    if (memberEditOnly) {
      payload = {
        date: format(formData.date, "yyyy-MM-dd"),
        memberNames: formData.memberNames,
      };
    } else {
      payload = {
        ...formData,
        date: format(formData.date, "yyyy-MM-dd"),
      };
    }

    try {
      const res = await fetch(`/api/reservation/id/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("予約を更新しました");
        setEditMode(false);
        setMemberEditOnly(false);
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
    const userId = (session?.user as any)?.id;
    if (status !== "authenticated" || !userId) {
      alert("削除するにはLINEログインが必要です。");
      signIn("line");
      return;
    }

    if (window.confirm("本当にこの募集を削除しますか？")) {
      try {
        const res = await fetch(`/api/reservation/id/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId: userId }), // ログインユーザーのIDを送信
        });

        if (res.ok) {
          alert("募集を削除しました");
          router.push("/");
          router.refresh();
        } else {
          if (res.status === 403) {
            alert("予約した本人しか削除できません。");
          } else {
            const errorData = await res.json();
            alert(`削除失敗: ${errorData.error}`);
          }
        }
      } catch (err) {
        alert("削除処理中にエラーが発生しました");
      }
    }
  };

  const handleCancel = () => {
    setFormData((prev) => ({
      ...prev,
      memberNames: initialMemberNames,
    }));
    setEditMode(false);
    setMemberEditOnly(false);
  };

  const handleBack = () => {
    router.push("/");
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
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
          {memberEditOnly ? "メンバー参加" : "募集詳細・編集"}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Stack>

      {memberEditOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          メンバーの追加・削除のみ可能です。
        </Alert>
      )}

      <ReservationForm
        formData={formData}
        setFormData={setFormData}
        reservationType={reservationType}
        setReservationType={setReservationType}
        disabled={!editMode}
        isEditMode={true}
        memberEditOnly={memberEditOnly}
      />
      <Stack spacing={2} mt={3}>
        {!editMode ? (
          <Button
            fullWidth
            variant="contained"
            onClick={() => {setEditMode(true); setMemberEditOnly(true)}}
          >
            予約内容を編集する
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
              onClick={handleCancel}
            >
              キャンセル
            </Button>
          </>
        )}
        {!memberEditOnly && (
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ mt: 1 }}
          >
            この募集を削除する
          </Button>
        )}
      </Stack>
    </Container>
  );
}

export default function ReserveDetailPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ReserveDetailPageContent />
    </Suspense>
  );
}
