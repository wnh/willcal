import React, { useState, useEffect } from 'react';
import { EventFormData } from '../types';
import { format } from 'date-fns';
import './EventForm.css';

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  isEditing: boolean;
  onSubmit: (data: EventFormData) => void;
  onDelete: () => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  initialData,
  isEditing,
  onSubmit,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState(
    initialData?.start_time ? format(initialData.start_time, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState(
    initialData?.start_time ? format(initialData.start_time, 'HH:mm') : format(new Date(), 'HH:mm')
  );
  const [endDate, setEndDate] = useState(
    initialData?.end_time ? format(initialData.end_time, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [endTime, setEndTime] = useState(
    initialData?.end_time ? format(initialData.end_time, 'HH:mm') : format(new Date(), 'HH:mm')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a title for the event');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      alert('End time must be after start time');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: startDateTime,
      end_time: endDateTime,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="event-form-backdrop" onClick={handleBackdropClick}>
      <div className="event-form-modal">
        <div className="event-form-header">
          <h2>{isEditing ? 'Edit Event' : 'New Event'}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time *</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <div>
              {isEditing && (
                <button type="button" className="btn btn-danger" onClick={onDelete}>
                  Delete
                </button>
              )}
            </div>
            <div className="form-actions-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
