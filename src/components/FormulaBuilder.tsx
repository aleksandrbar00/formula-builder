import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Parentheses, Code, HelpCircle, Info, CheckCircle, AlertCircle, Edit3, Copy, RotateCcw, RotateCw, Save, FileText, Type } from 'lucide-react';
import { FormulaBuilderProps, FormulaNode, MathOperator, MathFunction } from '../types/formula';
import { clsx } from 'clsx';
import styles from './FormulaBuilder.module.css';

const OPERATORS: MathOperator[] = ['+', '-', '*', '/', '**', '%'];
const FUNCTIONS: MathFunction[] = ['abs', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'floor', 'ceil', 'round'];

// Enhanced function signatures with descriptions
const FUNCTION_SIGNATURES: Record<string, { 
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
const OPERATOR_DESCRIPTIONS: Record<MathOperator, { description: string; example: string }> = {
  '+': { description: 'Addition', example: '5 + 3 = 8' },
  '-': { description: 'Subtraction', example: '10 - 4 = 6' },
  '*': { description: 'Multiplication', example: '6 * 7 = 42' },
  '/': { description: 'Division', example: '15 / 3 = 5' },
  '**': { description: 'Exponentiation', example: '2 ** 3 = 8' },
  '%': { description: 'Modulo (remainder)', example: '17 % 5 = 2' }
};

// Formula templates for quick start
const FORMULA_TEMPLATES = [
  {
    name: 'Simple Addition',
    description: 'Add two attributes',
    template: [
      { type: 'attribute', id: 'attr1' },
      { type: 'operator', operator: '+' },
      { type: 'attribute', id: 'attr2' }
    ]
  },
  {
    name: 'Percentage Calculation',
    description: 'Calculate percentage of total',
    template: [
      { type: 'attribute', id: 'part' },
      { type: 'operator', operator: '/' },
      { type: 'attribute', id: 'total' },
      { type: 'operator', operator: '*' },
      { type: 'value', value: 100 }
    ]
  },
  {
    name: 'Square Root',
    description: 'Calculate square root of a value',
    template: [
      { type: 'function', function: 'sqrt' },
      { type: 'attribute', id: 'value' }
    ]
  },
  {
    name: 'Complex Calculation',
    description: 'Advanced mathematical expression',
    template: [
      { type: 'attribute', id: 'base' },
      { type: 'operator', operator: '*' },
      { type: 'value', value: 1.2 },
      { type: 'operator', operator: '+' },
      { type: 'function', function: 'abs' },
      { type: 'attribute', id: 'bonus' }
    ]
  }
];

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

  const [showHelp, setShowHelp] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<'visual' | 'text'>('visual');
  const [textFormula, setTextFormula] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<FormulaBuilderProps['initialFormula'][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showQuickFix, setShowQuickFix] = useState(false);
  const [brokenConnections, setBrokenConnections] = useState<{before: string, after: string}[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    nodeId: string;
    position: 'before' | 'after';
  }>({ show: false, x: 0, y: 0, nodeId: '', position: 'after' });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onFormulaChange(state!);
    validateFormula();
    addToHistory(state!);
  }, [state, onFormulaChange]);

  // Initialize text formula when switching to text mode
  useEffect(() => {
    if (editMode === 'text') {
      setTextFormula(generateFormulaString(state?.nodes.filter(node => !node.parentId) || []));
    }
  }, [editMode]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        hideContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  const addToHistory = (newState: FormulaBuilderProps['initialFormula']) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newState))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  };

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNode = (type: FormulaNode['type'], parentId?: string, insertAfterId?: string) => {
    const newNode: FormulaNode = {
      id: generateId(),
      type,
      parentId
    };

    setState(prev => {
      if (insertAfterId) {
        // Insert the new node after the specified node
        const nodeIndex = prev!.nodes.findIndex(node => node.id === insertAfterId);
        const newNodes = [...prev!.nodes];
        newNodes.splice(nodeIndex + 1, 0, newNode);
        return {
          ...prev!,
          nodes: newNodes,
          selectedNodeId: newNode.id
        };
      } else {
        // Add to the end (original behavior)
        return {
          ...prev!,
          nodes: [...prev!.nodes, newNode],
          selectedNodeId: newNode.id
        };
      }
    });
  };

  // Generic function to add any type of node from any position
  const addNodeFromPosition = (type: FormulaNode['type'], position: 'before' | 'after', targetNodeId: string) => {
    const newNode: FormulaNode = {
      id: generateId(),
      type
    };

    setState(prev => {
      const targetNode = prev!.nodes.find(node => node.id === targetNodeId);
      if (!targetNode) return prev!;

      // Always inherit parent from target node and insert at same level
      newNode.parentId = targetNode.parentId;

      const targetIndex = prev!.nodes.findIndex(node => node.id === targetNodeId);
      const newNodes = [...prev!.nodes];
      
      if (position === 'before') {
        newNodes.splice(targetIndex, 0, newNode);
      } else {
        newNodes.splice(targetIndex + 1, 0, newNode);
      }

      return {
        ...prev!,
        nodes: newNodes,
        selectedNodeId: newNode.id
      };
    });
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
    setState(prev => {
      const deletedNode = prev!.nodes.find(node => node.id === nodeId);
      const newNodes = prev!.nodes.filter(node => node.id !== nodeId);
      
      // If we deleted an operator, we might need to reconnect the surrounding nodes
      if (deletedNode?.type === 'operator') {
        // Find the nodes before and after the deleted operator
        const nodeIndex = prev!.nodes.findIndex(node => node.id === nodeId);
        const beforeNode = prev!.nodes[nodeIndex - 1];
        const afterNode = prev!.nodes[nodeIndex + 1];
        
        // If both surrounding nodes exist and are at the same level, we might want to suggest reconnection
        if (beforeNode && afterNode && beforeNode.parentId === afterNode.parentId) {
          // For now, just remove the operator and let user manually reconnect
          // In a more advanced version, we could auto-suggest reconnection
        }
      }
      
      return {
        ...prev!,
        nodes: newNodes,
        selectedNodeId: prev!.selectedNodeId === nodeId ? undefined : prev!.selectedNodeId
      };
    });
  };

  const copyFormula = () => {
    const formulaString = generateFormulaString(state?.nodes.filter(node => !node.parentId) || []);
    navigator.clipboard.writeText(formulaString);
  };

  const pasteFormula = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextFormula(text);
      setEditMode('text');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const applyTextFormula = () => {
    try {
      // Simple parser for text formula - this is a basic implementation
      // In a real app, you'd want a more robust parser
      const nodes = parseTextFormula(textFormula);
      setState(prev => ({
        ...prev!,
        nodes,
        selectedNodeId: undefined
      }));
      setEditMode('visual');
    } catch (error) {
      console.error('Failed to parse formula:', error);
      alert('Invalid formula format. Please check your syntax.');
    }
  };

  const parseTextFormula = (text: string): FormulaNode[] => {
    // This is a simplified parser - in practice you'd want a more robust solution
    const tokens = text.split(/\s+/).filter(token => token.length > 0);
    const nodes: FormulaNode[] = [];
    
    tokens.forEach((token, index) => {
      if (OPERATORS.includes(token as MathOperator)) {
        nodes.push({
          id: generateId(),
          type: 'operator',
          operator: token as MathOperator
        });
      } else if (FUNCTIONS.includes(token as MathFunction)) {
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

  const applyTemplate = (template: any) => {
    const nodes: FormulaNode[] = template.template.map((item: any) => ({
      id: generateId(),
      type: item.type,
      operator: item.operator,
      function: item.function,
      value: item.value,
      attributeId: item.id
    }));
    
    setState(prev => ({
      ...prev!,
      nodes,
      selectedNodeId: undefined
    }));
    setShowTemplates(false);
  };

  const quickFixConnection = (beforeId: string, afterId: string, operator: MathOperator) => {
    addNodeFromPosition('operator', 'after', beforeId);
  };

  const showContextMenu = (e: React.MouseEvent, nodeId: string, position: 'before' | 'after') => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      nodeId,
      position
    });
  };

  const hideContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, nodeId: '', position: 'after' });
  };

  const handleContextMenuAction = (type: FormulaNode['type']) => {
    addNodeFromPosition(type, contextMenu.position, contextMenu.nodeId);
    hideContextMenu();
  };

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

  // Validate formula for common errors
  const validateFormula = () => {
    const errors: string[] = [];
    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];
    const brokenConnections: {before: string, after: string}[] = [];

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
    state?.nodes.forEach(node => {
      if (node.type === 'function' && node.function) {
        const sig = FUNCTION_SIGNATURES[node.function];
        if (sig && sig.arity !== 'variadic') {
          const children = state.nodes.filter(n => n.parentId === node.id);
          if (children.length !== sig.arity) {
            errors.push(`${node.function} function needs exactly ${sig.arity} argument(s)`);
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

    setValidationErrors(errors);
    setBrokenConnections(brokenConnections);
    setShowQuickFix(brokenConnections.length > 0);
  };

  // Get allowed actions for a specific node
  const getAllowedActions = (node: FormulaNode): { [key: string]: boolean } => {
    const result = (() => {
      switch (node.type) {
        case 'attribute':
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };

        case 'value':
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };

        case 'operator':
          return {
            attribute: false,
            operator: false,
            function: false,
            value: false,
            group: false
          };

        case 'function':
          return {
            attribute: true,
            operator: true,
            function: false,
            value: true,
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
    })();

    return result;
  };

  // Get allowed actions for root level
  const getRootAllowedActions = (): { [key: string]: boolean } => {
    const rootNodes = state?.nodes.filter(node => !node.parentId) || [];
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

  const renderNode = (node: FormulaNode, depth: number = 0) => {
    const isSelected = state?.selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const childNodes = state?.nodes.filter(n => n.parentId === node.id) || [];
    const allowedActions = getAllowedActions(node);
    
    // Check if this node is part of a broken connection
    const isInBrokenConnection = brokenConnections.some(conn => 
      conn.before === node.id || conn.after === node.id
    );

    return (
      <div key={node.id} className={styles.nodeContainer}>
        <div
          className={`${styles.nodeItem} ${isSelected ? styles.selected : ''} ${isInBrokenConnection ? styles.error : ''}`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => setState(prev => ({ ...prev!, selectedNodeId: node.id }))}
          onContextMenu={(e) => {
            showContextMenu(e, node.id, 'after');
          }}
        >
          {node.type === 'attribute' && (
            <div className="flex items-center gap-2">
              <select
                value={node.attributeId || ''}
                onChange={(e) => updateNode(node.id, { attributeId: e.target.value })}
                className={styles.nodeSelect}
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
                <span className={styles.nodeDescription}>
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
                className={`${styles.nodeSelect} font-mono`}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select operator</option>
                {OPERATORS.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              {node.operator && (
                <div className={styles.nodeDescription}>
                  <div>{OPERATOR_DESCRIPTIONS[node.operator].description}</div>
                  <div className={styles.nodeDescriptionMono}>{OPERATOR_DESCRIPTIONS[node.operator].example}</div>
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
                  className={styles.nodeSelect}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select function</option>
                  {FUNCTIONS.map(func => (
                    <option key={func} value={func}>{func}</option>
                  ))}
                </select>
                {node.function && FUNCTION_SIGNATURES[node.function] && (
                  <div className={`${styles.nodeDescription} max-w-xs`}>
                    <div>{FUNCTION_SIGNATURES[node.function].description}</div>
                    <div className={styles.nodeDescriptionMono}>{FUNCTION_SIGNATURES[node.function].example}</div>
                  </div>
                )}
              </div>
              
              {/* Render argument slots - only buttons, no preview */}
              {(() => {
                const sig = FUNCTION_SIGNATURES[node.function || ''];
                const children = state?.nodes.filter(n => n.parentId === node.id) || [];
                
                if (sig) {
                  // Function has a signature - show argument buttons only
                  const slots = sig.arity === 'variadic' ? Math.max(children.length + 1, 2) : sig.arity;
                  return (
                    <div className={styles.functionArgs}>
                      {Array.from({ length: typeof slots === 'number' ? slots : children.length + 1 }).map((_, idx) => (
                        <div key={idx} className={styles.functionArg}>
                          <span className={styles.functionArgLabel}>{sig.labels[idx] || `Arg ${idx + 1}`}</span>
                          <button
                            className={styles.functionArgButton}
                            onClick={e => {
                              e.stopPropagation();
                              // Add empty attribute node as child
                              const newNode: FormulaNode = {
                                id: generateId(),
                                type: 'attribute',
                                parentId: node.id
                              };
                              setState(prev => ({
                                ...prev!,
                                nodes: [...prev!.nodes, newNode],
                                selectedNodeId: newNode.id
                              }));
                            }}
                          >
                            + Add {sig.labels[idx] || 'argument'}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Function doesn't have a signature - show simple button
                  return (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        className={styles.functionArgButton}
                        onClick={e => {
                          e.stopPropagation();
                          // Add empty attribute node as child
                          const newNode: FormulaNode = {
                            id: generateId(),
                            type: 'attribute',
                            parentId: node.id
                          };
                          setState(prev => ({
                            ...prev!,
                            nodes: [...prev!.nodes, newNode],
                            selectedNodeId: newNode.id
                          }));
                        }}
                      >
                        + Add argument
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          )}

          {node.type === 'value' && (
            <input
              type="number"
              value={node.value?.toString() || ''}
              onChange={(e) => updateNode(node.id, { value: parseFloat(e.target.value) || 0 })}
              className={styles.nodeInput}
              onClick={(e) => e.stopPropagation()}
              placeholder="0"
            />
          )}

          {node.type === 'group' && (
            <div className={styles.groupContent}>
              <span className={styles.groupBracket}>(</span>
              <span className={styles.groupCount}>{childNodes.length} items</span>
              <span className={styles.groupBracket}>)</span>
              <button
                className={styles.groupButton}
                onClick={e => {
                  e.stopPropagation();
                  // Add empty attribute node as child
                  const newNode: FormulaNode = {
                    id: generateId(),
                    type: 'attribute',
                    parentId: node.id
                  };
                  setState(prev => ({
                    ...prev!,
                    nodes: [...prev!.nodes, newNode],
                    selectedNodeId: newNode.id
                  }));
                }}
              >
                + Add item
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className={styles.deleteButton}
              title="Delete node"
            >
              <X size={14} />
            </button>
            
            {/* Add buttons for different types */}
            {allowedActions.attribute && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode('attribute', node.id);
                }}
                className={`${styles.addButton} ${styles.blue}`}
                title="Add attribute"
              >
                <Plus size={14} />
              </button>
            )}
            
            {allowedActions.operator && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode('operator', node.id);
                }}
                className={`${styles.addButton} ${styles.green}`}
                title="Add operator"
              >
                <span className="text-xs">⚡</span>
              </button>
            )}
            
            {allowedActions.value && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode('value', node.id);
                }}
                className={`${styles.addButton} ${styles.orange}`}
                title="Add value"
              >
                <span className="text-xs">#</span>
              </button>
            )}
            
            {allowedActions.function && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode('function', node.id);
                }}
                className={`${styles.addButton} ${styles.purple}`}
                title="Add function"
              >
                <span className="text-sm font-mono">⚡</span>
              </button>
            )}
            
            {allowedActions.group && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode('group', node.id);
                }}
                className={`${styles.addButton} ${styles.gray}`}
                title="Add group"
              >
                <span className="text-sm">#</span>
              </button>
            )}
          </div>
        </div>

        {/* Render child nodes */}
        {childNodes.length > 0 && (
          <div className="ml-4">
            {childNodes.map(childNode => renderNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFormulaPreview = () => {
    const formulaString = generateFormulaString(state?.nodes.filter(node => !node.parentId) || []);

    return (
      <div className={styles.previewSection}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>Formula Preview:</h3>
          <div className={styles.previewStatus}>
            {validationErrors.length === 0 && formulaString && (
              <div className={`${styles.previewStatus} ${styles.valid}`}>
                <CheckCircle size={14} />
                <span className={styles.previewStatusText}>Valid</span>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className={`${styles.previewStatus} ${styles.error}`}>
                <AlertCircle size={14} />
                <span className={styles.previewStatusText}>{validationErrors.length} error(s)</span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.previewCode}>
          {formulaString || 'No formula built yet'}
        </div>
        {validationErrors.length > 0 && (
          <div className={styles.previewErrors}>
            <h4 className={styles.previewErrorsTitle}>Issues found:</h4>
            <ul className={styles.previewErrorsList}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            
            {/* Quick Fix Section */}
            {showQuickFix && brokenConnections.length > 0 && (
              <div className={styles.previewQuickFix}>
                <h5 className={styles.previewQuickFixTitle}>Quick Fix:</h5>
                <div className={styles.previewQuickFixList}>
                  {brokenConnections.map((connection, index) => {
                    const beforeNode = state?.nodes.find(n => n.id === connection.before);
                    const afterNode = state?.nodes.find(n => n.id === connection.after);
                    const beforeAttr = beforeNode?.type === 'attribute' ? attributes.find(a => a.id === beforeNode.attributeId)?.name : 'value';
                    const afterAttr = afterNode?.type === 'attribute' ? attributes.find(a => a.id === afterNode.attributeId)?.name : 'value';
                    
                    return (
                      <div key={index} className={styles.previewQuickFixItem}>
                        <span className={styles.previewQuickFixText}>
                          {beforeAttr} ? {afterAttr}
                        </span>
                        <div className={styles.previewQuickFixButtons}>
                          {OPERATORS.map(op => (
                            <button
                              key={op}
                              onClick={() => quickFixConnection(connection.before, connection.after, op)}
                              className={styles.previewQuickFixButton}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const rootAllowedActions = getRootAllowedActions();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Math Formula Builder</h2>
          <div className={styles.headerButtons}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`${styles.button} ${styles.green}`}
            >
              <FileText size={16} />
              Templates
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`${styles.button} ${styles.blue}`}
            >
              <HelpCircle size={16} />
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
          </div>
        </div>
        
        {/* Templates Modal */}
        {showTemplates && (
          <div className={styles.templatesModal}>
            <h3 className={styles.templatesTitle}>Formula Templates</h3>
            <div className={styles.templatesGrid}>
              {FORMULA_TEMPLATES.map((template, index) => (
                <div key={index} className={styles.templateCard}>
                  <h4 className={styles.templateName}>{template.name}</h4>
                  <p className={styles.templateDescription}>{template.description}</p>
                  <button
                    onClick={() => applyTemplate(template)}
                    className={styles.templateButton}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showHelp && (
          <div className={styles.helpModal}>
            <h3 className={styles.helpTitle}>How to Build Math Formulas</h3>
            <div className={styles.helpGrid}>
              <div className={styles.helpSection}>
                <h4>Basic Operations:</h4>
                <ul className={styles.helpList}>
                  <li><strong>Attributes:</strong> Select from your data fields</li>
                  <li><strong>Operators:</strong> +, -, *, /, ** (power), % (modulo)</li>
                  <li><strong>Values:</strong> Enter constant numbers</li>
                  <li><strong>Functions:</strong> Mathematical operations like sqrt, abs, etc.</li>
                  <li><strong>Groups:</strong> Use parentheses for order of operations</li>
                </ul>
              </div>
              <div className={styles.helpSection}>
                <h4>Examples:</h4>
                <ul className={styles.helpList}>
                  <li><code>Price * Quantity</code> - Basic multiplication</li>
                  <li><code>sqrt(Revenue)</code> - Square root of revenue</li>
                  <li><code>(Price - Cost) * 0.2</code> - 20% markup calculation</li>
                  <li><code>abs(Profit)</code> - Absolute value of profit</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.formGrid}>
          <div>
            <label className={styles.formField}>
              Formula Name
            </label>
            <input
              type="text"
              value={state?.formulaName || ''}
              onChange={(e) => setState(prev => ({ ...prev!, formulaName: e.target.value }))}
              className={styles.formInput}
              placeholder="e.g., total_revenue"
            />
          </div>
          
          <div>
            <label className={styles.formField}>
              Description
            </label>
            <input
              type="text"
              value={state?.formulaDescription || ''}
              onChange={(e) => setState(prev => ({ ...prev!, formulaDescription: e.target.value }))}
              className={styles.formInput}
              placeholder="e.g., Calculate total revenue from price and quantity"
            />
          </div>
        </div>
      </div>

      {/* Edit Mode Toggle */}
      <div className={styles.editModeSection}>
        <div className={styles.editModeHeader}>
          <h3 className={styles.editModeTitle}>Formula Construction</h3>
          <div className={styles.editModeButtons}>
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`${styles.iconButton} ${historyIndex > 0 ? styles.enabled : styles.disabled}`}
              title="Undo"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`${styles.iconButton} ${historyIndex < history.length - 1 ? styles.enabled : styles.disabled}`}
              title="Redo"
            >
              <RotateCw size={16} />
            </button>
            <button
              onClick={copyFormula}
              className={`${styles.iconButton} ${styles.enabled}`}
              title="Copy formula"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => setEditMode(editMode === 'visual' ? 'text' : 'visual')}
              className={`${styles.modeToggleButton} ${editMode === 'text' ? styles.text : styles.visual}`}
            >
              {editMode === 'text' ? <Edit3 size={16} /> : <Type size={16} />}
              {editMode === 'text' ? 'Visual Mode' : 'Text Mode'}
            </button>
          </div>
        </div>

        {editMode === 'text' ? (
          <div className={styles.textModeSection}>
            <div>
              <label className={styles.formField}>
                Edit Formula as Text
              </label>
              <textarea
                ref={textAreaRef}
                value={textFormula}
                onChange={(e) => setTextFormula(e.target.value)}
                className={styles.textArea}
                placeholder="Enter your formula here... e.g., Price * Quantity + 100"
              />
              <div className={styles.textAreaHint}>
                Use attribute names in curly braces: {'{Price}'}, {'{Quantity}'}
              </div>
            </div>
            <div className={styles.textModeButtons}>
              <button
                onClick={applyTextFormula}
                className={`${styles.textModeButton} ${styles.primary}`}
              >
                Apply Formula
              </button>
              <button
                onClick={pasteFormula}
                className={`${styles.textModeButton} ${styles.secondary}`}
              >
                Paste from Clipboard
              </button>
              <button
                onClick={() => setEditMode('visual')}
                className={`${styles.textModeButton} ${styles.cancel}`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.visualModeSection}>
              <div className={styles.rootElementsSection}>
                <h4 className={styles.rootElementsTitle}>Add Root Elements:</h4>
                <div className={styles.rootElementsButtons}>
                  <button
                    onClick={() => addNode('attribute')}
                    disabled={!rootAllowedActions.attribute}
                    className={`${styles.rootElementButton} ${styles.attribute} ${!rootAllowedActions.attribute ? styles.disabled : ''}`}
                  >
                    <Plus size={16} />
                    Attribute
                  </button>
                  
                  <button
                    onClick={() => addNode('operator')}
                    disabled={!rootAllowedActions.operator}
                    className={`${styles.rootElementButton} ${styles.operator} ${!rootAllowedActions.operator ? styles.disabled : ''}`}
                  >
                    <span className="text-sm font-mono">⚡</span>
                    Operator
                  </button>
                  
                  <button
                    onClick={() => addNode('function')}
                    disabled={!rootAllowedActions.function}
                    className={`${styles.rootElementButton} ${styles.function} ${!rootAllowedActions.function ? styles.disabled : ''}`}
                  >
                    <Code size={16} />
                    Function
                  </button>
                  
                  <button
                    onClick={() => addNode('value')}
                    disabled={!rootAllowedActions.value}
                    className={`${styles.rootElementButton} ${styles.value} ${!rootAllowedActions.value ? styles.disabled : ''}`}
                  >
                    <span className="text-sm">#</span>
                    Value
                  </button>
                  
                  <button
                    onClick={() => addNode('group')}
                    disabled={!rootAllowedActions.group}
                    className={`${styles.rootElementButton} ${styles.group} ${!rootAllowedActions.group ? styles.disabled : ''}`}
                  >
                    <Parentheses size={16} />
                    Group
                  </button>
                </div>
              </div>

              <div className={styles.formulaTreeSection}>
                <h4 className={styles.formulaTreeTitle}>Formula Tree:</h4>
                <div className={styles.formulaTreeContainer}>
                  {state?.nodes.filter(node => !node.parentId).length === 0 ? (
                    <div className={styles.emptyState}>
                      <Info size={48} className={styles.emptyStateIcon} />
                      <p className={styles.emptyStateTitle}>Start Building Your Formula</p>
                      <p className={styles.emptyStateDescription}>Click the buttons above to add elements to your formula</p>
                      <div className={styles.emptyStateTips}>
                        <p>• Click on any element to add nested components inside it</p>
                        <p>• Use operators to connect attributes and values</p>
                        <p>• Use functions for mathematical operations</p>
                        <p>• Use groups to control order of operations</p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.nodeContainer}>
                      {state?.nodes.filter(node => !node.parentId).map(node => renderNode(node))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {renderFormulaPreview()}

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className={styles.contextMenuHeader}>
            {`Insert ${contextMenu.position} this element:`}
          </div>
          <button
            onClick={() => handleContextMenuAction('attribute')}
            className={`${styles.contextMenuItem} ${styles.blue}`}
          >
            <Plus size={14} />
            Attribute
          </button>
          <button
            onClick={() => handleContextMenuAction('operator')}
            className={`${styles.contextMenuItem} ${styles.green}`}
          >
            <span className="text-sm font-mono">⚡</span>
            Operator
          </button>
          <button
            onClick={() => handleContextMenuAction('value')}
            className={`${styles.contextMenuItem} ${styles.orange}`}
          >
            <span className="text-sm">#</span>
            Value
          </button>
          <button
            onClick={() => handleContextMenuAction('function')}
            className={`${styles.contextMenuItem} ${styles.purple}`}
          >
            <Code size={14} />
            Function
          </button>
          <button
            onClick={() => handleContextMenuAction('group')}
            className={`${styles.contextMenuItem} ${styles.gray}`}
          >
            <Parentheses size={14} />
            Group
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu.show && (
        <div 
          className={styles.contextMenuOverlay} 
          onClick={hideContextMenu}
        />
      )}
    </div>
  );
}; 