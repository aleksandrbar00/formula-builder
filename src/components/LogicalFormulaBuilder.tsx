import React, { useState, useEffect } from 'react';
import { Plus, X, Parentheses, Code, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { FormulaBuilderProps, FormulaNode, LogicalOperator, LogicalFunction, Attribute } from '../types/formula';
import { clsx } from 'clsx';

const LOGICAL_OPERATORS: LogicalOperator[] = ['AND', 'OR', 'NOT', 'XOR', '==', '!=', '>', '<', '>=', '<='];
const LOGICAL_FUNCTIONS: LogicalFunction[] = ['IF', 'CASE', 'ISNULL', 'ISNOTNULL', 'IN', 'BETWEEN'];

// Example of how logical operations would work
export const LogicalFormulaBuilder: React.FC<FormulaBuilderProps> = ({
  attributes,
  onFormulaChange,
  initialFormula
}) => {
  const [state, setState] = useState<FormulaBuilderProps['initialFormula']>({
    nodes: [],
    selectedNodeId: undefined,
    formulaName: '',
    formulaDescription: '',
    mode: 'logical',
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

  // Get allowed actions for logical operations
  const getAllowedActions = (node: FormulaNode): { [key: string]: boolean } => {
    switch (node.type) {
      case 'attribute':
        return {
          attribute: false,
          operator: false,
          logicalOperator: true, // Can add logical operators to attributes
          function: false,
          logicalFunction: false,
          value: false,
          group: false,
          condition: true
        };

      case 'value':
        return {
          attribute: false,
          operator: false,
          logicalOperator: true,
          function: false,
          logicalFunction: false,
          value: false,
          group: false,
          condition: true
        };

      case 'logical_operator':
        return {
          attribute: true,
          operator: false,
          logicalOperator: false, // Can't nest logical operators
          function: false,
          logicalFunction: true,
          value: true,
          group: true,
          condition: true
        };

      case 'logical_function':
        return {
          attribute: true,
          operator: false,
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
          operator: false,
          logicalOperator: true,
          function: false,
          logicalFunction: true,
          value: true,
          group: true,
          condition: true
        };

      default:
        return {
          attribute: true,
          operator: false,
          logicalOperator: true,
          function: false,
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

          {node.type === 'logical_operator' && (
            <select
              value={node.logicalOperator || ''}
              onChange={(e) => updateNode(node.id, { logicalOperator: e.target.value as LogicalOperator })}
              className="px-2 py-1 border rounded text-sm font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Select operator</option>
              {LOGICAL_OPERATORS.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          )}

          {node.type === 'logical_function' && (
            <div className="flex items-center gap-1">
              <select
                value={node.logicalFunction || ''}
                onChange={(e) => updateNode(node.id, { logicalFunction: e.target.value as LogicalFunction })}
                className="px-2 py-1 border rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select function</option>
                {LOGICAL_FUNCTIONS.map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
              <span className="text-gray-500">(</span>
              <span className="text-gray-400">{childNodes.length} items</span>
              <span className="text-gray-500">)</span>
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
            </div>
          )}

          {node.type === 'value' && (
            <input
              type="text"
              value={node.value?.toString() || ''}
              onChange={(e) => updateNode(node.id, { value: e.target.value })}
              className="px-2 py-1 border rounded text-sm w-20"
              onClick={(e) => e.stopPropagation()}
              placeholder="value"
            />
          )}

          {node.type === 'group' && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">(</span>
              <span className="text-gray-400">{childNodes.length} items</span>
              <span className="text-gray-500">)</span>
            </div>
          )}

          {/* Action buttons for logical operations */}
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
                if (allowedActions.logicalOperator) {
                  addNode('logical_operator', node.id);
                }
              }}
              disabled={!allowedActions.logicalOperator}
              className={clsx(
                "p-1",
                allowedActions.logicalOperator 
                  ? "text-green-400 hover:text-green-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.logicalOperator ? "Add logical operator" : "Cannot add logical operator to this element"}
            >
              <Zap size={14} />
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
                  ? "text-purple-400 hover:text-purple-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.logicalFunction ? "Add logical function" : "Cannot add logical function to this element"}
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
                if (allowedActions.condition) {
                  addNode('condition', node.id);
                }
              }}
              disabled={!allowedActions.condition}
              className={clsx(
                "p-1",
                allowedActions.condition 
                  ? "text-yellow-400 hover:text-yellow-600" 
                  : "text-gray-300 cursor-not-allowed"
              )}
              title={allowedActions.condition ? "Add condition" : "Cannot add condition to this element"}
            >
              <CheckCircle size={14} />
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
          case 'logical_operator':
            return node.logicalOperator || '';
          case 'logical_function':
            const childNodes = state?.nodes.filter(n => n.parentId === node.id) || [];
            return node.logicalFunction ? `${node.logicalFunction}(${generateFormulaString(childNodes)})` : 'function(...)';
          case 'condition':
            const cond = node.condition;
            return cond ? `${cond.leftOperand} ${cond.operator} ${cond.rightOperand}` : 'condition';
          case 'value':
            return node.value?.toString() || 'value';
          case 'group':
            const groupChildren = state?.nodes.filter(n => n.parentId === node.id) || [];
            return `(${generateFormulaString(groupChildren)})`;
          default:
            return '';
        }
      }).join(' ');
    };

    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Logical Formula Preview:</h3>
        <div className="font-mono text-sm bg-white p-3 rounded border">
          {generateFormulaString(rootNodes)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Logical Formula Builder</h2>
        
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
              placeholder="e.g., high_value_customers"
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
              placeholder="e.g., Customers with high value and good credit"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logical Formula Construction</h3>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Add Root Elements:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => addNode('attribute')}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              <Plus size={16} className="inline mr-1" />
              Attribute
            </button>
            
            <button
              onClick={() => addNode('logical_operator')}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
            >
              <Zap size={16} className="inline mr-1" />
              Logical Operator
            </button>
            
            <button
              onClick={() => addNode('logical_function')}
              className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
            >
              <Code size={16} className="inline mr-1" />
              Logical Function
            </button>
            
            <button
              onClick={() => addNode('value')}
              className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
            >
              <Plus size={16} className="inline mr-1" />
              Value
            </button>
            
            <button
              onClick={() => addNode('condition')}
              className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
            >
              <CheckCircle size={16} className="inline mr-1" />
              Condition
            </button>
            
            <button
              onClick={() => addNode('group')}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              <Parentheses size={16} className="inline mr-1" />
              Group
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Logical Formula Tree:</h4>
          <div className="min-h-[200px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
            {state?.nodes.filter(node => !node.parentId).length === 0 ? (
              <div className="text-center text-gray-500">
                <p>Click the buttons above to start building your logical formula</p>
                <p className="text-sm mt-2">Examples: {'{Credit Score}'} &gt; 700 AND {'{Income}'} &gt; 50000</p>
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