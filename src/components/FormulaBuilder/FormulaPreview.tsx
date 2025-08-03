import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { FormulaNode, MathOperator } from './types';
import { OPERATORS } from './types';
import { generateFormulaString } from './utils';
import styles from '../FormulaBuilder.module.css';

interface FormulaPreviewProps {
  nodes: FormulaNode[];
  attributes: Array<{ id: string; name: string; type: string }>;
  validationErrors: string[];
  brokenConnections: {before: string, after: string}[];
  showQuickFix: boolean;
  onQuickFix: (beforeId: string, afterId: string, operator: MathOperator) => void;
}

export const FormulaPreview: React.FC<FormulaPreviewProps> = ({
  nodes,
  attributes,
  validationErrors,
  brokenConnections,
  showQuickFix,
  onQuickFix
}) => {
  const formulaString = generateFormulaString(nodes.filter(node => !node.parentId), attributes, nodes);

  return (
    <div className={styles.previewSection}>
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>Formula Preview:</h3>
        <div className={styles.previewStatus}>
          {validationErrors.length === 0 && formulaString && (
            <div className={`${styles.previewStatus} ${styles.valid}`}>
              <CheckCircle size={14} />
              <span className={styles.previewStatusText}>Valid</span>
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className={`${styles.previewStatus} ${styles.error}`}>
              <AlertCircle size={14} />
              <span className={styles.previewStatusText}>{validationErrors.length} error(s)</span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.previewCode}>
        {formulaString || 'No formula built yet'}
      </div>
      {validationErrors.length > 0 && (
        <div className={styles.previewErrors}>
          <h4 className={styles.previewErrorsTitle}>Issues found:</h4>
          <ul className={styles.previewErrorsList}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          
          {/* Quick Fix Section */}
          {showQuickFix && brokenConnections.length > 0 && (
            <div className={styles.previewQuickFix}>
              <h5 className={styles.previewQuickFixTitle}>Quick Fix:</h5>
              <div className={styles.previewQuickFixList}>
                {brokenConnections.map((connection, index) => {
                  const beforeNode = nodes.find(n => n.id === connection.before);
                  const afterNode = nodes.find(n => n.id === connection.after);
                  const beforeAttr = beforeNode?.type === 'attribute' ? attributes.find(a => a.id === beforeNode.attributeId)?.name : 'value';
                  const afterAttr = afterNode?.type === 'attribute' ? attributes.find(a => a.id === afterNode.attributeId)?.name : 'value';
                  
                  return (
                    <div key={index} className={styles.previewQuickFixItem}>
                      <span className={styles.previewQuickFixText}>
                        {beforeAttr} ? {afterAttr}
                      </span>
                      <div className={styles.previewQuickFixButtons}>
                        {OPERATORS.map(op => (
                          <button
                            key={op}
                            onClick={() => onQuickFix(connection.before, connection.after, op)}
                            className={styles.previewQuickFixButton}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 