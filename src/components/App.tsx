import React, { useState, useEffect } from 'react';
import Calendar from './Calendar';
import EventForm from './EventForm';
import { getDatabase } from '../db/database';
import { CalendarEvent, BigCalendarEvent, EventFormData } from '../types';
import { dateToISO, isoToDate } from '../utils/dateHelpers';
import { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import './App.css';

const App: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<Partial<EventFormData> | undefined>();

  const db = getDatabase();

  // Load all events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    const allEvents = db.getAllEvents();
    setEvents(allEvents);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setFormInitialData({
      start_time: slotInfo.start,
      end_time: slotInfo.end,
    });
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleSelectEvent = (event: BigCalendarEvent) => {
    if (event.resource) {
      setSelectedEvent(event.resource);
      setFormInitialData({
        title: event.resource.title,
        description: event.resource.description,
        start_time: isoToDate(event.resource.start_time),
        end_time: isoToDate(event.resource.end_time),
      });
      setIsFormOpen(true);
    }
  };

  const handleEventDrop = (data: EventInteractionArgs<BigCalendarEvent>) => {
    if (data.event.resource) {
      const startDate = typeof data.start === 'string' ? new Date(data.start) : data.start;
      const endDate = typeof data.end === 'string' ? new Date(data.end) : data.end;

      db.updateEvent(data.event.resource.id, {
        start_time: dateToISO(startDate),
        end_time: dateToISO(endDate),
      });
      loadEvents();
    }
  };

  const handleEventResize = (data: EventInteractionArgs<BigCalendarEvent>) => {
    if (data.event.resource) {
      const startDate = typeof data.start === 'string' ? new Date(data.start) : data.start;
      const endDate = typeof data.end === 'string' ? new Date(data.end) : data.end;

      db.updateEvent(data.event.resource.id, {
        start_time: dateToISO(startDate),
        end_time: dateToISO(endDate),
      });
      loadEvents();
    }
  };

  const handleFormSubmit = (formData: EventFormData) => {
    if (selectedEvent) {
      // Update existing event
      db.updateEvent(selectedEvent.id, {
        title: formData.title,
        description: formData.description,
        start_time: dateToISO(formData.start_time),
        end_time: dateToISO(formData.end_time),
      });
    } else {
      // Create new event
      db.createEvent({
        title: formData.title,
        description: formData.description,
        start_time: dateToISO(formData.start_time),
        end_time: dateToISO(formData.end_time),
      });
    }
    loadEvents();
    handleFormClose();
  };

  const handleFormDelete = () => {
    if (selectedEvent) {
      db.deleteEvent(selectedEvent.id);
      loadEvents();
      handleFormClose();
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
    setFormInitialData(undefined);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>WillCal</h1>
      </header>
      <main className="app-main">
        <Calendar
          events={events}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
        />
      </main>
      {isFormOpen && (
        <EventForm
          initialData={formInitialData}
          isEditing={selectedEvent !== null}
          onSubmit={handleFormSubmit}
          onDelete={handleFormDelete}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default App;
