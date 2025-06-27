'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import jaLocale from '@fullcalendar/core/locales/ja';
import { ReservationEvent } from '@/types';

type Props = {
  events: ReservationEvent[];
  onDateSelect: (dateStr: string) => void;
};

const getReservationColor = (
  memberCount: number,
  maxMembers: number,
  purpose: string | undefined
): string => {
  if (purpose === 'プライベート') {
    return '#f44336'; // 赤色
  }
  const spotsLeft = maxMembers - memberCount;
  if (spotsLeft <= 0) {
    return '#66bb6a'; // 満員 (緑)
  }
  if (spotsLeft === 1) {
    return '#ffa726'; // 残り1人 (オレンジ)
  }
  return '#ffeb3b'; // 空きあり (黄)
};

export default function Calendar({ events: reservationEvents, onDateSelect }: Props) {
  
  const calendarEvents = reservationEvents.map(event => {
    const eventColor = getReservationColor(event.memberNames.length, event.maxMembers, event.purpose);

    return {
      title: `${event.startTime.slice(0, 5)}〜${event.endTime.slice(0, 5)}`,
      date: event.date,
      color: eventColor,
      backgroundColor: eventColor,
      borderColor: eventColor,
      extendedProps: event,
    };
  });

  const handleDateClick = (arg: DateClickArg) => {
    onDateSelect(arg.dateStr);
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (arg.event.startStr) {
      onDateSelect(arg.event.startStr);
    }
  };
  
  return (
    <>
      <style>
        {`
          .fc-day-past {
              background-color: #f5f5f5;
          }
          .fc-daygrid-day:hover {
              background-color: #eaf6ff;
              cursor: pointer;
          }
          .fc-day-today {
              background-color: #fff9c4 !important;
          }
          .fc-event {
            cursor: pointer;
            color: #333 !important;
          }
        `}
      </style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={jaLocale}
        events={calendarEvents}
        height="auto"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDisplay="block"
        fixedWeekCount={false}
        // selectable={true} // この行を削除またはコメントアウトします
      />
    </>
  );
}