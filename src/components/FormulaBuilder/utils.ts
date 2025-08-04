import { FormulaNode, MathOperator, MathFunction, LogicalOperator, LogicalFunction, ALL_OPERATORS, ALL_FUNCTIONS, FUNCTION_SIGNATURES, FormulaDataType, TypeValidationResult, OPERATORS, LOGICAL_OPERATORS, FUNCTIONS, LOGICAL_FUNCTIONS } from './types';

export const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Function boundary detection for highlighting
export interface FunctionBoundary {
  functionName: string;
  startIndex: number;
  endIndex: number;
  openParenIndex: number;
  closeParenIndex: number;
  depth: number;
  id: string;
}

export const parseFunctionBoundaries = (formulaString: string): FunctionBoundary[] => {
  const boundaries: FunctionBoundary[] = [];
  const functionNames = [...FUNCTIONS, ...LOGICAL_FUNCTIONS];
  
  // Stack to track nested functions
  const stack: { name: string; startIndex: number; openParenIndex: number; depth: number; id: string }[] = [];
  let currentDepth = 0;
  
  for (let i = 0; i < formulaString.length; i++) {
    const char = formulaString[i];
    
    // Check if we're at the start of a function
    for (const funcName of functionNames) {
      if (formulaString.substring(i, i + funcName.length) === funcName) {
        // Check if next character is an opening parenthesis
        const nextParenIndex = i + funcName.length;
        if (nextParenIndex < formulaString.length && formulaString[nextParenIndex] === '(') {
          const functionId = `func_${generateId()}`;
          stack.push({
            name: funcName,
            startIndex: i,
            openParenIndex: nextParenIndex,
            depth: currentDepth,
            id: functionId
          });
          currentDepth++;
          i = nextParenIndex; // Skip to the opening parenthesis
          break;
        }
      }
    }
    
    // Check for closing parenthesis
    if (char === ')' && stack.length > 0) {
      const funcInfo = stack.pop()!;
      currentDepth--;
      
      boundaries.push({
        functionName: funcInfo.name,
        startIndex: funcInfo.startIndex,
        endIndex: i,
        openParenIndex: funcInfo.openParenIndex,
        closeParenIndex: i,
        depth: funcInfo.depth,
        id: funcInfo.id
      });
    }
  }
  
  return boundaries.sort((a, b) => a.startIndex - b.startIndex);
};

// Type inference and validation functions
export const getAttributeDataType = (attributeType: string): FormulaDataType => {
  switch (attributeType.toLowerCase()) {
    case 'number':
    case 'integer':
    case 'float':
    case 'double':
    case 'decimal':
      return 'number';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'string':
    case 'text':
    case 'varchar':
      return 'string';
    default:
      return 'unknown';
  }
};

