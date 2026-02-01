import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

declare const nw: any;

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

interface EventWrapperProps {
  event: CalendarEvent;
  children: React.ReactNode;
}

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter((e) => e.id !== eventId));
  };

  function EventWrapper({ event, children }: EventWrapperProps) {
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('Right click on event:', event);

      const menu = new nw.Menu();
      menu.append(new nw.MenuItem({
        label: 'Delete',
        click: () => {
          console.log('Delete clicked for event:', event);
          handleDeleteEvent(event.id);
        }
      }));

      menu.popup(e.clientX, e.clientY);
    };

    return (
      <div onContextMenu={handleContextMenu} style={{ height: '100%' }}>
        {children}
      </div>
    );
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: 'New Event',
      start: slotInfo.start,
      end: slotInfo.end,
    };
    setEvents([...events, newEvent]);
  };

  const handleSelectEvent = (event: CalendarEvent, e: React.SyntheticEvent) => {
    const nativeEvent = e.nativeEvent as MouseEvent;
    console.log('Event selected:', event);
    console.log('Native event:', nativeEvent);
    console.log('Button:', nativeEvent.button);

    if (nativeEvent.button === 2) {
      console.log('Right click detected!');
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="week"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        components={{
          eventWrapper: EventWrapper,
        }}
        style={{ height: '100%' }}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
