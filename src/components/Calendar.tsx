"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import jaLocale from "@fullcalendar/core/locales/ja";
import { CombinedEvent } from "@/types";

type Props = {
  events: CombinedEvent[];
  onDateSelect: (dateStr: string) => void;
};

const getEventColor = (event: CombinedEvent): string => {
  switch (event.type) {
    case "new_balls":
      return "#a5d6a7";
    case "event":
      return "#e0e0e0";
    case "reservation":
      if (event.purpose === "ボールのみ予約") return "#f44336";
      const spotsLeft = event.maxMembers - event.memberNames.length;
      if (spotsLeft <= 0) return "#4caf50";
      if (spotsLeft === 1) return "#ffa726";
      return "#ffeb3b";
    default:
      return "#e0e0e0";
  }
};

export default function Calendar({ events: allEvents, onDateSelect }: Props) {
  const calendarEvents = allEvents.map((event) => {
    const eventColor = getEventColor(event);
    let title = "";

    switch (event.type) {
      case "new_balls":
        title = "🎾新球入荷";
        break;
      case "event":
        title = `📝 ${event.eventName || "イベント"}`;
        break;
      case "reservation":
        title = `${event.startTime.slice(0, 5)}〜${event.endTime.slice(0, 5)}`;
        break;
    }

    return {
      title,
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
      />
    </>
  );
}
