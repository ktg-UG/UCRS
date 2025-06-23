'use client';

import { useState, MouseEvent } from 'react';
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
import { ReservationEvent } from '@/types'; // ★ 1. 共通の型定義をインポート

// ★ 2. 親コンポーネントから受け取るPropsの型を定義
type Props = {
  date: string | null;
  events: ReservationEvent[]; // 表示するイベントの配列
  onClose: () => void;
  onDelete: (eventId: number) => void; // 削除イベントを親に通知する関数
};

// ★ 3. propsで `events` と `onDelete` を受け取る
export default function BottomSheet({ date, events, onClose, onDelete }: Props) {
  const router = useRouter();

  // ★ 4. 自身でデータを保持・取得していた下記のコードを完全に削除
  // const [events, setEvents] = useState<Event[]>([]);
  // useEffect(() => { ... });

  // ダイアログの表示状態と削除対象IDは、このコンポーネントが管理する
  const [openDialog, setOpenDialog] = useState(false);
  const [targetEventId, setTargetEventId] = useState<number | null>(null);

  const handleOpenDeleteDialog = (id: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // 親要素（カード全体）のクリックイベントの発火を防ぐ
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
        // ★ 5. 自身の状態を更新する代わりに、親から渡された onDelete 関数を呼び出す
        onDelete(targetEventId);
        alert('予約を取り消しました。');
      } else {
        const error = await res.json();
        alert(`削除に失敗しました: ${error.error}`);
      }
    } catch (err) {
      alert('削除処理中にエラーが発生しました。');
    } finally {
      // 処理が終わったらダイアログを閉じる
      handleCloseDialog();
    }
  };

  const handleReserve = () => {
    if (date) {
      router.push(`/reserve/new?date=${date}`);
    }
    onClose();
  };

  return (
    <>
      <Drawer anchor="bottom" open={!!date} onClose={onClose}>
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{date} の予約状況</Typography>
            <Button variant="contained" onClick={handleReserve}>
              予約する
            </Button>
            <Button onClick={onClose}>閉じる</Button>
          </Box>
          {/* ★ 6. propsで渡された `events` を元にリストを描画 */}
          {events.length > 0 ? (
            events.map((event) => (
              <Box
                key={event.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: event.memberNames.length >= event.maxMembers ? '#66bb6a' : '#ffeb3b',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  '&:hover': {
                      opacity: 0.8,
                  }
                }}
              >
                <Box sx={{ flexGrow: 1 }} onClick={() => router.push(`/reserve/${event.id}`)}>
                  <div>🕒 {event.startTime.slice(0, 5)}〜{event.endTime.slice(0, 5)}</div>
                  <div>👥 {event.memberNames.length} / {event.maxMembers} 🙍 {event.memberNames.join('・')}</div>
                </Box>
                <IconButton
                  aria-label="delete"
                  size="small"
                  onClick={(e) => handleOpenDeleteDialog(event.id, e)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          ) : (
            <Typography variant="body1" align="center" py={2}>
              この日の予約はありません
            </Typography>
          )}
        </Box>
      </Drawer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
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