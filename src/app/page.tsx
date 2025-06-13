'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Calendar from '@/components/Calendar';
import BottomSheet from '@/components/BottomSheet';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <>
    <Box sx={{ p: 2 }}>
      {/* ページタイトル */}
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        🎾Unite Court Reservation🎾
      </Typography>

      {/* カレンダー */}
      <Calendar onDateSelect={setSelectedDate} />

      {/* ボトムシート */}
      <BottomSheet date={selectedDate} onClose={() => setSelectedDate(null)} />
    </Box>
    </>
  );
}
