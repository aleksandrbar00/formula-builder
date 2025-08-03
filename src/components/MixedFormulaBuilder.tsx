import React, { useState, useEffect } from 'react';
import { Plus, X, Parentheses, Code, Zap, Calculator, CheckCircle, HelpCircle, Info, Lightbulb, AlertCircle } from 'lucide-react';
import { FormulaBuilderProps, FormulaNode, MathOperator, MathFunction, LogicalOperator, LogicalFunction, Attribute } from '../types/formula';
import { clsx } from 'clsx';

const OPERATORS: MathOperator[] = ['+', '-', '*', '/', '**', '%'];
const LOGICAL_OPERATORS: LogicalOperator[] = ['AND', 'OR', 'NOT', 'XOR', '==', '!=', '>', '<', '>=', '<='];
const FUNCTIONS: MathFunction[] = ['abs', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'floor', 'ceil', 'round'];
const LOGICAL_FUNCTIONS: LogicalFunction[] = ['IF', 'CASE', 'ISNULL', 'ISNOTNULL', 'IN', 'BETWEEN'];

// Enhanced descriptions for mixed operations
const MIXED_OPERATOR_DESCRIPTIONS: Record<MathOperator | LogicalOperator, { 
  description: string; 
  example: string; 
  usage: string;
  type: 'math' | 'logical';
}> = {
  // Math operators
  '+': { description: 'Addition', example: '5 + 3 = 8', usage: 'Use for mathematical addition', type: 'math' },
  '-': { description: 'Subtraction', example: '10 - 4 = 6', usage: 'Use for mathematical subtraction', type: 'math' },
  '*': { description: 'Multiplication', example: '6 * 7 = 42', usage: 'Use for mathematical multiplication', type: 'math' },
  '/': { description: 'Division', example: '15 / 3 = 5', usage: 'Use for mathematical division', type: 'math' },
  '**': { description: 'Exponentiation', example: '2 ** 3 = 8', usage: 'Use for raising to a power', type: 'math' },
  '%': { description: 'Modulo (remainder)', example: '17 % 5 = 2', usage: 'Use to get remainder after division', type: 'math' },
  
  // Logical operators
  'AND': { description: 'Both conditions must be true', example: 'A AND B = true only if both A and B are true', usage: 'Use to combine multiple conditions that must all be true', type: 'logical' },
  'OR': { description: 'At least one condition must be true', example: 'A OR B = true if either A or B (or both) are true', usage: 'Use when any of the conditions can be true', type: 'logical' },
  'NOT': { description: 'Inverts the condition', example: 'NOT A = true if A is false, false if A is true', usage: 'Use to negate a condition', type: 'logical' },
  'XOR': { description: 'Exactly one condition must be true', example: 'A XOR B = true if either A or B is true, but not both', usage: 'Use when exactly one condition should be true', type: 'logical' },
  '==': { description: 'Equal to', example: 'A == B = true if A equals B', usage: 'Use to check if two values are equal', type: 'logical' },
  '!=': { description: 'Not equal to', example: 'A != B = true if A does not equal B', usage: 'Use to check if two values are different', type: 'logical' },
  '>': { description: 'Greater than', example: 'A > B = true if A is greater than B', usage: 'Use to check if one value is larger than another', type: 'logical' },
  '<': { description: 'Less than', example: 'A < B = true if A is less than B', usage: 'Use to check if one value is smaller than another', type: 'logical' },
  '>=': { description: 'Greater than or equal to', example: 'A >= B = true if A is greater than or equal to B', usage: 'Use to check if one value is at least as large as another', type: 'logical' },
  '<=': { description: 'Less than or equal to', example: 'A <= B = true if A is less than or equal to B', usage: 'Use to check if one value is at most as large as another', type: 'logical' }
};

