import React, { useState, useEffect } from 'react';
import { Plus, X, Parentheses, Code } from 'lucide-react';
import { FormulaBuilderProps, FormulaNode, MathOperator, MathFunction } from '../types/formula';
import { clsx } from 'clsx';

const OPERATORS: MathOperator[] = ['+', '-', '*', '/', '**', '%'];
const FUNCTIONS: MathFunction[] = ['abs', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'floor', 'ceil', 'round'];

// Helper: function signatures (arity and argument labels)
const FUNCTION_SIGNATURES: Record<string, { arity: number | 'variadic'; labels: string[] }> = {
  IF: { arity: 3, labels: ['Condition', 'Then', 'Else'] },
  CASE: { arity: 'variadic', labels: ['Case', 'Value', '...'] },
  SUM: { arity: 'variadic', labels: ['Value', '...'] },
  // Add more as needed
};

export const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  attributes,
  onFormulaChange,
  initialFormula
}) => {
  const [state, setState] = useState<FormulaBuilderProps['initialFormula']>({
    nodes: [],
    selectedNodeId: undefined,
    formulaName: '',
    formulaDescription: '',
    ...initialFormula
  });

  useEffect(() => {
    onFormulaChange(state!);
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

  // Get allowed actions for a specific node
  const getAllowedActions = (node: FormulaNode): { [key: string]: boolean } => {
    const result = (() => {
      switch (node.type) {
        case 'attribute':
          // Attributes are leaf nodes - they can't have children
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };

        case 'value':
          // Values are leaf nodes - they can't have children
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };

        case 'operator':
          // Operators should not have children - they are used between operands
          // Operators like +, -, *, / are binary operators that connect two operands
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };

        case 'function':
          // Functions can have multiple children (the argument expression)
          return {
            attribute: true,
            operator: true, // Can have operators inside function arguments
            function: false, // Can't nest functions directly (but can have them in groups)
            value: true,
            group: true
          };

        case 'group':
          // Groups can have multiple children
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
    })();

    // Debug logging
    console.log(`Node ${node.id} (${node.type}) allowed actions:`, result);
    
    return result;
  };

  // Get allowed actions for root level
  const getRootAllowedActions = (): { [key: string]: boolean } => {
    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];
    
    // If we have operators, we need operands
    const hasOperators = rootNodes.some(node => node.type === 'operator');
    const hasOperands = rootNodes.some(node => node.type === 'attribute' || node.type === 'value' || node.type === 'function' || node.type === 'group');
    
    if (hasOperators && !hasOperands) {
      // Need operands for operators
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
            <select
              value={node.attributeId || ''}
              onChange={(e) => updateNode(node.id, { attributeId: e.target.value })}
              className="px-2 py-1 border rounded text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Select attribute</option>
              {attributes.map(attr => (
                <option key={attr.id} value={attr.id}>
                  {attr.name}
                </option>
              ))}
            </select>
          )}

          {node.type === 'operator' && (
            <select
              value={node.operator || ''}
              onChange={(e) => updateNode(node.id, { operator: e.target.value as MathOperator })}
              className="px-2 py-1 border rounded text-sm font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Select operator</option>
              {OPERATORS.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          )}

          {node.type === 'function' && FUNCTION_SIGNATURES[node.function || ''] ? (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <select
                  value={node.function || ''}
                  onChange={(e) => updateNode(node.id, { function: e.target.value as MathFunction })}
                  className="px-2 py-1 border rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select function</option>
                  {FUNCTIONS.map(func => (
                    <option key={func} value={func}>{func}</option>
                  ))}
                </select>
                <span className="text-gray-500 font-mono text-xs">{node.function} (args: {(() => {
                  const sig = FUNCTION_SIGNATURES[node.function || ''];
                  if (!sig) return '?';
                  const count = (state?.nodes.filter(n => n.parentId === node.id) || []).length;
                  return sig.arity === 'variadic' ? `${count}/∞` : `${count}/${sig.arity}`;
                })()})</span>
                {/* Warning if wrong arg count */}
                {(() => {
                  const sig = FUNCTION_SIGNATURES[node.function || ''];
                  if (!sig || sig.arity === 'variadic') return null;
                  const count = (state?.nodes.filter(n => n.parentId === node.id) || []).length;
                  if (count !== sig.arity) {
                    return <span className="text-xs text-red-500 ml-2">Wrong number of arguments</span>;
                  }
                  return null;
                })()}
              </div>
              {/* Render argument slots */}
              {(() => {
                const sig = FUNCTION_SIGNATURES[node.function || ''];
                const children = state?.nodes.filter(n => n.parentId === node.id) || [];
                if (!sig) return null;
                const slots = sig.arity === 'variadic' ? Math.max(children.length + 1, 2) : sig.arity;
                return (
                  <div className="flex flex-col gap-1 ml-4">
                    {Array.from({ length: typeof slots === 'number' ? slots : children.length + 1 }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16">{sig.labels[idx] || `Arg ${idx + 1}`}</span>
                        {children[idx] ? (
                          <div className="flex-1">{renderNode(children[idx], depth + 1)}</div>
                        ) : (
                          <button
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-200"
                            onClick={e => {
                              e.stopPropagation();
                              // Default to attribute for demo, could show a menu
                              addNode('attribute', node.id);
                            }}
                          >+ Add</button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : node.type === 'function' ? (
            // Fallback for unknown functions
            <div className="flex items-center gap-1">
              <select
                value={node.function || ''}
                onChange={(e) => updateNode(node.id, { function: e.target.value as MathFunction })}
                className="px-2 py-1 border rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select function</option>
                {FUNCTIONS.map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
              <span className="text-gray-500">(</span>
              <span className="text-gray-400">{childNodes.length} items</span>
              <span className="text-gray-500">)</span>
            </div>
          ) : null}

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

          {/* Action buttons for adding elements */}
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
                console.log(`Trying to add operator to node ${node.id} (${node.type}). Allowed: ${allowedActions.operator}`);
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
              title={allowedActions.operator ? "Add operator" : "Cannot add operator to this element"}
            >
              <span className="text-sm font-mono">⚡</span>
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
              title={allowedActions.function ? "Add function" : "Cannot add function to this element"}
            >
              <Code size={14} />
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
                  ? "text-orange-400 hover:text-orange-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.value ? "Add value" : "Cannot add value to this element"}
            >
              <span className="text-sm">#</span>
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
          case 'function':
            const childNodes = state?.nodes.filter(n => n.parentId === node.id) || [];
            return node.function ? `${node.function}(${generateFormulaString(childNodes)})` : 'function(...)';
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

    // Get root nodes (nodes without parentId)
    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Formula Preview:</h3>
        <div className="font-mono text-sm bg-white p-3 rounded border">
          {generateFormulaString(rootNodes)}
        </div>
      </div>
    );
  };

  const rootAllowedActions = getRootAllowedActions();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Formula Builder</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formula Name
            </label>
            <input
              type="text"
              value={state?.formulaName || ''}
              onChange={(e) => setState(prev => ({ ...prev!, formulaName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., result_rate_sum"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Multiply sum by rate"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Formula Construction</h3>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Add Root Elements:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addNode('attribute')}
              disabled={!rootAllowedActions.attribute}
              className={clsx(
                "px-3 py-2 rounded-md text-sm",
                rootAllowedActions.attribute 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Plus size={16} className="inline mr-1" />
              Attribute
            </button>
            
            <button
              onClick={() => addNode('operator')}
              disabled={!rootAllowedActions.operator}
              className={clsx(
                "px-3 py-2 rounded-md text-sm",
                rootAllowedActions.operator 
                  ? "bg-green-500 text-white hover:bg-green-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Plus size={16} className="inline mr-1" />
              Operator
            </button>
            
            <button
              onClick={() => addNode('function')}
              disabled={!rootAllowedActions.function}
              className={clsx(
                "px-3 py-2 rounded-md text-sm",
                rootAllowedActions.function 
                  ? "bg-purple-500 text-white hover:bg-purple-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Code size={16} className="inline mr-1" />
              Function
            </button>
            
            <button
              onClick={() => addNode('value')}
              disabled={!rootAllowedActions.value}
              className={clsx(
                "px-3 py-2 rounded-md text-sm",
                rootAllowedActions.value 
                  ? "bg-orange-500 text-white hover:bg-orange-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Plus size={16} className="inline mr-1" />
              Value
            </button>
            
            <button
              onClick={() => addNode('group')}
              disabled={!rootAllowedActions.group}
              className={clsx(
                "px-3 py-2 rounded-md text-sm",
                rootAllowedActions.group 
                  ? "bg-gray-500 text-white hover:bg-gray-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Parentheses size={16} className="inline mr-1" />
              Group
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Formula Tree:</h4>
          <div className="min-h-[200px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
            {state?.nodes.filter(node => !node.parentId).length === 0 ? (
              <div className="text-center text-gray-500">
                <p>Click the buttons above to start building your formula</p>
                <p className="text-sm mt-2">Click on any element to add nested components inside it</p>
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