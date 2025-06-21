'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Calendar from '@/components/Calendar';
import BottomSheet from '@/components/BottomSheet';

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

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);

  const handleDateSelect = (date: string, events: Event[]) => {
    setSelectedDate(date);
    setSelectedEvents(events);
  };

  return (
    <>
      {/* ページタイトル */}
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 0 }}>
        Unite Court Reserve
      </Typography>

      {/* カレンダー */}
      <Calendar onDateSelect={handleDateSelect} />

      {/* ボトムシート */}
      <BottomSheet 
        date={selectedDate} 
        onClose={() => setSelectedDate(null)} 
      />
    </>
  );
}
