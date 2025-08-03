import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { FormulaNode, MathOperator } from './types';
import { OPERATORS } from './types';
import { generateFormulaString, parseFunctionBoundaries, FunctionBoundary } from './utils';
import styles from '../FormulaBuilder.module.css';

interface FormulaPreviewProps {
  nodes: FormulaNode[];
  attributes: Array<{ id: string; name: string; type: string }>;
  validationErrors: string[];
  brokenConnections: {before: string, after: string}[];
  showQuickFix: boolean;
  onQuickFix: (beforeId: string, afterId: string, operator: MathOperator) => void;
}

// Interactive formula renderer component
const InteractiveFormulaRenderer: React.FC<{ formulaString: string }> = ({ formulaString }) => {
  const [hoveredFunction, setHoveredFunction] = useState<string | null>(null);
  
  if (!formulaString || formulaString === 'No formula built yet') {
    return <span>{formulaString || 'No formula built yet'}</span>;
  }
  
  // Simple regex-based approach to find functions
  const functionRegex = /(\b(?:abs|sin|cos|tan|sqrt|log|exp|floor|ceil|round|pow|min|max|atan2|IF|AND|OR|NOT|ISNULL|ISNOTNULL)\s*\([^)]*\))/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let functionIndex = 0;
  
  while ((match = functionRegex.exec(formulaString)) !== null) {
    const fullMatch = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    
    // Add text before this function
    if (startIndex > lastIndex) {
      parts.push(
        <span key={`text-${functionIndex}`}>
          {formulaString.substring(lastIndex, startIndex)}
        </span>
      );
    }
    
    // Extract function name and body
    const parenIndex = fullMatch.indexOf('(');
    const functionName = fullMatch.substring(0, parenIndex).trim();
    const functionBody = fullMatch.substring(parenIndex + 1, fullMatch.length - 1);
    const functionId = `func-${functionIndex}`;
    
    const isHovered = hoveredFunction === functionId;
    
    // Add the interactive function
    parts.push(
      <span
        key={functionId}
        className={`${styles.formulaFunction} ${isHovered ? styles.formulaFunctionHighlighted : ''}`}
        onMouseEnter={() => setHoveredFunction(functionId)}
        onMouseLeave={() => setHoveredFunction(null)}
      >
        <span className={`${styles.functionName} ${isHovered ? styles.functionNameHighlighted : ''}`}>
          {functionName}
        </span>
        <span className={`${styles.functionParen} ${isHovered ? styles.functionParenHighlighted : ''}`}>
          (
        </span>
        <span className={styles.functionBody}>
          {functionBody}
        </span>
        <span className={`${styles.functionParen} ${isHovered ? styles.functionParenHighlighted : ''}`}>
          )
        </span>
      </span>
    );
    
    lastIndex = endIndex;
    functionIndex++;
  }
  
  // Add any remaining text
  if (lastIndex < formulaString.length) {
    parts.push(
      <span key="text-end">
        {formulaString.substring(lastIndex)}
      </span>
    );
  }
  
  return <span className={styles.interactiveFormula}>{parts}</span>;
};

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
        <InteractiveFormulaRenderer formulaString={formulaString} />
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