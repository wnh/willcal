import React, { useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { CalendarEvent, BigCalendarEvent } from '../types';
import { isoToDate } from '../utils/dateHelpers';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './Calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop<BigCalendarEvent>(BigCalendar);

interface CalendarProps {
  events: CalendarEvent[];
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent: (event: BigCalendarEvent) => void;
  onEventDrop: (data: EventInteractionArgs<BigCalendarEvent>) => void;
  onEventResize: (data: EventInteractionArgs<BigCalendarEvent>) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  onEventResize,
}) => {
  // Convert CalendarEvent[] to BigCalendarEvent[]
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: isoToDate(event.start_time),
      end: isoToDate(event.end_time),
      resource: event,
    }));
  }, [events]);

  return (
    <div className="calendar-container">
      <DragAndDropCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor={(event: BigCalendarEvent) => event.start}
        endAccessor={(event: BigCalendarEvent) => event.end}
        defaultView={Views.WEEK}
        views={[Views.WEEK, Views.DAY]}
        step={30}
        showMultiDayTimes
        defaultDate={new Date()}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        selectable
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default Calendar;
