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
import { CombinedEvent, ReservationEvent, SpecialEvent } from "@/types";
import SpecialEventDetailDialog from "./SpecialEventDetailDialog";
import { useAdmin } from "@/contexts/AdminContext";

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
  events: CombinedEvent[];
  onClose: () => void;
  onDelete: (eventId: number, type: "reservation" | "special_event") => void;
};

export default function BottomSheet({
  date,
  events,
  onClose,
  onDelete,
}: Props) {
  const router = useRouter();
  const { isAdmin } = useAdmin();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState<CombinedEvent | null>(null);
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
    event: CombinedEvent,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setTargetEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTargetEvent(null);
  };

  const handleDeleteConfirm = async () => {
    if (!targetEvent) return;

    const isReservation = targetEvent.type === "reservation";
    const endpoint = isReservation
      ? `/api/reservation/id/${targetEvent.id}`
      : `/api/special-events/${targetEvent.id}`;

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        onDelete(
          targetEvent.id,
          isReservation ? "reservation" : "special_event"
        );
        alert("予定を削除しました。");
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

  const handleEventClick = (event: CombinedEvent) => {
    if (event.type === "reservation") {
      router.push(`/reserve/${event.id}`);
    } else if (event.type === "event") {
      setSelectedSpecialEvent(event);
      setDetailDialogOpen(true);
    }
  };

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
                  cursor: event.type !== "new_balls" ? "pointer" : "default",
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
                {/* ↓↓↓ ここから修正 ↓↓↓ */}
                {!isPastDate && (event.type === "reservation" || isAdmin) && (
                  <IconButton
                    aria-label="delete"
                    size="small"
                    onClick={(e) => handleOpenDeleteDialog(event, e)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                {/* ↑↑↑ ここまで修正 ↑↑↑ */}
              </Box>
            ))
          ) : (
            <Typography variant="body1" align="center" py={2}>
              この日の予定はありません
            </Typography>
          )}
        </Box>
      </Drawer>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>予定の削除確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この予定を本当に削除しますか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      <SpecialEventDetailDialog
        event={selectedSpecialEvent}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </>
  );
}