export const getOperatorResultType = (operator: MathOperator | LogicalOperator, leftType: FormulaDataType, rightType: FormulaDataType): TypeValidationResult => {
  const errors: string[] = [];
  
  if (OPERATORS.includes(operator as MathOperator)) {
    // Mathematical operators require numeric operands
    if (leftType !== 'number' && leftType !== 'unknown') {
      errors.push(`Математический оператор '${operator}' требует числовые операнды, но левый операнд имеет тип ${leftType}`);
    }
    if (rightType !== 'number' && rightType !== 'unknown') {
      errors.push(`Математический оператор '${operator}' требует числовые операнды, но правый операнд имеет тип ${rightType}`);
    }
    
    return {
      isValid: errors.length === 0,
      dataType: 'number',
      errors
    };
  } else if (LOGICAL_OPERATORS.includes(operator as LogicalOperator)) {
    // Comparison operators can work with same types
    if (['==', '!='].includes(operator)) {
      if (leftType !== rightType && leftType !== 'unknown' && rightType !== 'unknown') {
        errors.push(`Оператор сравнения '${operator}' требует операнды одного типа, но получены ${leftType} и ${rightType}`);
      }
    } else if (['>', '<', '>=', '<='].includes(operator)) {
      // Relational operators work with numbers or strings
      if (leftType !== 'number' && leftType !== 'string' && leftType !== 'unknown') {
        errors.push(`Оператор отношения '${operator}' требует числовые или строковые операнды, но левый операнд имеет тип ${leftType}`);
      }
      if (rightType !== 'number' && rightType !== 'string' && rightType !== 'unknown') {
        errors.push(`Оператор отношения '${operator}' требует числовые или строковые операнды, но правый операнд имеет тип ${rightType}`);
      }
      if (leftType !== rightType && leftType !== 'unknown' && rightType !== 'unknown') {
        errors.push(`Оператор отношения '${operator}' требует операнды одного типа, но получены ${leftType} и ${rightType}`);
      }
    } else if (['AND', 'OR'].includes(operator)) {
      // Logical operators require boolean operands
      if (leftType !== 'boolean' && leftType !== 'unknown') {
        errors.push(`Логический оператор '${operator}' требует булевы операнды, но левый операнд имеет тип ${leftType}`);
      }
      if (rightType !== 'boolean' && rightType !== 'unknown') {
        errors.push(`Логический оператор '${operator}' требует булевы операнды, но правый операнд имеет тип ${rightType}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      dataType: 'boolean',
      errors
    };
  }
  
  return {
    isValid: false,
    dataType: 'unknown',
    errors: [`Неизвестный оператор: ${operator}`]
  };
};

export const getFunctionResultType = (functionName: MathFunction | LogicalFunction, argumentTypes: FormulaDataType[]): TypeValidationResult => {
  const errors: string[] = [];
  
  if (FUNCTIONS.includes(functionName as MathFunction)) {
    // Mathematical functions require numeric arguments and return numbers
    argumentTypes.forEach((argType, index) => {
      if (argType !== 'number' && argType !== 'unknown') {
        errors.push(`Математическая функция '${functionName}' требует числовые аргументы, но аргумент ${index + 1} имеет тип ${argType}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      dataType: 'number',
      errors
    };
  } else if (LOGICAL_FUNCTIONS.includes(functionName as LogicalFunction)) {
    // Handle specific logical functions
    switch (functionName) {
      case 'IF':
        if (argumentTypes.length >= 1 && argumentTypes[0] !== 'boolean' && argumentTypes[0] !== 'unknown') {
          errors.push(`Функция IF требует булево условие в качестве первого аргумента, но получен ${argumentTypes[0]}`);
        }
        // IF function returns the type of its true/false values (we'll assume they should match)
        if (argumentTypes.length >= 3) {
          const trueType = argumentTypes[1];
          const falseType = argumentTypes[2];
          if (trueType !== falseType && trueType !== 'unknown' && falseType !== 'unknown') {
            errors.push(`Функция IF требует, чтобы значения истины и лжи были одного типа, но получены ${trueType} и ${falseType}`);
          }
          return {
            isValid: errors.length === 0,
            dataType: trueType !== 'unknown' ? trueType : falseType,
            errors
          };
        }
        break;
      
      case 'AND':
      case 'OR':
        argumentTypes.forEach((argType, index) => {
          if (argType !== 'boolean' && argType !== 'unknown') {
            errors.push(`Функция ${functionName} требует булевы аргументы, но аргумент ${index + 1} имеет тип ${argType}`);
          }
        });
        break;
      
      case 'NOT':
        if (argumentTypes.length >= 1 && argumentTypes[0] !== 'boolean' && argumentTypes[0] !== 'unknown') {
          errors.push(`Функция NOT требует булев аргумент, но получен ${argumentTypes[0]}`);
        }
        break;
      
      case 'ISNULL':
      case 'ISNOTNULL':
        // These functions can accept any type and return boolean
        break;
    }
    
    return {
      isValid: errors.length === 0,
      dataType: 'boolean',
      errors
    };
  }
  
  return {
    isValid: false,
    dataType: 'unknown',
    errors: [`Неизвестная функция: ${functionName}`]
  };
};

export const inferNodeType = (
  node: FormulaNode,
  attributes: Array<{ id: string; name: string; type: string }>,
  allNodes: FormulaNode[]
): TypeValidationResult => {
  switch (node.type) {
    case 'attribute':
      if (node.attributeId) {
        const attr = attributes.find(a => a.id === node.attributeId);
        if (attr) {
          return {
            isValid: true,
            dataType: getAttributeDataType(attr.type),
            errors: []
          };
        }
      }
      return {
        isValid: false,
        dataType: 'unknown',
        errors: ['Атрибут не найден']
      };
    
    case 'value':
      return {
        isValid: true,
        dataType: 'number',
        errors: []
      };
    
    case 'operator':
      // For operators, we need to check the surrounding operands
      return {
        isValid: true,
        dataType: OPERATORS.includes(node.operator as MathOperator) ? 'number' : 'boolean',
        errors: []
      };
    
    case 'function':
      if (node.function) {
        const children = allNodes.filter(n => n.parentId === node.id);
        const argumentGroups = children
          .filter(child => child.type === 'group' && typeof child.argumentIndex === 'number')
          .sort((a, b) => (a.argumentIndex || 0) - (b.argumentIndex || 0));
        
        const argumentTypes = argumentGroups.map(group => {
          const groupChildren = allNodes.filter(n => n.parentId === group.id);
          if (groupChildren.length === 0) return 'unknown';
          
          // Evaluate the entire expression within the argument group
          const expressionResult = validateExpressionTypes(groupChildren, attributes, allNodes);
          return expressionResult.dataType;
        });
        
        return getFunctionResultType(node.function, argumentTypes);
      }
      return {
        isValid: false,
        dataType: 'unknown',
        errors: ['Функция не указана']
      };
    
    case 'group':
      const children = allNodes.filter(n => n.parentId === node.id);
      if (children.length === 0) {
        return {
          isValid: false,
          dataType: 'unknown',
          errors: ['Пустая группа']
        };
      }
      
      // Evaluate the expression within the group
      return validateExpressionTypes(children, attributes, allNodes);
    
    default:
      return {
        isValid: false,
        dataType: 'unknown',
        errors: ['Неизвестный тип узла']
      };
  }
};

export const validateExpressionTypes = (
  nodes: FormulaNode[],
  attributes: Array<{ id: string; name: string; type: string }>,
  allNodes: FormulaNode[]
): TypeValidationResult => {
  const errors: string[] = [];
  let resultType: FormulaDataType = 'unknown';
  
  if (nodes.length === 0) {
    return {
      isValid: false,
      dataType: 'unknown',
      errors: ['Пустое выражение']
    };
  }
  
  if (nodes.length === 1) {
    // Single node - just return its type
    return inferNodeType(nodes[0], attributes, allNodes);
  }
  
  // Check for consecutive operands without operators (this is invalid)
  const isOperand = (node: FormulaNode) => 
    node.type === 'attribute' || node.type === 'value' || node.type === 'function' || node.type === 'group';
  
  for (let i = 0; i < nodes.length - 1; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];
    
    if (isOperand(currentNode) && isOperand(nextNode)) {
      // Two operands in a row - missing operator
      errors.push(`Отсутствует оператор между операндами (найден ${currentNode.type} за которым следует ${nextNode.type})`);
    }
  }
  
  // Check for operators without proper operands
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    if (node.type === 'operator') {
      const leftNode = i > 0 ? nodes[i - 1] : null;
      const rightNode = i < nodes.length - 1 ? nodes[i + 1] : null;
      
      if (!leftNode || !isOperand(leftNode)) {
        errors.push(`Оператору '${node.operator}' не хватает левого операнда`);
      }
      if (!rightNode || !isOperand(rightNode)) {
        errors.push(`Оператору '${node.operator}' не хватает правого операнда`);
      }
    }
  }
  
  // If we found structural errors, return early
  if (errors.length > 0) {
    return {
      isValid: false,
      dataType: 'unknown',
      errors
    };
  }
  
  // Multiple nodes - validate operator expressions and types
  // Process operators from left to right to determine the final result type
  let currentType: FormulaDataType = 'unknown';
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    if (node.type === 'operator') {
      const leftNode = nodes[i - 1];
      const rightNode = nodes[i + 1];
      
      // Get the types of the operands
      let leftType: FormulaDataType;
      let rightType: FormulaDataType;
      
      // For the left operand, use the current accumulated type if this isn't the first operator
      if (i > 2 && currentType !== 'unknown') {
        leftType = currentType;
      } else {
        const leftResult = inferNodeType(leftNode, attributes, allNodes);
        errors.push(...leftResult.errors);
        leftType = leftResult.dataType;
      }
      
      const rightResult = inferNodeType(rightNode, attributes, allNodes);
      errors.push(...rightResult.errors);
      rightType = rightResult.dataType;
      
      if (node.operator) {
        const operatorResult = getOperatorResultType(node.operator, leftType, rightType);
        errors.push(...operatorResult.errors);
        currentType = operatorResult.dataType;
        resultType = operatorResult.dataType;
      }
    }
  }
  
  // If no operators, check if we have a single function or operand
  if (nodes.every(node => node.type !== 'operator')) {
    if (nodes.length === 1) {
      const nodeResult = inferNodeType(nodes[0], attributes, allNodes);
      return nodeResult;
    } else {
      // This case should have been caught above, but just in case
      errors.push('Multiple operands without operators');
    }
  }
  
  return {
    isValid: errors.length === 0,
    dataType: resultType,
    errors
  };
};