// Enhanced function descriptions
const MIXED_FUNCTION_DESCRIPTIONS: Record<MathFunction | LogicalFunction, { 
  description: string; 
  example: string; 
  arguments: string[];
  usage: string;
  type: 'math' | 'logical';
}> = {
  // Math functions
  'abs': { description: 'Returns the absolute value of a number', example: 'abs(-5) = 5', arguments: ['Number'], usage: 'Use to get the positive value of a number', type: 'math' },
  'sin': { description: 'Returns the sine of an angle', example: 'sin(3.14) ≈ 0', arguments: ['Angle (radians)'], usage: 'Use for trigonometric calculations', type: 'math' },
  'cos': { description: 'Returns the cosine of an angle', example: 'cos(0) = 1', arguments: ['Angle (radians)'], usage: 'Use for trigonometric calculations', type: 'math' },
  'tan': { description: 'Returns the tangent of an angle', example: 'tan(0.785) ≈ 1', arguments: ['Angle (radians)'], usage: 'Use for trigonometric calculations', type: 'math' },
  'sqrt': { description: 'Returns the square root of a number', example: 'sqrt(16) = 4', arguments: ['Number'], usage: 'Use to calculate square roots', type: 'math' },
  'log': { description: 'Returns the natural logarithm of a number', example: 'log(2.718) ≈ 1', arguments: ['Number'], usage: 'Use for logarithmic calculations', type: 'math' },
  'exp': { description: 'Returns e raised to the power of a number', example: 'exp(1) ≈ 2.718', arguments: ['Number'], usage: 'Use for exponential calculations', type: 'math' },
  'floor': { description: 'Returns the largest integer less than or equal to a number', example: 'floor(3.7) = 3', arguments: ['Number'], usage: 'Use to round down to nearest integer', type: 'math' },
  'ceil': { description: 'Returns the smallest integer greater than or equal to a number', example: 'ceil(3.2) = 4', arguments: ['Number'], usage: 'Use to round up to nearest integer', type: 'math' },
  'round': { description: 'Rounds a number to the nearest integer', example: 'round(3.5) = 4', arguments: ['Number'], usage: 'Use to round to nearest integer', type: 'math' },
  
  // Logical functions
  'IF': { description: 'Conditional statement - if condition is true, return first value, otherwise return second value', example: 'IF(Age > 18, Price * 1.1, Price)', arguments: ['Condition', 'Then Value', 'Else Value'], usage: 'Use to return different values based on a condition', type: 'logical' },
  'CASE': { description: 'Multiple conditional statements - check multiple conditions and return corresponding values', example: 'CASE(Score >= 90, "A", Score >= 80, "B", "F")', arguments: ['Condition1', 'Value1', 'Condition2', 'Value2', '...', 'Default'], usage: 'Use when you have multiple conditions to check', type: 'logical' },
  'ISNULL': { description: 'Check if a value is null or empty', example: 'ISNULL(Email) = true if Email is null or empty', arguments: ['Value'], usage: 'Use to check for missing or empty data', type: 'logical' },
  'ISNOTNULL': { description: 'Check if a value is not null or empty', example: 'ISNOTNULL(Email) = true if Email has a value', arguments: ['Value'], usage: 'Use to check for existing data', type: 'logical' },
  'IN': { description: 'Check if a value is in a list of values', example: 'IN(Status, "Active", "Pending", "Approved")', arguments: ['Value', 'Option1', 'Option2', '...'], usage: 'Use to check if a value matches any in a list', type: 'logical' },
  'BETWEEN': { description: 'Check if a value is between two other values (inclusive)', example: 'BETWEEN(Age, 18, 65) = true if Age is between 18 and 65', arguments: ['Value', 'Min', 'Max'], usage: 'Use to check if a value falls within a range', type: 'logical' }
};

