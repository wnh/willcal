// In-page replacement for the desktop build's always-on-top notification.html
// popup window. Same copy and layout, rendered as a modal over the calendar.

import React from 'react';
import { CalendarBlock } from '../shared/types';

interface NotificationModalProps {
  block: CalendarBlock;
  /** True when a block is about to end with nothing scheduled after it. */
  isWarning: boolean;
  onClose: () => void;
}

function formatTime(value: Date): string {
  return value.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function NotificationModal({ block, isWarning, onClose }: NotificationModalProps) {
  const heading = isWarning ? 'WARNING: Block Ending With No Follow-Up' : 'Next Upcoming Block';
  const timeText = isWarning
    ? `Ends at ${formatTime(block.end)}`
    : formatTime(block.start);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
      }}
    >
      <div
        style={{
          width: '350px',
          minHeight: '150px',
          boxSizing: 'border-box',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: isWarning ? '#ffe6e6' : '#fff',
          border: `2px solid ${isWarning ? '#cc0000' : '#333'}`,
        }}
      >
        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>{heading}</p>
        <h2
          style={{
            margin: '0 0 10px 0',
            fontSize: '24px',
            fontWeight: 'bold',
            color: isWarning ? '#cc0000' : '#333',
          }}
        >
          {block.title || 'Untitled'}
        </h2>
        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>{timeText}</p>
        <button
          onClick={onClose}
          autoFocus
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
