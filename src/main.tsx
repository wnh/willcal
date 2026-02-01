import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

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

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: 'New Event',
      start: slotInfo.start,
      end: slotInfo.end,
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div style={{ height: '100vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="week"
        selectable
        onSelectSlot={handleSelectSlot}
        style={{ height: '100%' }}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
