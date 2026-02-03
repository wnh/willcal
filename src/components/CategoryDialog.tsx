import React, { useState } from 'react';
import { Category, PASTEL_COLORS } from '../db/database';

interface CategoryDialogProps {
  category?: Category; // undefined for new, defined for edit
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}

export function CategoryDialog({ category, onSave, onCancel }: CategoryDialogProps) {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || PASTEL_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), color);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>
          {category ? 'Edit Category' : 'New Category'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="Category name"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Color
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '8px',
            }}>
              {PASTEL_COLORS.map(pastelColor => (
                <button
                  key={pastelColor}
                  type="button"
                  onClick={() => setColor(pastelColor)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: pastelColor,
                    border: color === pastelColor ? '3px solid #007bff' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'border 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: name.trim() ? '#007bff' : '#ccc',
                color: 'white',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              {category ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
