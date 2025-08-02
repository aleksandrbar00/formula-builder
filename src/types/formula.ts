export interface Attribute {
  id: string;
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  description?: string;
}

export type MathOperator = '+' | '-' | '*' | '/' | '**' | '%';
export type LogicalOperator = 'AND' | 'OR' | 'NOT' | 'XOR' | '==' | '!=' | '>' | '<' | '>=' | '<=';
export type MathFunction = 'abs' | 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'exp' | 'floor' | 'ceil' | 'round';
export type LogicalFunction = 'IF' | 'CASE' | 'ISNULL' | 'ISNOTNULL' | 'IN' | 'BETWEEN';

export interface FormulaNode {
  id: string;
  type: 'attribute' | 'operator' | 'function' | 'value' | 'group' | 'logical_operator' | 'logical_function' | 'condition';
  value?: string | number; // Removed boolean to avoid conflicts with HTML inputs
  operator?: MathOperator;
  logicalOperator?: LogicalOperator;
  function?: MathFunction;
  logicalFunction?: LogicalFunction;
  attributeId?: string;
  children?: FormulaNode[];
  parentId?: string;
  // For logical operations
  condition?: {
    operator: LogicalOperator;
    leftOperand: string;
    rightOperand: string | number;
  };
  // Separate boolean value for logical operations
  booleanValue?: boolean;
}

export interface FormulaBuilderState {
  nodes: FormulaNode[];
  selectedNodeId?: string;
  formulaName: string;
  formulaDescription?: string;
  mode?: 'math' | 'logical' | 'mixed'; // New mode for different operation types
}

export interface FormulaBuilderProps {
  attributes: Attribute[];
  onFormulaChange: (formula: FormulaBuilderState) => void;
  initialFormula?: FormulaBuilderState;
  mode?: 'math' | 'logical' | 'mixed'; // Allow switching between modes
} 