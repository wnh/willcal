import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Category } from '../db/database';
import { reorderCategories } from '../store/actions';

interface SidebarProps {
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: number) => void;
}

export function Sidebar({ onAddCategory, onEditCategory, onDeleteCategory }: SidebarProps) {
  const categories = useSelector((state: RootState) => state.categories);
  const [draggedCategory, setDraggedCategory] = React.useState<Category | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const handleDragStart = (category: Category) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();

    if (!draggedCategory || draggedCategory.id === targetCategory.id) return;

    // Reorder categories array
    const newCategories = [...categories];
    const draggedIndex = newCategories.findIndex(c => c.id === draggedCategory.id);
    const targetIndex = newCategories.findIndex(c => c.id === targetCategory.id);

    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    // Update sort order
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index,
    }));

    dispatch(reorderCategories(updatedCategories));
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleDeleteClick = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCategory(category.id);
  };

  const handleEditClick = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCategory(category);
  };

  return (
    <div style={{
      width: '250px',
      borderRight: '1px solid #ddd',
      padding: '16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Categories</h3>
        <button
          onClick={onAddCategory}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {categories.map(category => (
          <div
            key={category.id}
            draggable
            onDragStart={() => handleDragStart(category)}
            onDragOver={(e) => handleDragOver(e, category)}
            onDragEnd={handleDragEnd}
            style={{
              padding: '10px',
              marginBottom: '8px',
              borderRadius: '4px',
              backgroundColor: category.color,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.1s',
            }}
          >
            <span style={{ fontWeight: 500, color: 'white' }}>{category.name}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={(e) => handleEditClick(category, e)}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              >
                ✏️
              </button>
              <button
                onClick={(e) => handleDeleteClick(category, e)}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
