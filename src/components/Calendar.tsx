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

export default function Calendar({ events: reservationEvents, onDateSelect }: Props) {
  
  // カレンダーイベントを動的に生成
  const calendarEvents = reservationEvents.map(event => {
    // 現在の参加人数（名前の数）と募集人数を比較
    const isFullyBooked = event.memberNames.length >= event.maxMembers;
    
    // 参加人数が満員の場合（緑色）、そうでない場合（黄色）
    const eventColor = isFullyBooked ? '#66bb6a' : '#ffeb3b';

    return {
      title: `${event.startTime.slice(0, 5)}〜${event.endTime.slice(0, 5)}`,
      date: event.date,
      color: eventColor,  // 緑色または黄色
      backgroundColor: eventColor,  // 背景色
      borderColor: eventColor,  // 枠線の色
      extendedProps: event,  // イベントの詳細データを保存
    };
  });

  const handleDateClick = (arg: DateClickArg) => {
    onDateSelect(arg.dateStr);  // 日付クリック時に親コンポーネントに通知
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={jaLocale}
      events={calendarEvents}  // 作成したカレンダーイベントを渡す
      height="auto"
      dateClick={handleDateClick}  // 日付クリック時の処理
      eventDisplay="block"
      fixedWeekCount={false}  // カレンダーの週数を固定しない
    />
  );
}