export const generateFormulaString = (
  nodes: FormulaNode[], 
  attributes: Array<{ id: string; name: string; type: string }>,
  allNodes?: FormulaNode[]
): string => {
  return nodes.map(node => {
    switch (node.type) {
      case 'attribute':
        const attr = attributes.find(a => a.id === node.attributeId);
        return attr ? `{${attr.name}}` : '{attribute}';
      case 'operator':
        return node.operator || '';
      case 'function':
        if (node.function && allNodes) {
          const children = allNodes.filter(n => n.parentId === node.id);
          
          // Sort argument groups by argumentIndex
          const argumentGroups = children
            .filter(child => child.type === 'group' && typeof child.argumentIndex === 'number')
            .sort((a, b) => (a.argumentIndex || 0) - (b.argumentIndex || 0));
          
          // Generate string for each argument group
          const argumentStrings = argumentGroups.map(group => {
            const groupChildren = allNodes.filter(n => n.parentId === group.id);
            return generateFormulaString(groupChildren, attributes, allNodes);
          });
          
          return `${node.function}(${argumentStrings.join(', ')})`;
        }
        return node.function ? `${node.function}(...)` : 'function(...)';
      case 'value':
        return node.value?.toString() || '0';
      case 'group':
        if (allNodes) {
          const childNodes = allNodes.filter(n => n.parentId === node.id);
          const childString = generateFormulaString(childNodes, attributes, allNodes);
          return `(${childString})`;
        }
        return '(...)';
      default:
        return '';
    }
  }).join(' ');
};

