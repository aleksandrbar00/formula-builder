import React from 'react';
import { Plus, Code, Parentheses } from 'lucide-react';
import { FormulaNode } from './types';
import styles from '../FormulaBuilder.module.css';

interface ContextMenuProps {
  show: boolean;
  x: number;
  y: number;
  position: 'before' | 'after';
  onAction: (type: FormulaNode['type']) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  show,
  x,
  y,
  position,
  onAction,
  onClose
}) => {
  if (!show) return null;

  return (
    <>
      <div 
        className={styles.contextMenu}
        style={{ left: x, top: y }}
      >
        <div className={styles.contextMenuHeader}>
          {`Insert ${position} this element:`}
        </div>
        <button
          onClick={() => onAction('attribute')}
          className={`${styles.contextMenuItem} ${styles.blue}`}
        >
          <Plus size={14} />
          Attribute
        </button>
        <button
          onClick={() => onAction('operator')}
          className={`${styles.contextMenuItem} ${styles.green}`}
        >
          <span className="text-sm font-mono">⚡</span>
          Operator
        </button>
        <button
          onClick={() => onAction('value')}
          className={`${styles.contextMenuItem} ${styles.orange}`}
        >
          <span className="text-sm">#</span>
          Value
        </button>
        <button
          onClick={() => onAction('function')}
          className={`${styles.contextMenuItem} ${styles.purple}`}
        >
          <Code size={14} />
          Function
        </button>
        <button
          onClick={() => onAction('group')}
          className={`${styles.contextMenuItem} ${styles.gray}`}
        >
          <Parentheses size={14} />
          Group
        </button>
      </div>

      {/* Click outside to close context menu */}
      <div 
        className={styles.contextMenuOverlay} 
        onClick={onClose}
      />
    </>
  );
}; 