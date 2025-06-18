'use client';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReservationCard from './ReservationCard';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation'; // Next.js 13+

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

export default function BottomSheet({ date, events = [], onClose }: Props) {
  const router = useRouter();

  const handleReserve = () => {
    // ボトムシートを閉じてから遷移
    onClose();
    router.push('/reserve/new');  // 予約作成ページのパスに合わせて変更
  };

  return (
    <Drawer
      anchor="bottom"
      open={!!date}
      onClose={onClose}
    >
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {date} の予約状況
          </Typography>
          <Button variant="contained" onClick={handleReserve}>
            予約する
          </Button>
          <Button onClick={onClose}>閉じる</Button>
        </Box>
        {events.length > 0 ? (
          events.map((event, idx) => (
            <ReservationCard
              key={idx}
              id={event.title}
              time={`${event.start}〜${event.end}`}
              members={event.extendedProps?.members?.length || 0}
              capacity={event.extendedProps?.maxMembers || 0}
              owner={event.extendedProps?.members?.[0] || '不明'}
            />
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
