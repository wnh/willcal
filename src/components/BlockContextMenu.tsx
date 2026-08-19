// Replacement for the desktop build's native nw.Menu right-click menu.
// Same items: Delete, a separator, then one checkable entry per category.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Category } from '../shared/types';

export interface ContextMenuTarget {
  blockId: number;
  categoryId?: number;
  x: number;
  y: number;
}

interface BlockContextMenuProps {
  target: ContextMenuTarget;
  categories: Category[];
  onDelete: (blockId: number) => void;
  onSelectCategory: (blockId: number, categoryId: number) => void;
  onClose: () => void;
}

const MENU_WIDTH = 200;

export function BlockContextMenu({
  target,
  categories,
  onDelete,
  onSelectCategory,
  onClose,
}: BlockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: target.x, top: target.y });

  // Dismiss the way a native menu does: click elsewhere, press Escape, or
  // scroll the page underneath it.
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('contextmenu', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('contextmenu', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  // Flip the menu back inside the viewport when opened near an edge.
  useLayoutEffect(() => {
    const height = menuRef.current?.offsetHeight ?? 0;
    const left = Math.max(4, Math.min(target.x, window.innerWidth - MENU_WIDTH - 4));
    const top = Math.max(4, Math.min(target.y, window.innerHeight - height - 4));
    setPosition({ left, top });
  }, [target.x, target.y, categories.length]);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: '14px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#f0f0f0';
  };
  const hoverOff = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width: MENU_WIDTH,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        padding: '4px 0',
        zIndex: 2000,
      }}
    >
      <button
        style={itemStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
        onClick={() => {
          onDelete(target.blockId);
          onClose();
        }}
      >
        Delete
      </button>

      <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 0' }} />

      {categories.map((category) => (
        <button
          key={category.id}
          style={itemStyle}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
          onClick={() => {
            onSelectCategory(target.blockId, category.id);
            onClose();
          }}
        >
          <span style={{ width: '14px', flexShrink: 0 }}>
            {target.categoryId === category.id ? '✓' : ''}
          </span>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              flexShrink: 0,
              backgroundColor: category.color,
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
}
