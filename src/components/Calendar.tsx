'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';
import { ReservationEvent } from '@/types';

type Props = {
  events: ReservationEvent[];
  onDateSelect: (dateStr: string) => void;
};

// ★ 1. 色の配列を定義
const eventColors = ['#2196F3', '#4CAF50', '#FFC107', '#FF5722', '#9C27B0'];

export default function Calendar({ events: reservationEvents, onDateSelect }: Props) {
  
  const calendarEvents = reservationEvents.map(event => ({
    title: `${event.startTime.slice(0, 5)}〜${event.endTime.slice(0, 5)}`,
    date: event.date,
    // ★ 2. IDに基づいて色を決定的に選択する
    color: eventColors[event.id % eventColors.length],
    backgroundColor: eventColors[event.id % eventColors.length], // 背景色
    borderColor: eventColors[event.id % eventColors.length], // 枠線の色
    extendedProps: event, 
  }));

  const handleDateClick = (arg: DateClickArg) => {
    onDateSelect(arg.dateStr);
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={jaLocale}
      events={calendarEvents}
      height="auto"
      dateClick={handleDateClick}
      eventDisplay="block"
      fixedWeekCount={false}
    />
  );
}