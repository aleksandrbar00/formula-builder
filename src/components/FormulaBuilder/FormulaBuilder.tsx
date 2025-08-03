import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Parentheses, Code, HelpCircle, Info, Edit3, Copy, RotateCcw, RotateCw, Save, Type } from 'lucide-react';
import { FormulaBuilderProps, FormulaBuilderState, FormulaNode } from './types';
import { generateId, validateFormula, getRootAllowedActions, parseTextFormula } from './utils';
import { FormulaNode as FormulaNodeComponent } from './FormulaNode';
import { FormulaPreview } from './FormulaPreview';
import { ContextMenu } from './ContextMenu';
import styles from '../FormulaBuilder.module.css';

export const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  attributes,
  onFormulaChange,
  initialFormula
}) => {
  const [state, setState] = useState<FormulaBuilderState>({
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
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<FormulaBuilderState[]>([]);
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
    onFormulaChange(state);
    const { errors, brokenConnections } = validateFormula(state.nodes, attributes);
    setValidationErrors(errors);
    setBrokenConnections(brokenConnections);
    setShowQuickFix(brokenConnections.length > 0);
    addToHistory(state);
  }, [state, onFormulaChange, attributes]);

  // Initialize text formula when switching to text mode
  useEffect(() => {
    if (editMode === 'text') {
      setTextFormula(generateFormulaString(state.nodes.filter(node => !node.parentId), attributes, state.nodes));
    }
  }, [editMode, state.nodes, attributes]);

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

  const generateFormulaString = (nodes: FormulaNode[], attrs: Array<{ id: string; name: string; type: string }>, allNodes: FormulaNode[]): string => {
    return nodes.map(node => {
      switch (node.type) {
        case 'attribute':
          const attr = attrs.find(a => a.id === node.attributeId);
          return attr ? `{${attr.name}}` : '{attribute}';
        case 'operator':
          return node.operator || '';
        case 'function':
          const childNodes = allNodes.filter(n => n.parentId === node.id);
          return node.function ? `${node.function}(${generateFormulaString(childNodes, attrs, allNodes)})` : 'function(...)';
        case 'value':
          return node.value?.toString() || '0';
        case 'group':
          const groupChildren = allNodes.filter(n => n.parentId === node.id);
          return `(${generateFormulaString(groupChildren, attrs, allNodes)})`;
        default:
          return '';
      }
    }).join(' ');
  };

  const addToHistory = (newState: FormulaBuilderState) => {
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

  const addNode = (type: FormulaNode['type'], parentId?: string, insertAfterId?: string) => {
    const newNode: FormulaNode = {
      id: generateId(),
      type,
      parentId
    };

    setState(prev => {
      if (insertAfterId) {
        const nodeIndex = prev.nodes.findIndex(node => node.id === insertAfterId);
        const newNodes = [...prev.nodes];
        newNodes.splice(nodeIndex + 1, 0, newNode);
        return {
          ...prev,
          nodes: newNodes,
          selectedNodeId: newNode.id
        };
      } else {
        return {
          ...prev,
          nodes: [...prev.nodes, newNode],
          selectedNodeId: newNode.id
        };
      }
    });
  };

  const addNodeFromPosition = (type: FormulaNode['type'], position: 'before' | 'after', targetNodeId: string) => {
    const newNode: FormulaNode = {
      id: generateId(),
      type
    };

    setState(prev => {
      const targetNode = prev.nodes.find(node => node.id === targetNodeId);
      if (!targetNode) return prev;

      newNode.parentId = targetNode.parentId;

      const targetIndex = prev.nodes.findIndex(node => node.id === targetNodeId);
      const newNodes = [...prev.nodes];
      
      if (position === 'before') {
        newNodes.splice(targetIndex, 0, newNode);
      } else {
        newNodes.splice(targetIndex + 1, 0, newNode);
      }

      return {
        ...prev,
        nodes: newNodes,
        selectedNodeId: newNode.id
      };
    });
  };

  const updateNode = (nodeId: string, updates: Partial<FormulaNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  };

  const deleteNode = (nodeId: string) => {
    setState(prev => {
      const newNodes = prev.nodes.filter(node => node.id !== nodeId);
      return {
        ...prev,
        nodes: newNodes,
        selectedNodeId: prev.selectedNodeId === nodeId ? undefined : prev.selectedNodeId
      };
    });
  };

  const copyFormula = () => {
    const formulaString = generateFormulaString(state.nodes.filter(node => !node.parentId), attributes, state.nodes);
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
      const nodes = parseTextFormula(textFormula, attributes);
      setState(prev => ({
        ...prev,
        nodes,
        selectedNodeId: undefined
      }));
      setEditMode('visual');
    } catch (error) {
      console.error('Failed to parse formula:', error);
      alert('Invalid formula format. Please check your syntax.');
    }
  };

  const quickFixConnection = (beforeId: string, afterId: string, operator: any) => {
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

  const rootAllowedActions = getRootAllowedActions(state.nodes);

  const renderNode = (node: FormulaNode, depth: number = 0) => {
    const isSelected = state.selectedNodeId === node.id;
    const childNodes = state.nodes.filter(n => n.parentId === node.id);
    const isInBrokenConnection = brokenConnections.some(conn => 
      conn.before === node.id || conn.after === node.id
    );

    return (
      <FormulaNodeComponent
        key={node.id}
        node={node}
        depth={depth}
        attributes={attributes}
        isSelected={isSelected}
        isInBrokenConnection={isInBrokenConnection}
        childNodes={childNodes}
        allNodes={state.nodes}
        onSelect={(nodeId) => setState(prev => ({ ...prev, selectedNodeId: nodeId }))}
        onUpdate={updateNode}
        onDelete={deleteNode}
        onAddNode={addNode}
        onContextMenu={showContextMenu}
        generateId={generateId}
        setState={setState}
      />
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Math Formula Builder</h2>
          <div className={styles.headerButtons}>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`${styles.button} ${styles.blue}`}
            >
              <HelpCircle size={16} />
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
          </div>
        </div>
        
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
              value={state.formulaName}
              onChange={(e) => setState(prev => ({ ...prev, formulaName: e.target.value }))}
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
              value={state.formulaDescription}
              onChange={(e) => setState(prev => ({ ...prev, formulaDescription: e.target.value }))}
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
                  {state.nodes.filter(node => !node.parentId).length === 0 ? (
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
                      {state.nodes.filter(node => !node.parentId).map(node => renderNode(node))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <FormulaPreview
        nodes={state.nodes}
        attributes={attributes}
        validationErrors={validationErrors}
        brokenConnections={brokenConnections}
        showQuickFix={showQuickFix}
        onQuickFix={quickFixConnection}
      />

      <ContextMenu
        show={contextMenu.show}
        x={contextMenu.x}
        y={contextMenu.y}
        position={contextMenu.position}
        onAction={handleContextMenuAction}
        onClose={hideContextMenu}
      />
    </div>
  );
}; 