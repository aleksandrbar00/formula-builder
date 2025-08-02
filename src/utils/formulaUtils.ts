import { FormulaNode, FormulaBuilderState, Attribute } from '../types/formula';

export interface FormulaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SQLGenerationResult {
  sql: string;
  columnName: string;
  dependencies: string[];
}

/**
 * Validates a formula structure
 */
export const validateFormula = (
  formula: FormulaBuilderState,
  attributes: Attribute[]
): FormulaValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!formula.formulaName.trim()) {
    errors.push('Formula name is required');
  }

  if (formula.nodes.length === 0) {
    errors.push('Formula must contain at least one element');
  }

  // Check for orphaned nodes (nodes with parentId that doesn't exist)
  const nodeIds = new Set(formula.nodes.map(n => n.id));
  const orphanedNodes = formula.nodes.filter(n => n.parentId && !nodeIds.has(n.parentId));
  
  if (orphanedNodes.length > 0) {
    errors.push('Found orphaned nodes with invalid parent references');
  }

  // Check for incomplete nodes
  formula.nodes.forEach(node => {
    switch (node.type) {
      case 'attribute':
        if (!node.attributeId) {
          errors.push('Attribute node must have a selected attribute');
        } else {
          const attr = attributes.find(a => a.id === node.attributeId);
          if (!attr) {
            errors.push(`Selected attribute '${node.attributeId}' not found in available attributes`);
          }
        }
        break;
      
      case 'operator':
        if (!node.operator) {
          errors.push('Operator node must have a selected operator');
        }
        break;
      
      case 'function':
        if (!node.function) {
          errors.push('Function node must have a selected function');
        }
        break;
      
      case 'value':
        if (node.value === undefined || node.value === null) {
          errors.push('Value node must have a numeric value');
        }
        break;
    }
  });

  // Check for logical structure issues
  const hasAttribute = formula.nodes.some(n => n.type === 'attribute');
  const hasOperator = formula.nodes.some(n => n.type === 'operator');
  
  if (!hasAttribute) {
    errors.push('Formula must contain at least one attribute');
  }

  if (formula.nodes.length > 1 && !hasOperator) {
    warnings.push('Formula with multiple elements should include operators');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Generates SQL from a formula
 */
export const generateSQL = (
  formula: FormulaBuilderState,
  attributes: Attribute[],
  tableName: string = 'customers'
): SQLGenerationResult => {
  const dependencies: string[] = [];
  
  // Extract all attribute dependencies
  formula.nodes.forEach(node => {
    if (node.type === 'attribute' && node.attributeId) {
      const attr = attributes.find(a => a.id === node.attributeId);
      if (attr && !dependencies.includes(attr.id)) {
        dependencies.push(attr.id);
      }
    }
  });

  // Generate SQL expression
  const sqlExpression = generateSQLExpression(formula.nodes, attributes);
  
  // Create safe column name
  const columnName = formula.formulaName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    sql: `SELECT ${dependencies.join(', ')}, ${sqlExpression} as ${columnName} FROM ${tableName}`,
    columnName,
    dependencies
  };
};

/**
 * Recursively generates SQL expression from formula nodes
 */
const generateSQLExpression = (nodes: FormulaNode[], attributes: Attribute[]): string => {
  return nodes.map(node => {
    switch (node.type) {
      case 'attribute':
        const attr = attributes.find(a => a.id === node.attributeId);
        return attr ? attr.id : 'NULL';
      
      case 'operator':
        return node.operator || '';
      
      case 'function':
        if (!node.function) return 'NULL';
        return `${node.function}(${generateSQLExpression(node.children || [], attributes)})`;
      
      case 'value':
        return node.value?.toString() || '0';
      
      case 'group':
        return `(${generateSQLExpression(node.children || [], attributes)})`;
      
      default:
        return '';
    }
  }).join(' ');
};

/**
 * Generates a human-readable formula string
 */
export const generateFormulaString = (
  nodes: FormulaNode[],
  attributes: Attribute[]
): string => {
  return nodes.map(node => {
    switch (node.type) {
      case 'attribute':
        const attr = attributes.find(a => a.id === node.attributeId);
        return attr ? `{${attr.name}}` : '{attribute}';
      
      case 'operator':
        return node.operator || '';
      
      case 'function':
        if (!node.function) return 'function(...)';
        return `${node.function}(${generateFormulaString(node.children || [], attributes)})`;
      
      case 'value':
        return node.value?.toString() || '0';
      
      case 'group':
        return `(${generateFormulaString(node.children || [], attributes)})`;
      
      default:
        return '';
    }
  }).join(' ');
};

/**
 * Suggests formula improvements
 */
export const suggestImprovements = (
  formula: FormulaBuilderState,
  attributes: Attribute[]
): string[] => {
  const suggestions: string[] = [];

  // Check for common patterns
  const hasDivision = formula.nodes.some(n => n.type === 'operator' && n.operator === '/');
  const hasZeroValue = formula.nodes.some(n => n.type === 'value' && n.value === 0);

  if (hasDivision && hasZeroValue) {
    suggestions.push('Consider adding a NULLIF or CASE statement to handle division by zero');
  }

  // Check for potential performance issues
  const attributeCount = formula.nodes.filter(n => n.type === 'attribute').length;
  if (attributeCount > 5) {
    suggestions.push('Consider breaking down complex formulas into smaller, reusable components');
  }

  // Check for missing parentheses in complex expressions
  const operatorCount = formula.nodes.filter(n => n.type === 'operator').length;
  if (operatorCount > 2 && !formula.nodes.some(n => n.type === 'group')) {
    suggestions.push('Consider using parentheses to clarify operator precedence');
  }

  return suggestions;
};

/**
 * Creates a sample formula for demonstration
 */
export const createSampleFormula = (
  name: string,
  description: string,
  attributes: Attribute[]
): FormulaBuilderState => {
  if (attributes.length < 2) {
    throw new Error('Need at least 2 attributes to create a sample formula');
  }

  const [attr1, attr2] = attributes;

  return {
    formulaName: name,
    formulaDescription: description,
    nodes: [
      {
        id: `node_${Date.now()}_1`,
        type: 'attribute',
        attributeId: attr1.id
      },
      {
        id: `node_${Date.now()}_2`,
        type: 'operator',
        operator: '*'
      },
      {
        id: `node_${Date.now()}_3`,
        type: 'attribute',
        attributeId: attr2.id
      }
    ],
    selectedNodeId: undefined
  };
}; 