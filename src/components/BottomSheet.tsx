'use client';

import { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReservationCard from './ReservationCard';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation'; // Next.js 13+

type Event = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
};

type Props = {
  date: string | null;
  onClose: () => void;
};

export default function BottomSheet({ date, onClose }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);  // イベントの状態

  // 日付を基にイベントを取得する
  useEffect(() => {
    const fetchEvents = async () => {
      if (date) {
        try {
          const response = await fetch(`/api/reservation/${date}`);
          const data = await response.json();

          // データの中身を確認
          console.log("取得したイベントデータ:", data);

          // データが配列なら状態にセット
          if (Array.isArray(data)) {
            setEvents(data);
          } else {
            console.error('イベントデータの形式が正しくありません', data);
          }
        } catch (error) {
          console.error('イベントの取得に失敗しました', error);
        }
      }
    };

    fetchEvents();
  }, [date]);

  const handleReserve = () => {
    if (date) {
      router.push(`/reserve/new?date=${date}`);
    }
    onClose();
  };

  return (
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
            <Box key={event.id} style={{ padding: '8px', backgroundColor: event.memberNames.length >= event.maxMembers ? '#66bb6a' : '#ffeb3b', marginBottom: 8, borderRadius: 4 }}>
              <div>🕒 {event.startTime.slice(0, 5)}〜{event.endTime.slice(0, 5)}</div>
              <div>👥 { event.memberNames.length } / {event.maxMembers} 🙍 {event.memberNames.join('・')}</div>
            </Box>
          ))
        ) : (
          <Typography variant="body1" align="center" py={2}>
            この日の予約はありません
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
