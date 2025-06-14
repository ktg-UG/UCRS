'use client';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReservationCard from './ReservationCard';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation'; // Next.js 13+

type Props = {
  date: string | null;
  onClose: () => void;
};

const dummyData = [
  { id: '1', time: '12:30〜15:30', members: 4, capacity: 4, owner: 'ゆうじ' },
  { id: '2', time: '17:00〜18:30', members: 2, capacity: 4, owner: 'しゅん' },
];


export default function BottomSheet({ date, onClose }: Props) {
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
        {dummyData.map((item, idx) => (
          <ReservationCard key={idx} {...item} />
        ))}
      </Box>
    </Drawer>
  );
}
