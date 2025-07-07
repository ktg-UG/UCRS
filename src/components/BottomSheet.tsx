'use client';

import { useState, MouseEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import { ReservationEvent } from '@/types';

const getReservationColor = (
  memberCount: number,
  maxMembers: number,
  purpose: string | undefined
): string => {
  if (purpose === 'プライベート') {
    return '#f44336';
  }
  const spotsLeft = maxMembers - memberCount;
  if (spotsLeft <= 0) {
    return '#66bb6a';
  }
  if (spotsLeft === 1) {
    return '#ffa726';
  }
  return '#ffeb3b';
};

type Props = {
  date: string | null;
  events: ReservationEvent[];
  onClose: () => void;
  onDelete: (eventId: number) => void;
};

export default function BottomSheet({ date, events, onClose, onDelete }: Props) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const [targetEventId, setTargetEventId] = useState<number | null>(null);

  const isPastDate = useMemo(() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    return selectedDate < today;
  }, [date]);

  const handleOpenDeleteDialog = (id: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setTargetEventId(id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTargetEventId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!targetEventId) return;
    try {
      const res = await fetch(`/api/reservation/id/${targetEventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDelete(targetEventId);
        alert('予約を取り消しました。');
      } else {
        const error = await res.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (err) {
      alert('削除処理中にエラーが発生しました。');
    } finally {
      handleCloseDialog();
    }
  };

  const handleReserve = () => {
    if (date) {
      router.push(`/reserve/new?date=${date}`);
    }
    onClose();
  };

  const sortedEvents = [...events].sort((a, b) => {
    const aTime = a.startTime.split(':').map(Number);
    const bTime = b.startTime.split(':').map(Number);
    return aTime[0] - bTime[0] || aTime[1] - bTime[1];
  });

  return (
    <>
      <Drawer anchor="bottom" open={!!date} onClose={onClose}>
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{date} の予約状況</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {!isPastDate && (
                <Button variant="contained" onClick={handleReserve}>
                  この日に予約する
                </Button>
              )}
              <Button onClick={onClose} sx={{ ml: 1 }}>閉じる</Button>
            </Box>
          </Box>
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 8px',
                  backgroundColor: getReservationColor(event.memberNames.length, event.maxMembers, event.purpose),
                  color: '#333',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                {/* ★ リンク先をWebサイト用の `/reserve/[id]` に修正 ★ */}
                <Box sx={{ flexGrow: 1 }} onClick={() => router.push(`/reserve/${event.id}`)}>
                  <div>🕒 {event.startTime.slice(0, 5)}〜{event.endTime.slice(0, 5)}</div>
                  {event.purpose !== 'プライベート' && (
                     <div>👥 {event.memberNames.length} / {event.maxMembers}人</div>
                  )}
                  <div>🙍 {event.memberNames.join('・')}</div>
                </Box>
                {!isPastDate && (
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
              この日の予約はありません
            </Typography>
          )}
        </Box>
      </Drawer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>予約の取り消し確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この予約を本当にとり消しますか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}