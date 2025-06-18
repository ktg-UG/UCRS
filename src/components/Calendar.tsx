'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

type Event = {
  title: string;
  date: string;
  color?: string;
};

type Props = {
  onDateSelect: (dateStr: string) => void;
};

const getRandomColor = () => {
  const colors = ['#FFD700', '#90EE90', '#FFB6C1', '#87CEEB'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function Calendar({ onDateSelect }: Props) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservation');
        const data = await response.json();

        // ここで配列かどうかを必ず判定
        if (!Array.isArray(data)) {
          console.error('APIエラー:', data.error || data);
          setEvents([]);
          return;
        }

        const calendarEvents = data.map((reservation: any) => ({
          title: `予約ID: ${reservation.id}`,
          date: reservation.date,
          color: getRandomColor(),
        }));

        setEvents(calendarEvents);
      } catch (error) {
        console.error('予約データの取得に失敗しました:', error);
        setEvents([]);
      }
    };

    fetchReservations();
  }, []);

  const handleDateClick = (arg: DateClickArg) => {
    onDateSelect(arg.dateStr);
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={jaLocale}
      events={events}
      height="auto"
      dateClick={handleDateClick}
      eventDisplay="block"
    />
  );
}
