'use client';

import { useEffect, useState, MouseEvent } from 'react'; // MouseEventを追加
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton'; // 追加
import Dialog from '@mui/material/Dialog'; // 追加
import DialogActions from '@mui/material/DialogActions'; // 追加
import DialogContent from '@mui/material/DialogContent'; // 追加
import DialogContentText from '@mui/material/DialogContentText'; // 追加
import DialogTitle from '@mui/material/DialogTitle'; // 追加
import DeleteIcon from '@mui/icons-material/Delete'; // 追加
import { useRouter } from 'next/navigation';

// APIの型と合わせるため、idをnumberに変更するのが望ましい
type Event = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
};

type Event = {
  title: string;
  date: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: {
    maxMembers?: number;
    members?: string[];
  };
};

type Props = {
  date: string | null;
  events: Event[];
  onClose: () => void;
};

export default function BottomSheet({ date, onClose }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);

  // ★ 1. ダイアログの状態管理用
  const [openDialog, setOpenDialog] = useState(false);
  // ★ 2. 削除対象のイベントIDを保持
  const [targetEventId, setTargetEventId] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (date) {
        try {
          const response = await fetch(`/api/reservation/date/${date}`);
          if (!response.ok) throw new Error('Failed to fetch events');
          const data = await response.json();
          if (Array.isArray(data)) {
            setEvents(data);
          } else {
            console.error('イベントデータの形式が正しくありません', data);
          }
        } catch (error) {
          console.error('イベントの取得に失敗しました', error);
          setEvents([]); // エラー時はリストを空にする
        }
      }
    };
    fetchEvents();
  }, [date]);
  
  // ★ 3. 削除ボタンクリック時の処理
  const handleOpenDeleteDialog = (id: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // 親要素のクリックイベント（ページ遷移）が発火するのを防ぐ
    setTargetEventId(id);
    setOpenDialog(true);
  };
  
  // ★ 4. ダイアログを閉じる処理
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTargetEventId(null);
  };
  
  // ★ 5. 確定して削除を実行する処理
  const handleDeleteConfirm = async () => {
    if (!targetEventId) return;

    try {
      const res = await fetch(`/api/reservation/id/${targetEventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // 画面上から削除されたイベントを即座に消す
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== targetEventId));
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
          {events.length > 0 ? (
            events.map((event) => (
              // ★ 6. 予約カード全体をFlexboxコンテナに変更
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
                {/* ★ 7. 詳細情報部分（クリックでページ遷移） */}
                <Box sx={{ flexGrow: 1 }} onClick={() => router.push(`/reserve/${event.id}`)}>
                  <div>🕒 {event.startTime.slice(0, 5)}〜{event.endTime.slice(0, 5)}</div>
                  <div>👥 {event.memberNames.length} / {event.maxMembers} 🙍 {event.memberNames.join('・')}</div>
                </Box>
                {/* ★ 8. 削除ボタン */}
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

      {/* ★ 9. 削除確認ダイアログ */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          予約の取り消し確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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