"use client";

import { useState, MouseEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { CombinedEvent, ReservationEvent, SpecialEvent } from "@/types"; // 型をインポート
import SpecialEventDetailDialog from "./SpecialEventDetailDialog"; // 作成したコンポーネントをインポート

// イベントの色分けロジック (カレンダーと共通)
const getEventColor = (event: CombinedEvent): string => {
  switch (event.type) {
    case "new_balls":
      return "#a5d6a7";
    case "event":
      return "#e0e0e0";
    case "reservation":
      if (event.purpose === "ボールのみ予約") return "#f44336";
      const spotsLeft = event.maxMembers - event.memberNames.length;
      if (spotsLeft <= 0) return "#4caf50";
      if (spotsLeft === 1) return "#ffa726";
      return "#ffeb3b";
    default:
      return "#e0e0e0";
  }
};

type Props = {
  date: string | null;
  events: CombinedEvent[]; // すべてのイベントを受け取るように型を変更
  onClose: () => void;
  onDelete: (eventId: number) => void;
};

export default function BottomSheet({
  date,
  events,
  onClose,
  onDelete,
}: Props) {
  const router = useRouter();

  // 予約削除ダイアログ用のState
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetReservationId, setTargetReservationId] = useState<number | null>(
    null
  );

  // イベント詳細ダイアログ用のState
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSpecialEvent, setSelectedSpecialEvent] =
    useState<SpecialEvent | null>(null);

  const isPastDate = useMemo(() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  }, [date]);

  const handleOpenDeleteDialog = (
    id: number,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setTargetReservationId(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTargetReservationId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!targetReservationId) return;
    try {
      const res = await fetch(`/api/reservation/id/${targetReservationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(targetReservationId);
        alert("予約を取り消しました。");
      } else {
        const error = await res.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (err) {
      alert("削除処理中にエラーが発生しました。");
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleReserve = () => {
    if (date) router.push(`/reserve/new?date=${date}`);
    onClose();
  };

  // イベントをクリックした時の処理
  const handleEventClick = (event: CombinedEvent) => {
    if (event.type === "reservation") {
      router.push(`/reserve/${event.id}`);
    } else if (event.type === "event") {
      setSelectedSpecialEvent(event);
      setDetailDialogOpen(true);
    }
    // 'new_balls' はクリックしても何もしない
  };

  // イベントの並び替え（特別イベントを上、予約を時間順に）
  const sortedEvents = [...events].sort((a, b) => {
    if (a.type !== "reservation" && b.type === "reservation") return -1;
    if (a.type === "reservation" && b.type !== "reservation") return 1;
    if (a.type === "reservation" && b.type === "reservation") {
      const aTime = a.startTime.split(":").map(Number);
      const bTime = b.startTime.split(":").map(Number);
      return aTime[0] - bTime[0] || aTime[1] - bTime[1];
    }
    return 0;
  });

  return (
    <>
      <Drawer anchor="bottom" open={!!date} onClose={onClose}>
        <Box p={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">{date} の予定</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {!isPastDate && (
                <Button variant="contained" onClick={handleReserve}>
                  この日に予約する
                </Button>
              )}
              <Button onClick={onClose} sx={{ ml: 1 }}>
                閉じる
              </Button>
            </Box>
          </Box>
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <Box
                key={`${event.type}-${event.id}`}
                onClick={() => handleEventClick(event)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 8px",
                  backgroundColor: getEventColor(event),
                  color: "#333",
                  marginBottom: "8px",
                  borderRadius: "4px",
                  cursor: event.type !== "new_balls" ? "pointer" : "default", // 新球入荷はクリック不可
                  "&:hover": {
                    opacity: event.type !== "new_balls" ? 0.8 : 1,
                  },
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  {event.type === "reservation" ? (
                    <>
                      <div>
                        🕒 {event.startTime.slice(0, 5)}〜
                        {event.endTime.slice(0, 5)}
                      </div>
                      {event.purpose !== "プライベート" && (
                        <div>
                          👥 {event.memberNames.length} / {event.maxMembers}人
                        </div>
                      )}
                      <div>🙍 {event.memberNames.join("・")}</div>
                    </>
                  ) : event.type === "new_balls" ? (
                    <Typography>🎾 新球入荷</Typography>
                  ) : (
                    <Typography>📝 {event.eventName}</Typography>
                  )}
                </Box>
                {event.type === "reservation" && !isPastDate && (
                  <IconButton
                    aria-label="delete"
                    size="small"
                    onClick={(e) => handleOpenDeleteDialog(event.id, e)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body1" align="center" py={2}>
              この日の予定はありません
            </Typography>
          )}
        </Box>
      </Drawer>

      {/* 予約削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>予約の取り消し確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この予約を本当にとり消しますか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* イベント詳細ダイアログ */}
      <SpecialEventDetailDialog
        event={selectedSpecialEvent}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </>
  );
}
