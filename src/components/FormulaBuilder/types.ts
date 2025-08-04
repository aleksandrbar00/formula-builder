export type MathOperator = '+' | '-' | '*' | '/' | '**' | '%';
export type LogicalOperator = 'AND' | 'OR' | 'NOT' | '==' | '!=' | '>' | '<' | '>=' | '<=';
export type MathFunction = 'abs' | 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'exp' | 'floor' | 'ceil' | 'round' | 'pow' | 'min' | 'max' | 'atan2';
export type LogicalFunction = 'IF' | 'AND' | 'OR' | 'NOT' | 'ISNULL' | 'ISNOTNULL';

// Type system for formula validation
export type FormulaDataType = 'number' | 'boolean' | 'string' | 'unknown';

export interface TypeValidationResult {
  isValid: boolean;
  dataType: FormulaDataType;
  errors: string[];
}

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
    labels: ['Число'], 
    description: 'Возвращает абсолютное значение числа',
    example: 'abs(-5) = 5'
  },
  sin: { 
    arity: 1, 
    labels: ['Угол (радианы)'], 
    description: 'Возвращает синус угла',
    example: 'sin(3.14) ≈ 0'
  },
  cos: { 
    arity: 1, 
    labels: ['Угол (радианы)'], 
    description: 'Возвращает косинус угла',
    example: 'cos(0) = 1'
  },
  tan: { 
    arity: 1, 
    labels: ['Угол (радианы)'], 
    description: 'Возвращает тангенс угла',
    example: 'tan(0.785) ≈ 1'
  },
  sqrt: { 
    arity: 1, 
    labels: ['Число'], 
    description: 'Возвращает квадратный корень числа',
    example: 'sqrt(16) = 4'
  },
  log: { 
    arity: 1, 
    labels: ['Число'], 
    description: 'Возвращает натуральный логарифм числа',
    example: 'log(2.718) ≈ 1'
  },
  exp: { 
    arity: 1, 
    labels: ['Число'], 
    description: 'Возвращает e в степени числа',
    example: 'exp(1) ≈ 2.718'
  },
  floor: { 
    arity: 1, 
    labels: ['Число'], 
    description: 'Возвращает наибольшее целое число, меньшее или равное данному числу',
    example: 'floor(3.7) = 3'
  },
  ceil: { 
    arity: 1, 
    labels: ['Число'], 
    description: 'Возвращает наименьшее целое число, большее или равное данному числу',
    example: 'ceil(3.2) = 4'
  },
  round: { 
    arity: 1, 
    labels: ['Число'], 
    description: 'Округляет число до ближайшего целого',
    example: 'round(3.5) = 4'
  },
  pow: { 
    arity: 2, 
    labels: ['Основание', 'Показатель'], 
    description: 'Возводит число в степень другого числа',
    example: 'pow(2, 3) = 8'
  },
  min: { 
    arity: 2, 
    labels: ['Число1', 'Число2'], 
    description: 'Возвращает меньшее из двух чисел',
    example: 'min(5, 3) = 3'
  },
  max: { 
    arity: 2, 
    labels: ['Число1', 'Число2'], 
    description: 'Возвращает большее из двух чисел',
    example: 'max(5, 3) = 5'
  },
  atan2: { 
    arity: 2, 
    labels: ['Y', 'X'], 
    description: 'Возвращает угол в радианах, тангенс которого равен частному аргументов',
    example: 'atan2(1, 1) ≈ 0.785'
  },
  // Logical functions
  IF: { 
    arity: 3, 
    labels: ['Условие', 'Значение истины', 'Значение лжи'], 
    description: 'Возвращает одно значение, если условие истинно, другое - если ложно',
    example: 'IF(Age > 18, "Adult", "Minor")'
  },
  AND: { 
    arity: 'variadic', 
    labels: ['Условие1', 'Условие2', '...'], 
    description: 'Возвращает истину, если все условия истинны',
    example: 'AND(Age > 18, Income > 50000)'
  },
  OR: { 
    arity: 'variadic', 
    labels: ['Условие1', 'Условие2', '...'], 
    description: 'Возвращает истину, если любое условие истинно',
    example: 'OR(VIP == true, Income > 100000)'
  },
  NOT: { 
    arity: 1, 
    labels: ['Условие'], 
    description: 'Возвращает противоположность условия',
    example: 'NOT(VIP == true)'
  },
  ISNULL: { 
    arity: 1, 
    labels: ['Значение'], 
    description: 'Возвращает истину, если значение пустое или null',
    example: 'ISNULL(Email)'
  },
  ISNOTNULL: { 
    arity: 1, 
    labels: ['Значение'], 
    description: 'Возвращает истину, если значение не пустое и не null',
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