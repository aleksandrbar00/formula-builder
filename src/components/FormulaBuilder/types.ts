export type MathOperator = '+' | '-' | '*' | '/' | '**' | '%';
export type LogicalOperator = 'AND' | 'OR' | 'NOT' | '==' | '!=' | '>' | '<' | '>=' | '<=';
export type MathFunction = 'abs' | 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'exp' | 'floor' | 'ceil' | 'round' | 'pow' | 'min' | 'max' | 'atan2';
export type LogicalFunction = 'IF' | 'AND' | 'OR' | 'NOT' | 'ISNULL' | 'ISNOTNULL';

export interface FormulaNode {
  id: string;
  type: 'attribute' | 'operator' | 'function' | 'value' | 'group';
  parentId?: string;
  attributeId?: string;
  operator?: MathOperator | LogicalOperator;
  function?: MathFunction | LogicalFunction;
  value?: number;
  argumentIndex?: number; // For function argument groups
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
  },
  pow: { 
    arity: 2, 
    labels: ['Base', 'Exponent'], 
    description: 'Raises a number to the power of another number',
    example: 'pow(2, 3) = 8'
  },
  min: { 
    arity: 2, 
    labels: ['Number1', 'Number2'], 
    description: 'Returns the smaller of two numbers',
    example: 'min(5, 3) = 3'
  },
  max: { 
    arity: 2, 
    labels: ['Number1', 'Number2'], 
    description: 'Returns the larger of two numbers',
    example: 'max(5, 3) = 5'
  },
  atan2: { 
    arity: 2, 
    labels: ['Y', 'X'], 
    description: 'Returns the angle in radians whose tangent is the quotient of its arguments',
    example: 'atan2(1, 1) ≈ 0.785'
  },
  // Logical functions
  IF: { 
    arity: 3, 
    labels: ['Condition', 'True Value', 'False Value'], 
    description: 'Returns one value if condition is true, another if false',
    example: 'IF(Age > 18, "Adult", "Minor")'
  },
  AND: { 
    arity: 'variadic', 
    labels: ['Condition1', 'Condition2', '...'], 
    description: 'Returns true if all conditions are true',
    example: 'AND(Age > 18, Income > 50000)'
  },
  OR: { 
    arity: 'variadic', 
    labels: ['Condition1', 'Condition2', '...'], 
    description: 'Returns true if any condition is true',
    example: 'OR(VIP == true, Income > 100000)'
  },
  NOT: { 
    arity: 1, 
    labels: ['Condition'], 
    description: 'Returns the opposite of the condition',
    example: 'NOT(VIP == true)'
  },
  ISNULL: { 
    arity: 1, 
    labels: ['Value'], 
    description: 'Returns true if the value is null or empty',
    example: 'ISNULL(Email)'
  },
  ISNOTNULL: { 
    arity: 1, 
    labels: ['Value'], 
    description: 'Returns true if the value is not null or empty',
    example: 'ISNOTNULL(Email)'
  }
};

// Operator descriptions
export const OPERATOR_DESCRIPTIONS: Record<MathOperator | LogicalOperator, { description: string; example: string }> = {
  '+': { description: 'Addition', example: '5 + 3 = 8' },
  '-': { description: 'Subtraction', example: '10 - 4 = 6' },
  '*': { description: 'Multiplication', example: '6 * 7 = 42' },
  '/': { description: 'Division', example: '15 / 3 = 5' },
  '**': { description: 'Exponentiation', example: '2 ** 3 = 8' },
  '%': { description: 'Modulo (remainder)', example: '17 % 5 = 2' },
  'AND': { description: 'Logical AND', example: 'true AND false = false' },
  'OR': { description: 'Logical OR', example: 'true OR false = true' },
  'NOT': { description: 'Logical NOT', example: 'NOT true = false' },
  '==': { description: 'Equal to', example: '5 == 5 = true' },
  '!=': { description: 'Not equal to', example: '5 != 3 = true' },
  '>': { description: 'Greater than', example: '10 > 5 = true' },
  '<': { description: 'Less than', example: '3 < 7 = true' },
  '>=': { description: 'Greater than or equal', example: '5 >= 5 = true' },
  '<=': { description: 'Less than or equal', example: '4 <= 6 = true' }
};

// Constants
export const OPERATORS: MathOperator[] = ['+', '-', '*', '/', '**', '%'];
export const LOGICAL_OPERATORS: LogicalOperator[] = ['AND', 'OR', 'NOT', '==', '!=', '>', '<', '>=', '<='];
export const ALL_OPERATORS: (MathOperator | LogicalOperator)[] = [...OPERATORS, ...LOGICAL_OPERATORS];
export const FUNCTIONS: MathFunction[] = ['abs', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'floor', 'ceil', 'round', 'pow', 'min', 'max', 'atan2'];
export const LOGICAL_FUNCTIONS: LogicalFunction[] = ['IF', 'AND', 'OR', 'NOT', 'ISNULL', 'ISNOTNULL'];
export const ALL_FUNCTIONS: (MathFunction | LogicalFunction)[] = [...FUNCTIONS, ...LOGICAL_FUNCTIONS]; 