// Token types for parsing
interface Token {
  type: 'function' | 'operator' | 'attribute' | 'value' | 'paren' | 'comma';
  value: string;
  position: number;
}

// Tokenize the formula string
const tokenizeFormula = (text: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Handle parentheses
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char, position: i });
      i++;
      continue;
    }
    
    // Handle commas
    if (char === ',') {
      tokens.push({ type: 'comma', value: char, position: i });
      i++;
      continue;
    }
    
    // Handle attributes {AttributeName}
    if (char === '{') {
      let j = i + 1;
      while (j < text.length && text[j] !== '}') j++;
      if (j < text.length) {
        tokens.push({ type: 'attribute', value: text.substring(i, j + 1), position: i });
        i = j + 1;
        continue;
      }
    }
    
    // Handle numbers
    if (/\d/.test(char)) {
      let j = i;
      while (j < text.length && /[\d.]/.test(text[j])) j++;
      tokens.push({ type: 'value', value: text.substring(i, j), position: i });
      i = j;
      continue;
    }
    
    // Handle operators and functions
    let j = i;
    while (j < text.length && /[a-zA-Z_><=!+\-*/^%]/.test(text[j])) j++;
    if (j > i) {
      const word = text.substring(i, j);
      
      // Check if it's a function
      if ([...FUNCTIONS, ...LOGICAL_FUNCTIONS].includes(word as any)) {
        tokens.push({ type: 'function', value: word, position: i });
      } else if ([...OPERATORS, ...LOGICAL_OPERATORS].includes(word as any)) {
        tokens.push({ type: 'operator', value: word, position: i });
      }
      
      i = j;
      continue;
    }
    
    // Skip unknown characters
    i++;
  }
  
  return tokens;
};

