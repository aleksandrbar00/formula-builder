import { FormulaNode, MathOperator, MathFunction, LogicalOperator, LogicalFunction, ALL_OPERATORS, ALL_FUNCTIONS, FUNCTION_SIGNATURES } from './types';

export const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

export const parseTextFormula = (
  text: string, 
  attributes: Array<{ id: string; name: string; type: string }>
): FormulaNode[] => {
  // This is a simplified parser - in practice you'd want a more robust solution
  const tokens = text.split(/\s+/).filter(token => token.length > 0);
  const nodes: FormulaNode[] = [];
  
  tokens.forEach((token) => {
    if (ALL_OPERATORS.includes(token as MathOperator)) {
      nodes.push({
        id: generateId(),
        type: 'operator',
        operator: token as MathOperator
      });
    } else if (ALL_FUNCTIONS.includes(token as MathFunction)) {
      nodes.push({
        id: generateId(),
        type: 'function',
        function: token as MathFunction
      });
    } else if (token.startsWith('{') && token.endsWith('}')) {
      const attrName = token.slice(1, -1);
      const attr = attributes.find(a => a.name === attrName);
      if (attr) {
        nodes.push({
          id: generateId(),
          type: 'attribute',
          attributeId: attr.id
        });
      }
    } else if (!isNaN(Number(token))) {
      nodes.push({
        id: generateId(),
        type: 'value',
        value: Number(token)
      });
    }
  });
  
  return nodes;
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
    errors.push('Operators need operands (attributes, values, or functions)');
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
      errors.push('Missing operator between operands');
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
              errors.push(`${node.function} function needs exactly 1 argument`);
            } else if (sig.arity === 2) {
              errors.push(`${node.function} function needs exactly 2 arguments`);
            } else {
              errors.push(`${node.function} function needs exactly ${sig.arity} arguments`);
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
        errors.push(`Operator '${currentNode.operator}' needs operands on both sides`);
      }
    }
  }

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