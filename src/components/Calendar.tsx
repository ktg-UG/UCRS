'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

type Event = {
  title: string;
  date: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: {[key: string]: any};
};

type Reservation = {
  id: number;
  maxMembers?: number;
  members: string[];
};

type Props = {
  onDateSelect: (dateStr: string, events: Event[]) => void;
};

const getRandomColor = () => {
  const colors = ['#FFD700', '#90EE90', '#FFB6C1', '#87CEEB'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function Calendar({ onDateSelect }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  console.log(events)
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservation');
        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error('APIエラー:', data.error || data);
          setEvents([]);
          return;
        }
        const calendarEvents = data.map((reservation: any) => ({
          title: `予約ID: ${reservation.id}`,
          date: reservation.date,
          start: reservation.start,
          end: reservation.end,
          extendedProps: {
            maxMembers: reservation.maxMembers,
            members: reservation.members,
          },
          color: getRandomColor(),
        }));

        console.log('設定されるイベント:', JSON.stringify(calendarEvents, null, 2));
        setEvents(calendarEvents);
      } catch (error) {
        console.error('予約データの取得に失敗しました:', error);
        setEvents([]);
      }
    };

    fetchReservations();
  }, []);

  const handleDateClick = (arg: DateClickArg) => {
    const selectedDateEvents = events.filter(event => {
      console.log('比較:', {
        eventDate: event.date,
        clickedDate: arg.dateStr,
        isEqual: event.date === arg.dateStr,
        eventDateType: typeof event.date,
        clickedDateType: typeof arg.dateStr
      });
      return event.date === arg.dateStr;
    });
    onDateSelect(arg.dateStr, selectedDateEvents);
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
