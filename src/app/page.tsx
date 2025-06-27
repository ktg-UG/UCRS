'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Calendar from '@/components/Calendar';
import BottomSheet from '@/components/BottomSheet';
import { ReservationEvent } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<ReservationEvent[]>([]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const response = await fetch('/api/reservation'); 
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setAllEvents(data);
      } catch (error) {
        console.error("Failed to fetch all events:", error);
      }
    };
    fetchAllEvents();
  }, []);

  const selectedEvents = selectedDate
    ? allEvents.filter(event => event.date === selectedDate)
    : [];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  const handleEventDelete = (deletedEventId: number) => {
    setAllEvents(prevEvents => prevEvents.filter(event => event.id !== deletedEventId));
    setSelectedDate(null);
  };

  // 新規予約ページへ遷移するハンドラ
  const handleNewReservation = () => {
    router.push('/reserve/new');
  };

  return (
    <>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 2 }}>
        Unite Court Reserve
      </Typography>

      <Calendar 
        events={allEvents} 
        onDateSelect={handleDateSelect} 
      />

      {/* --- ▼ここから追加 ▼ --- */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleNewReservation}
        >
          新規予約を作成
        </Button>
      </Box>
      {/* --- ▲ここまで追加 ▲ --- */}

      <BottomSheet 
        date={selectedDate} 
        events={selectedEvents}
        onClose={() => setSelectedDate(null)} 
        onDelete={handleEventDelete}
      />
    </>
  );
}