export const MixedFormulaBuilder: React.FC<FormulaBuilderProps> = ({
  attributes,
  onFormulaChange,
  initialFormula
}) => {
  const [state, setState] = useState<FormulaBuilderProps['initialFormula']>({
    nodes: [],
    selectedNodeId: undefined,
    formulaName: '',
    formulaDescription: '',
    mode: 'mixed',
    ...initialFormula
  });

  const [showHelp, setShowHelp] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    onFormulaChange(state!);
    validateFormula();
  }, [state, onFormulaChange]);

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNode = (type: FormulaNode['type'], parentId?: string) => {
    const newNode: FormulaNode = {
      id: generateId(),
      type,
      parentId
    };

    setState(prev => ({
      ...prev!,
      nodes: [...prev!.nodes, newNode],
      selectedNodeId: newNode.id
    }));
  };

  const updateNode = (nodeId: string, updates: Partial<FormulaNode>) => {
    setState(prev => ({
      ...prev!,
      nodes: prev!.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  };

  const deleteNode = (nodeId: string) => {
    setState(prev => ({
      ...prev!,
      nodes: prev!.nodes.filter(node => node.id !== nodeId),
      selectedNodeId: prev!.selectedNodeId === nodeId ? undefined : prev!.selectedNodeId
    }));
  };

  // Validate mixed formula for common errors
  const validateFormula = () => {
    const errors: string[] = [];
    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];

    // Check for mixing incompatible operators
    const mathOperators = rootNodes.filter(node => node.type === 'operator');
    const logicalOperators = rootNodes.filter(node => node.type === 'logical_operator');
    
    if (mathOperators.length > 0 && logicalOperators.length > 0) {
      errors.push('Cannot mix math and logical operators at the same level - use functions or groups to separate them');
    }

    // Check for incomplete functions
    state?.nodes.forEach(node => {
      if (node.type === 'function' && node.function) {
        const func = MIXED_FUNCTION_DESCRIPTIONS[node.function];
        if (func && func.type === 'math') {
          const children = state.nodes.filter(n => n.parentId === node.id);
          if (children.length !== func.arguments.length) {
            errors.push(`${node.function} function needs exactly ${func.arguments.length} argument(s)`);
          }
        }
      }
      
      if (node.type === 'logical_function' && node.logicalFunction) {
        const func = MIXED_FUNCTION_DESCRIPTIONS[node.logicalFunction];
        if (func && func.type === 'logical') {
          const children = state.nodes.filter(n => n.parentId === node.id);
          if (children.length < func.arguments.length) {
            errors.push(`${node.logicalFunction} function needs at least ${func.arguments.length} argument(s)`);
          }
        }
      }
    });

    setValidationErrors(errors);
  };

  // Get allowed actions for mixed operations
  const getAllowedActions = (node: FormulaNode): { [key: string]: boolean } => {
    switch (node.type) {
      case 'attribute':
        return {
          attribute: false,
          operator: true,
          logicalOperator: true,
          function: true,
          logicalFunction: true,
          value: false,
          group: false,
          condition: true
        };

      case 'value':
        return {
          attribute: false,
          operator: true,
          logicalOperator: true,
          function: false,
          logicalFunction: false,
          value: false,
          group: false,
          condition: true
        };

      case 'operator':
        return {
          attribute: true,
          operator: false,
          logicalOperator: false,
          function: true,
          logicalFunction: false,
          value: true,
          group: true,
          condition: false
        };

      case 'logical_operator':
        return {
          attribute: true,
          operator: false,
          logicalOperator: false,
          function: false,
          logicalFunction: true,
          value: true,
          group: true,
          condition: true
        };

      case 'function':
        return {
          attribute: true,
          operator: true,
          logicalOperator: true,
          function: false,
          logicalFunction: false,
          value: true,
          group: true,
          condition: true
        };

      case 'logical_function':
        return {
          attribute: true,
          operator: true,
          logicalOperator: true,
          function: false,
          logicalFunction: false,
          value: true,
          group: true,
          condition: true
        };

      case 'condition':
        return {
          attribute: false,
          operator: false,
          logicalOperator: false,
          function: false,
          logicalFunction: false,
          value: false,
          group: false,
          condition: false
        };

      case 'group':
        return {
          attribute: true,
          operator: true,
          logicalOperator: true,
          function: true,
          logicalFunction: true,
          value: true,
          group: true,
          condition: true
        };

      default:
        return {
          attribute: true,
          operator: true,
          logicalOperator: true,
          function: true,
          logicalFunction: true,
          value: true,
          group: true,
          condition: true
        };
    }
  };

  const renderNode = (node: FormulaNode, depth: number = 0) => {
    const isSelected = state?.selectedNodeId === node.id;
    const childNodes = state?.nodes.filter(n => n.parentId === node.id) || [];
    const allowedActions = getAllowedActions(node);

    return (
      <div key={node.id} className="space-y-2">
        <div
          className={clsx(
            'flex items-center gap-2 p-2 border rounded-lg transition-all',
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white',
            'hover:border-gray-400'
          )}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => setState(prev => ({ ...prev!, selectedNodeId: node.id }))}
        >
          {node.type === 'attribute' && (
            <div className="flex items-center gap-2">
              <select
                value={node.attributeId || ''}
                onChange={(e) => updateNode(node.id, { attributeId: e.target.value })}
                className="px-2 py-1 border rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select attribute</option>
                {attributes.map(attr => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name} ({attr.type})
                  </option>
                ))}
              </select>
              {node.attributeId && (
                <span className="text-xs text-gray-500">
                  {attributes.find(a => a.id === node.attributeId)?.type}
                </span>
              )}
            </div>
          )}

          {node.type === 'operator' && (
            <div className="flex items-center gap-2">
              <select
                value={node.operator || ''}
                onChange={(e) => updateNode(node.id, { operator: e.target.value as MathOperator })}
                className="px-2 py-1 border rounded text-sm font-mono"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select math operator</option>
                {OPERATORS.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              {node.operator && (
                <div className="text-xs text-gray-500 max-w-xs">
                  <div className="text-green-600 font-medium">Math Operator</div>
                  <div>{MIXED_OPERATOR_DESCRIPTIONS[node.operator].description}</div>
                  <div className="font-mono">{MIXED_OPERATOR_DESCRIPTIONS[node.operator].example}</div>
                </div>
              )}
            </div>
          )}

          {node.type === 'logical_operator' && (
            <div className="flex items-center gap-2">
              <select
                value={node.logicalOperator || ''}
                onChange={(e) => updateNode(node.id, { logicalOperator: e.target.value as LogicalOperator })}
                className="px-2 py-1 border rounded text-sm font-mono"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select logical operator</option>
                {LOGICAL_OPERATORS.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              {node.logicalOperator && (
                <div className="text-xs text-gray-500 max-w-xs">
                  <div className="text-purple-600 font-medium">Logical Operator</div>
                  <div>{MIXED_OPERATOR_DESCRIPTIONS[node.logicalOperator].description}</div>
                  <div className="font-mono">{MIXED_OPERATOR_DESCRIPTIONS[node.logicalOperator].example}</div>
                </div>
              )}
            </div>
          )}

          {node.type === 'function' && (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <select
                  value={node.function || ''}
                  onChange={(e) => updateNode(node.id, { function: e.target.value as MathFunction })}
                  className="px-2 py-1 border rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select math function</option>
                  {FUNCTIONS.map(func => (
                    <option key={func} value={func}>{func}</option>
                  ))}
                </select>
                {node.function && (
                  <div className="text-xs text-gray-500 max-w-xs">
                    <div className="text-green-600 font-medium">Math Function</div>
                    <div>{MIXED_FUNCTION_DESCRIPTIONS[node.function].description}</div>
                    <div className="font-mono">{MIXED_FUNCTION_DESCRIPTIONS[node.function].example}</div>
                  </div>
                )}
              </div>
              
              {/* Render argument slots for math functions */}
              {(() => {
                const func = node.function ? MIXED_FUNCTION_DESCRIPTIONS[node.function] : null;
                const children = state?.nodes.filter(n => n.parentId === node.id) || [];
                if (!func || func.type !== 'math') return null;
                
                return (
                  <div className="flex flex-col gap-1 ml-4">
                    {func.arguments.map((arg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">{arg}</span>
                        {children[idx] ? (
                          <div className="flex-1">{renderNode(children[idx], depth + 1)}</div>
                        ) : (
                          <button
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded border border-green-200 hover:bg-green-200"
                            onClick={e => {
                              e.stopPropagation();
                              addNode('attribute', node.id);
                            }}
                          >
                            + Add {arg.toLowerCase()}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {node.type === 'logical_function' && (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <select
                  value={node.logicalFunction || ''}
                  onChange={(e) => updateNode(node.id, { logicalFunction: e.target.value as LogicalFunction })}
                  className="px-2 py-1 border rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select logical function</option>
                  {LOGICAL_FUNCTIONS.map(func => (
                    <option key={func} value={func}>{func}</option>
                  ))}
                </select>
                {node.logicalFunction && (
                  <div className="text-xs text-gray-500 max-w-xs">
                    <div className="text-purple-600 font-medium">Logical Function</div>
                    <div>{MIXED_FUNCTION_DESCRIPTIONS[node.logicalFunction].description}</div>
                    <div className="font-mono">{MIXED_FUNCTION_DESCRIPTIONS[node.logicalFunction].example}</div>
                  </div>
                )}
              </div>
              
              {/* Render argument slots for logical functions */}
              {(() => {
                const func = node.logicalFunction ? MIXED_FUNCTION_DESCRIPTIONS[node.logicalFunction] : null;
                const children = state?.nodes.filter(n => n.parentId === node.id) || [];
                if (!func || func.type !== 'logical') return null;
                
                return (
                  <div className="flex flex-col gap-1 ml-4">
                    {func.arguments.map((arg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">{arg}</span>
                        {children[idx] ? (
                          <div className="flex-1">{renderNode(children[idx], depth + 1)}</div>
                        ) : (
                          <button
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded border border-purple-200 hover:bg-purple-200"
                            onClick={e => {
                              e.stopPropagation();
                              if (node.logicalFunction === 'IF') {
                                if (idx === 0) addNode('condition', node.id);
                                else addNode('attribute', node.id);
                              } else {
                                addNode('attribute', node.id);
                              }
                            }}
                          >
                            + Add {arg.toLowerCase()}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {node.type === 'condition' && (
            <div className="flex items-center gap-2">
              <select
                value={node.condition?.operator || ''}
                onChange={(e) => updateNode(node.id, { 
                  condition: { 
                    ...node.condition!, 
                    operator: e.target.value as LogicalOperator 
                  }
                })}
                className="px-2 py-1 border rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select condition</option>
                {LOGICAL_OPERATORS.filter(op => ['==', '!=', '>', '<', '>=', '<='].includes(op)).map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              <input
                type="text"
                value={node.condition?.rightOperand || ''}
                onChange={(e) => updateNode(node.id, { 
                  condition: { 
                    ...node.condition!, 
                    rightOperand: e.target.value 
                  }
                })}
                className="px-2 py-1 border rounded text-sm w-20"
                onClick={(e) => e.stopPropagation()}
                placeholder="value"
              />
              {node.condition?.operator && (
                <div className="text-xs text-gray-500">
                  {MIXED_OPERATOR_DESCRIPTIONS[node.condition.operator].usage}
                </div>
              )}
            </div>
          )}

          {node.type === 'value' && (
            <input
              type="number"
              value={node.value?.toString() || ''}
              onChange={(e) => updateNode(node.id, { value: parseFloat(e.target.value) || 0 })}
              className="px-2 py-1 border rounded text-sm w-20"
              onClick={(e) => e.stopPropagation()}
              placeholder="0"
            />
          )}

          {node.type === 'group' && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">(</span>
              <span className="text-gray-400">{childNodes.length} items</span>
              <span className="text-gray-500">)</span>
            </div>
          )}

          {/* Action buttons for mixed operations */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.attribute) {
                  addNode('attribute', node.id);
                }
              }}
              disabled={!allowedActions.attribute}
              className={clsx(
                "p-1",
                allowedActions.attribute 
                  ? "text-blue-400 hover:text-blue-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.attribute ? "Add attribute" : "Cannot add attribute to this element"}
            >
              <Plus size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.operator) {
                  addNode('operator', node.id);
                }
              }}
              disabled={!allowedActions.operator}
              className={clsx(
                "p-1",
                allowedActions.operator 
                  ? "text-green-400 hover:text-green-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.operator ? "Add math operator" : "Cannot add math operator to this element"}
            >
              <Calculator size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.logicalOperator) {
                  addNode('logical_operator', node.id);
                }
              }}
              disabled={!allowedActions.logicalOperator}
              className={clsx(
                "p-1",
                allowedActions.logicalOperator 
                  ? "text-orange-400 hover:text-orange-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.logicalOperator ? "Add logical operator" : "Cannot add logical operator to this element"}
            >
              <Zap size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.function) {
                  addNode('function', node.id);
                }
              }}
              disabled={!allowedActions.function}
              className={clsx(
                "p-1",
                allowedActions.function 
                  ? "text-purple-400 hover:text-purple-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.function ? "Add math function" : "Cannot add math function to this element"}
            >
              <Code size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.logicalFunction) {
                  addNode('logical_function', node.id);
                }
              }}
              disabled={!allowedActions.logicalFunction}
              className={clsx(
                "p-1",
                allowedActions.logicalFunction 
                  ? "text-indigo-400 hover:text-indigo-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.logicalFunction ? "Add logical function" : "Cannot add logical function to this element"}
            >
              <CheckCircle size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.value) {
                  addNode('value', node.id);
                }
              }}
              disabled={!allowedActions.value}
              className={clsx(
                "p-1",
                allowedActions.value 
                  ? "text-yellow-400 hover:text-yellow-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.value ? "Add value" : "Cannot add value to this element"}
            >
              <span className="text-sm">#</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.condition) {
                  addNode('condition', node.id);
                }
              }}
              disabled={!allowedActions.condition}
              className={clsx(
                "p-1",
                allowedActions.condition 
                  ? "text-red-400 hover:text-red-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.condition ? "Add condition" : "Cannot add condition to this element"}
            >
              <span className="text-sm">?</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (allowedActions.group) {
                  addNode('group', node.id);
                }
              }}
              disabled={!allowedActions.group}
              className={clsx(
                "p-1",
                allowedActions.group 
                  ? "text-gray-400 hover:text-gray-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.group ? "Add group" : "Cannot add group to this element"}
            >
              <Parentheses size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Render child nodes */}
        {childNodes.length > 0 && (
          <div className="space-y-2">
            {childNodes.map(childNode => renderNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFormulaPreview = () => {
    const generateFormulaString = (nodes: FormulaNode[]): string => {
      return nodes.map(node => {
        switch (node.type) {
          case 'attribute':
            const attr = attributes.find(a => a.id === node.attributeId);
            return attr ? `{${attr.name}}` : '{attribute}';
          case 'operator':
            return node.operator || '';
          case 'logical_operator':
            return node.logicalOperator || '';
          case 'function':
            const childNodes = state?.nodes.filter(n => n.parentId === node.id) || [];
            return node.function ? `${node.function}(${generateFormulaString(childNodes)})` : 'function(...)';
          case 'logical_function':
            const logicalChildNodes = state?.nodes.filter(n => n.parentId === node.id) || [];
            return node.logicalFunction ? `${node.logicalFunction}(${generateFormulaString(logicalChildNodes)})` : 'function(...)';
          case 'condition':
            const cond = node.condition;
            return cond ? `${cond.leftOperand} ${cond.operator} ${cond.rightOperand}` : 'condition';
          case 'value':
            return node.value?.toString() || '0';
          case 'group':
            const groupChildren = state?.nodes.filter(n => n.parentId === node.id) || [];
            return `(${generateFormulaString(groupChildren)})`;
          default:
            return '';
        }
      }).join(' ');
    };

    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];
    const formulaString = generateFormulaString(rootNodes);

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Mixed Formula Preview:</h3>
          <div className="flex items-center gap-2">
            {validationErrors.length === 0 && formulaString && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} />
                <span className="text-xs">Valid</span>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle size={14} />
                <span className="text-xs">{validationErrors.length} error(s)</span>
              </div>
            )}
          </div>
        </div>
        <div className="font-mono text-sm bg-white p-3 rounded border">
          {formulaString || 'No mixed formula built yet'}
        </div>
        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
            <h4 className="text-xs font-medium text-red-700 mb-1">Issues found:</h4>
            <ul className="text-xs text-red-600 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Mixed Formula Builder</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          >
            <HelpCircle size={16} />
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
        </div>
        
        {showHelp && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3">How to Build Mixed Formulas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-indigo-800 mb-2">Math Operations (Green):</h4>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• <strong>Operators:</strong> +, -, *, /, ** (power), % (modulo)</li>
                  <li>• <strong>Functions:</strong> sqrt, abs, sin, cos, tan, log, exp, floor, ceil, round</li>
                  <li>• <strong>Values:</strong> Constant numbers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800 mb-2">Logical Operations (Purple):</h4>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• <strong>Operators:</strong> AND, OR, NOT, XOR, ==, !=, &gt;, &lt;, &gt;=, &lt;=</li>
                  <li>• <strong>Functions:</strong> IF, CASE, ISNULL, ISNOTNULL, IN, BETWEEN</li>
                  <li>• <strong>Conditions:</strong> Compare attributes with values</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-indigo-100 rounded">
              <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
                <Lightbulb size={16} />
                Key Rules for Mixed Formulas:
              </h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• <strong>Don't mix operators:</strong> Use functions or groups to separate math and logical operations</li>
                <li>• <strong>Use IF for conditional math:</strong> IF(condition, math_result1, math_result2)</li>
                <li>• <strong>Use groups for complex logic:</strong> (math_expression) AND (logical_condition)</li>
                <li>• <strong>Functions can contain both:</strong> Math functions can have logical conditions inside</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-indigo-100 rounded">
              <h4 className="font-medium text-indigo-800 mb-2">Examples:</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• <code>IF(Age &gt; 18, Price * 1.1, Price)</code> - VIP pricing for adults</li>
                <li>• <code>sqrt(Revenue) * (Status == "Active" ? 1.2 : 1.0)</code> - Conditional multiplier</li>
                <li>• <code>IF(Income &gt; 50000, Income * 0.3, Income * 0.2)</code> - Progressive tax rate</li>
                <li>• <code>(Price * Quantity) + IF(VIP == true, 100, 0)</code> - VIP bonus</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formula Name
            </label>
            <input
              type="text"
              value={state?.formulaName || ''}
              onChange={(e) => setState(prev => ({ ...prev!, formulaName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., conditional_revenue_calculation"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={state?.formulaDescription || ''}
              onChange={(e) => setState(prev => ({ ...prev!, formulaDescription: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Calculate revenue with VIP discounts"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mixed Formula Construction</h3>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Add Root Elements:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addNode('attribute')}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Attribute
            </button>
            
            <button
              onClick={() => addNode('operator')}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm flex items-center gap-2"
            >
              <Calculator size={16} />
              Math Operator
            </button>
            
            <button
              onClick={() => addNode('logical_operator')}
              className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm flex items-center gap-2"
            >
              <Zap size={16} />
              Logical Operator
            </button>
            
            <button
              onClick={() => addNode('function')}
              className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm flex items-center gap-2"
            >
              <Code size={16} />
              Math Function
            </button>
            
            <button
              onClick={() => addNode('logical_function')}
              className="px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Logical Function
            </button>
            
            <button
              onClick={() => addNode('value')}
              className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm flex items-center gap-2"
            >
              <span className="text-sm">#</span>
              Value
            </button>
            
            <button
              onClick={() => addNode('condition')}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm flex items-center gap-2"
            >
              <span className="text-sm">?</span>
              Condition
            </button>
            
            <button
              onClick={() => addNode('group')}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm flex items-center gap-2"
            >
              <Parentheses size={16} />
              Group
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Mixed Formula Tree:</h4>
          <div className="min-h-[200px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
            {state?.nodes.filter(node => !node.parentId).length === 0 ? (
              <div className="text-center text-gray-500">
                <Info size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Start Building Your Mixed Formula</p>
                <p className="text-sm mb-4">Combine math and logical operations for complex calculations</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Use math operators and functions for calculations</p>
                  <p>• Use logical operators and functions for conditions</p>
                  <p>• Use IF functions to combine math and logic</p>
                  <p>• Use groups to control the order of operations</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {state?.nodes.filter(node => !node.parentId).map(node => renderNode(node))}
              </div>
            )}
          </div>
        </div>
      </div>

      {renderFormulaPreview()}
    </div>
  );
}; 