// Parse tokens into FormulaNode structure
const parseTokensToNodes = (
  tokens: Token[],
  attributes: Array<{ id: string; name: string; type: string }>,
  parentId?: string
): FormulaNode[] => {
  const nodes: FormulaNode[] = [];
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (token.type === 'function') {
      // Create function node
      const functionNode: FormulaNode = {
        id: generateId(),
        type: 'function',
        function: token.value as MathFunction | LogicalFunction,
        parentId
      };
      nodes.push(functionNode);
      
      // Look for opening parenthesis
      if (i + 1 < tokens.length && tokens[i + 1].type === 'paren' && tokens[i + 1].value === '(') {
        i += 2; // Skip function name and opening paren
        
        // Parse function arguments
        let argumentIndex = 0;
        let parenCount = 1;
        let argumentStart = i;
        
        while (i < tokens.length && parenCount > 0) {
          if (tokens[i].type === 'paren') {
            if (tokens[i].value === '(') parenCount++;
            else if (tokens[i].value === ')') parenCount--;
          }
          
          // Handle argument separation by commas or end of function
          if ((tokens[i].type === 'comma' && parenCount === 1) || parenCount === 0) {
            // Create argument group
            const argumentTokens = tokens.slice(argumentStart, parenCount === 0 ? i : i);
            if (argumentTokens.length > 0) {
              const groupNode: FormulaNode = {
                id: generateId(),
                type: 'group',
                parentId: functionNode.id,
                argumentIndex
              };
              nodes.push(groupNode);
              
              // Parse argument content
              const argumentNodes = parseTokensToNodes(argumentTokens, attributes, groupNode.id);
              nodes.push(...argumentNodes);
              
              argumentIndex++;
            }
            argumentStart = i + 1;
          }
          
          if (parenCount > 0) i++;
        }
      } else {
        i++;
      }
    } else if (token.type === 'operator') {
      nodes.push({
        id: generateId(),
        type: 'operator',
        operator: token.value as MathOperator | LogicalOperator,
        parentId
      });
      i++;
    } else if (token.type === 'attribute') {
      const attrName = token.value.slice(1, -1); // Remove { }
      const attr = attributes.find(a => a.name === attrName);
      if (attr) {
        nodes.push({
          id: generateId(),
          type: 'attribute',
          attributeId: attr.id,
          parentId
        });
      }
      i++;
    } else if (token.type === 'value') {
      nodes.push({
        id: generateId(),
        type: 'value',
        value: Number(token.value),
        parentId
      });
      i++;
    } else {
      i++; // Skip unknown tokens
    }
  }
  
  return nodes;
};

export const parseTextFormula = (
  text: string, 
  attributes: Array<{ id: string; name: string; type: string }>
): FormulaNode[] => {
  if (!text.trim()) {
    return [];
  }
  
  try {
    const tokens = tokenizeFormula(text);
    const nodes = parseTokensToNodes(tokens, attributes);
    return nodes;
  } catch (error) {
    console.error('Error parsing formula:', error);
    throw new Error('Неверный синтаксис формулы');
  }
};

