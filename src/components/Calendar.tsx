'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core/index.js';
import jaLocale from '@fullcalendar/core/locales/ja';
import { ReservationEvent } from '@/types';

type Props = {
  events: ReservationEvent[];
  onDateSelect: (dateStr: string) => void;
};

export default function Calendar({ events: reservationEvents, onDateSelect }: Props) {
  
  const calendarEvents = reservationEvents.map(event => {
    const isFullyBooked = event.memberNames.length >= event.maxMembers;
    const eventColor = isFullyBooked ? '#66bb6a' : '#ffeb3b';

    return {
      title: `${event.startTime.slice(0, 5)}〜${event.endTime.slice(0, 5)}`,
      date: event.date,
      color: eventColor,
      backgroundColor: eventColor,
      borderColor: eventColor,
      extendedProps: event,
    };
  });

  // 日付のセルをクリックしたときの処理
  const handleDateClick = (arg: DateClickArg) => {
    onDateSelect(arg.dateStr);
  };

  // --- ▼ここから追加 ▼ ---
  // イベント（予約）をクリックしたときの処理
  const handleEventClick = (arg: EventClickArg) => {
    // クリックされたイベントが持つ日付情報を利用して、日付選択時の処理を呼び出す
    if (arg.event.startStr) {
      onDateSelect(arg.event.startStr);
    }
  };
  // --- ▲ここまで追加 ▲ ---
  
  return (
    <>
      <style>
        {`
          /* FullCalendarの過去の日付を薄いグレーで表示 */
          .fc-day-past {
              background-color: #f5f5f5;
          }
          
          /* 日付セルにホバーしたときのスタイル */
          .fc-daygrid-day:hover {
              background-color: #eaf6ff;
              cursor: pointer;
          }
          
          /* 今日の日付の背景色を少し変えて分かりやすくする */
          .fc-day-today {
              background-color: #fff9c4 !important;
          }

          /* --- ▼ここから追加 ▼ --- */
          /* イベント自体にカーソルを合わせたときもポインターにする */
          .fc-event {
            cursor: pointer;
          }
          /* --- ▲ここまで追加 ▲ --- */
        `}
      </style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={jaLocale}
        events={calendarEvents}
        height="auto"
        dateClick={handleDateClick}
        eventClick={handleEventClick} // イベントクリック時のハンドラを登録
        eventDisplay="block"
        fixedWeekCount={false}
      />
    </>
  );
}