export type MathOperator = '+' | '-' | '*' | '/' | '**' | '%';
export type MathFunction = 'abs' | 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'exp' | 'floor' | 'ceil' | 'round';

export interface FormulaNode {
  id: string;
  type: 'attribute' | 'operator' | 'function' | 'value' | 'group';
  parentId?: string;
  attributeId?: string;
  operator?: MathOperator;
  function?: MathFunction;
  value?: number;
}

export interface FormulaBuilderState {
  nodes: FormulaNode[];
  selectedNodeId?: string;
  formulaName: string;
  formulaDescription: string;
}

export interface FormulaBuilderProps {
  attributes: Array<{ id: string; name: string; type: string }>;
  onFormulaChange: (formula: FormulaBuilderState) => void;
  initialFormula?: Partial<FormulaBuilderState>;
}

// Enhanced function signatures with descriptions
export const FUNCTION_SIGNATURES: Record<string, { 
  arity: number | 'variadic'; 
  labels: string[]; 
  description: string;
  example: string;
}> = {
  abs: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Returns the absolute value of a number',
    example: 'abs(-5) = 5'
  },
  sin: { 
    arity: 1, 
    labels: ['Angle (radians)'], 
    description: 'Returns the sine of an angle',
    example: 'sin(3.14) ≈ 0'
  },
  cos: { 
    arity: 1, 
    labels: ['Angle (radians)'], 
    description: 'Returns the cosine of an angle',
    example: 'cos(0) = 1'
  },
  tan: { 
    arity: 1, 
    labels: ['Angle (radians)'], 
    description: 'Returns the tangent of an angle',
    example: 'tan(0.785) ≈ 1'
  },
  sqrt: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Returns the square root of a number',
    example: 'sqrt(16) = 4'
  },
  log: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Returns the natural logarithm of a number',
    example: 'log(2.718) ≈ 1'
  },
  exp: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Returns e raised to the power of a number',
    example: 'exp(1) ≈ 2.718'
  },
  floor: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Returns the largest integer less than or equal to a number',
    example: 'floor(3.7) = 3'
  },
  ceil: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Returns the smallest integer greater than or equal to a number',
    example: 'ceil(3.2) = 4'
  },
  round: { 
    arity: 1, 
    labels: ['Number'], 
    description: 'Rounds a number to the nearest integer',
    example: 'round(3.5) = 4'
  }
};

// Operator descriptions
export const OPERATOR_DESCRIPTIONS: Record<MathOperator, { description: string; example: string }> = {
  '+': { description: 'Addition', example: '5 + 3 = 8' },
  '-': { description: 'Subtraction', example: '10 - 4 = 6' },
  '*': { description: 'Multiplication', example: '6 * 7 = 42' },
  '/': { description: 'Division', example: '15 / 3 = 5' },
  '**': { description: 'Exponentiation', example: '2 ** 3 = 8' },
  '%': { description: 'Modulo (remainder)', example: '17 % 5 = 2' }
};

// Constants
export const OPERATORS: MathOperator[] = ['+', '-', '*', '/', '**', '%'];
export const FUNCTIONS: MathFunction[] = ['abs', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'floor', 'ceil', 'round']; 