export const validateFormula = (
  nodes: FormulaNode[], 
  attributes: Array<{ id: string; name: string; type: string }>
): { errors: string[]; brokenConnections: {before: string, after: string}[] } => {
  const errors: string[] = [];
  const brokenConnections: {before: string, after: string}[] = [];
  const rootNodes = nodes.filter(node => !node.parentId);

  // Check for incomplete operators
  const operators = rootNodes.filter(node => node.type === 'operator');
  const operands = rootNodes.filter(node => 
    node.type === 'attribute' || node.type === 'value' || node.type === 'function' || node.type === 'group'
  );

  if (operators.length > 0 && operands.length === 0) {
    errors.push('Операторы нуждаются в операндах (атрибуты, значения или функции)');
  }

  // Check for broken connections (operands without operators between them)
  for (let i = 0; i < rootNodes.length - 1; i++) {
    const currentNode = rootNodes[i];
    const nextNode = rootNodes[i + 1];
    
    if ((currentNode.type === 'attribute' || currentNode.type === 'value' || currentNode.type === 'function' || currentNode.type === 'group') &&
        (nextNode.type === 'attribute' || nextNode.type === 'value' || nextNode.type === 'function' || nextNode.type === 'group')) {
      // Two operands in a row - missing operator
      brokenConnections.push({
        before: currentNode.id,
        after: nextNode.id
      });
      errors.push('Отсутствует оператор между операндами');
    }
  }

  // Check for incomplete functions
  nodes.forEach(node => {
    if (node.type === 'function' && node.function) {
      const sig = FUNCTION_SIGNATURES[node.function];
      if (sig && sig.arity !== 'variadic') {
        const children = nodes.filter(n => n.parentId === node.id);
        
        // Count argument groups (groups with argumentIndex)
        const argumentGroups = children.filter(child => 
          child.type === 'group' && typeof child.argumentIndex === 'number'
        );
        
        const argumentCount = argumentGroups.length;
        
        if (argumentCount !== sig.arity) {
          if (sig.arity === 1) {
            errors.push(`Функция ${node.function} требует ровно 1 аргумент`);
          } else if (sig.arity === 2) {
            errors.push(`Функция ${node.function} требует ровно 2 аргумента`);
          } else {
            errors.push(`Функция ${node.function} требует ровно ${sig.arity} аргументов`);
          }
        }
      }
    }
  });

  // Check for operators without operands
  for (let i = 0; i < rootNodes.length; i++) {
    const currentNode = rootNodes[i];
    if (currentNode.type === 'operator') {
      const hasLeftOperand = i > 0 && (rootNodes[i-1].type === 'attribute' || rootNodes[i-1].type === 'value' || rootNodes[i-1].type === 'function' || rootNodes[i-1].type === 'group');
      const hasRightOperand = i < rootNodes.length - 1 && (rootNodes[i+1].type === 'attribute' || rootNodes[i+1].type === 'value' || rootNodes[i+1].type === 'function' || rootNodes[i+1].type === 'group');
      
      if (!hasLeftOperand || !hasRightOperand) {
        errors.push(`Оператор '${currentNode.operator}' нуждается в операндах с обеих сторон`);
      }
    }
  }

  // NEW: Add comprehensive type validation
  if (rootNodes.length > 0) {
    const typeValidationResult = validateExpressionTypes(rootNodes, attributes, nodes);
    errors.push(...typeValidationResult.errors);
  }

  // Validate individual function argument types and expressions within groups
  nodes.forEach(node => {
    if (node.type === 'function' && node.function) {
      const functionTypeResult = inferNodeType(node, attributes, nodes);
      errors.push(...functionTypeResult.errors);
      
      // Also validate each argument group's expression separately
      const children = nodes.filter(n => n.parentId === node.id);
      const argumentGroups = children.filter(child => 
        child.type === 'group' && typeof child.argumentIndex === 'number'
      );
      
      argumentGroups.forEach(group => {
        const groupChildren = nodes.filter(n => n.parentId === group.id);
        if (groupChildren.length > 0) {
          const groupValidation = validateExpressionTypes(groupChildren, attributes, nodes);
          errors.push(...groupValidation.errors);
        }
      });
    }
    
    // Also validate expressions within regular groups
    if (node.type === 'group' && !node.parentId) {
      const groupChildren = nodes.filter(n => n.parentId === node.id);
      if (groupChildren.length > 0) {
        const groupValidation = validateExpressionTypes(groupChildren, attributes, nodes);
        errors.push(...groupValidation.errors);
      }
    }
  });

  return { errors, brokenConnections };
};

export const getAllowedActions = (node: FormulaNode, allNodes?: FormulaNode[]): { [key: string]: boolean } => {
  switch (node.type) {
    case 'attribute':
    case 'value':
    case 'operator':
      return {
        attribute: false,
        operator: false,
        function: false,
        value: false,
        group: false
      };

    case 'function':
      // For functions, check if they have argument groups
      if (allNodes) {
        const children = allNodes.filter(n => n.parentId === node.id);
        const hasArgumentGroups = children.some(child => 
          child.type === 'group' && typeof child.argumentIndex === 'number'
        );
        
        // If function has argument groups, hide action buttons (interactions go through groups)
        if (hasArgumentGroups) {
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };
        }
      }
      
      // If no argument groups, allow adding groups (for 1-argument functions)
      return {
        attribute: false,
        operator: false,
        function: false,
        value: false,
        group: true
      };

    case 'group':
      return {
        attribute: true,
        operator: true,
        function: true,
        value: true,
        group: true
      };

    default:
      return {
        attribute: true,
        operator: true,
        function: true,
        value: true,
        group: true
      };
  }
};

export const getRootAllowedActions = (nodes: FormulaNode[]): { [key: string]: boolean } => {
  const rootNodes = nodes.filter(node => !node.parentId);
  const hasOperators = rootNodes.some(node => node.type === 'operator');
  const hasOperands = rootNodes.some(node => 
    node.type === 'attribute' || node.type === 'value' || node.type === 'function' || node.type === 'group'
  );
  
  if (hasOperators && !hasOperands) {
    return {
      attribute: true,
      operator: false,
      function: true,
      value: true,
      group: true
    };
  }

  return {
    attribute: true,
    operator: true,
    function: true,
    value: true,
    group: true
  };
}; 