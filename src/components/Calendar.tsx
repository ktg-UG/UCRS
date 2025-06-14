'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

type Event = {
  title: string;
  date: string; // 'YYYY-MM-DD'形式
  color?: string;
};

const events: Event[] = [
  { title: 'ゆうじ 4/4', date: '2025-06-09', color: 'green' },
  { title: 'しゅん 2/4', date: '2025-06-11', color: 'orange' },
  { title: 'れいじ 3/4', date: '2025-06-17', color: 'blue' },
];

type Props = {
  onDateSelect: (dateStr: string) => void;
};

export default function Calendar({ onDateSelect }: Props) {
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
