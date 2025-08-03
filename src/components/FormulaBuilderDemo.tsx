import React, { useState } from 'react';
import { FormulaBuilder, FormulaBuilderProps, FormulaBuilderState } from './FormulaBuilder';
import styles from './FormulaBuilderDemo.module.css';

// Sample attributes for demonstration
const SAMPLE_ATTRIBUTES = [
  { id: 'price', name: 'Price', type: 'number', description: 'Product price' },
  { id: 'quantity', name: 'Quantity', type: 'number', description: 'Quantity sold' },
  { id: 'age', name: 'Age', type: 'number', description: 'Customer age' },
  { id: 'income', name: 'Income', type: 'number', description: 'Customer income' },
  { id: 'status', name: 'Status', type: 'string', description: 'Customer status' },
  { id: 'vip', name: 'VIP', type: 'boolean', description: 'VIP customer flag' },
  { id: 'email', name: 'Email', type: 'string', description: 'Customer email' },
  { id: 'score', name: 'Credit Score', type: 'number', description: 'Credit score' }
];

export const FormulaBuilderDemo: React.FC = () => {
  const [formulaState, setFormulaState] = useState<FormulaBuilderState>({
    nodes: [],
    selectedNodeId: undefined,
    formulaName: '',
    formulaDescription: ''
  });

  const handleFormulaChange = (formula: FormulaBuilderState) => {
    setFormulaState(formula);
    console.log('Formula changed:', formula);
  };

  return (
    <div className={styles.container}>
      <FormulaBuilder
        attributes={SAMPLE_ATTRIBUTES}
        onFormulaChange={handleFormulaChange}
        initialFormula={formulaState}
      />
    </div>
  );
}; 