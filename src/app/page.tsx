'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Button, Stack, Container } from '@mui/material';
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

  const handleNewReservation = () => {
    router.push('/reserve/new');
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 2 }}>
        Unite Court Reserve
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, my: 2, flexWrap: 'wrap' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: '4px', border: '1px solid #ccc' }} />
          <Typography variant="body2">プライベート</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#66bb6a', borderRadius: '4px', border: '1px solid #ccc' }} />
          <Typography variant="body2">満員</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#ffa726', borderRadius: '4px', border: '1px solid #ccc' }} />
          <Typography variant="body2">残り1人</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#ffeb3b', borderRadius: '4px', border: '1px solid #ccc' }} />
          <Typography variant="body2">空きあり</Typography>
        </Stack>
      </Box>

      <Calendar 
        events={allEvents} 
        onDateSelect={handleDateSelect} 
      />

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

      <BottomSheet 
        date={selectedDate} 
        events={selectedEvents}
        onClose={() => setSelectedDate(null)} 
        onDelete={handleEventDelete}
      />
    </Container>
  );
}