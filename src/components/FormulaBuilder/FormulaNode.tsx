import React from 'react';
import { Plus, X, Parentheses, Code } from 'lucide-react';
import { FormulaNode as FormulaNodeType, MathOperator, MathFunction, LogicalOperator, LogicalFunction } from './types';
import { ALL_OPERATORS, ALL_FUNCTIONS, FUNCTION_SIGNATURES, OPERATOR_DESCRIPTIONS } from './types';
import { getAllowedActions } from './utils';
import styles from '../FormulaBuilder.module.css';

interface FormulaNodeProps {
  node: FormulaNodeType;
  depth: number;
  attributes: Array<{ id: string; name: string; type: string }>;
  isSelected: boolean;
  isInBrokenConnection: boolean;
  childNodes: FormulaNodeType[];
  allNodes: FormulaNodeType[]; // Add this to access all nodes
  onSelect: (nodeId: string) => void;
  onUpdate: (nodeId: string, updates: Partial<FormulaNodeType>) => void;
  onDelete: (nodeId: string) => void;
  onAddNode: (type: FormulaNodeType['type'], parentId?: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string, position: 'before' | 'after') => void;
  generateId: () => string;
  setState: (updater: (prev: any) => any) => void;
}

export const FormulaNode: React.FC<FormulaNodeProps> = ({
  node,
  depth,
  attributes,
  isSelected,
  isInBrokenConnection,
  childNodes,
  allNodes,
  onSelect,
  onUpdate,
  onDelete,
  onAddNode,
  onContextMenu,
  generateId,
  setState
}) => {
  const allowedActions = getAllowedActions(node, allNodes);

  return (
    <div className={styles.nodeContainer}>
      <div
        className={`${styles.nodeItem} ${isSelected ? styles.selected : ''} ${isInBrokenConnection ? styles.error : ''}`}
        style={{ marginLeft: `${depth * 20}px` }}
        onClick={() => onSelect(node.id)}
        onContextMenu={(e) => onContextMenu(e, node.id, 'after')}
      >
        {node.type === 'attribute' && (
          <div className="flex items-center gap-2">
            <select
              value={node.attributeId || ''}
              onChange={(e) => onUpdate(node.id, { attributeId: e.target.value })}
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
              onChange={(e) => onUpdate(node.id, { operator: e.target.value as MathOperator | LogicalOperator })}
              className={`${styles.nodeSelect} font-mono`}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Select operator</option>
              {ALL_OPERATORS.map(op => (
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
                onChange={(e) => {
                  const selectedFunction = e.target.value as MathFunction | LogicalFunction;
                  onUpdate(node.id, { function: selectedFunction });
                  
                  // Auto-create argument groups when function is selected
                  if (selectedFunction) {
                    const sig = FUNCTION_SIGNATURES[selectedFunction];
                    if (sig && sig.arity !== 'variadic') {
                      const slots = typeof sig.arity === 'number' ? sig.arity : 1;
                      
                      // Create argument groups for each slot
                      const newGroups: FormulaNodeType[] = [];
                      for (let i = 0; i < slots; i++) {
                        newGroups.push({
                          id: generateId(),
                          type: 'group',
                          parentId: node.id,
                          argumentIndex: i
                        });
                      }
                      
                      setState(prev => ({
                        ...prev!,
                        nodes: [...prev!.nodes, ...newGroups]
                      }));
                    }
                  }
                }}
                className={styles.nodeSelect}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select function</option>
                {ALL_FUNCTIONS.map(func => (
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
            
            {/* Render function arguments */}
            {(() => {
              const sig = FUNCTION_SIGNATURES[node.function || ''];
              const children = childNodes;
              
              if (sig) {
                const slots = sig.arity === 'variadic' ? Math.max(children.length + 1, 2) : sig.arity;
                return (
                  <div className={styles.functionArgs}>
                    {Array.from({ length: typeof slots === 'number' ? slots : children.length + 1 }).map((_, idx) => {
                      // Find existing argument group for this slot
                      const existingArgGroup = children.find(child => 
                        child.type === 'group' && child.argumentIndex === idx
                      );
                      
                      return (
                        <div key={idx} className={styles.functionArg}>
                          <div className={styles.functionArgHeader}>
                            <span className={styles.functionArgLabel}>{sig.labels[idx] || `Arg ${idx + 1}`}</span>
                          </div>
                          
                          {/* Show argument group content */}
                          {existingArgGroup && (
                            <div className={styles.functionArgContent}>
                              <div className={styles.functionArgActions}>
                                <button
                                  className={styles.functionArgButton}
                                  onClick={e => {
                                    e.stopPropagation();
                                    // Add empty attribute node as child of the group
                                    const newNode: FormulaNodeType = {
                                      id: generateId(),
                                      type: 'attribute',
                                      parentId: existingArgGroup.id
                                    };
                                    setState(prev => ({
                                      ...prev!,
                                      nodes: [...prev!.nodes, newNode],
                                      selectedNodeId: newNode.id
                                    }));
                                  }}
                                >
                                  + Add element
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              } else {
                return (
                  <div className={styles.functionArgs}>
                    <div className={styles.functionArg}>
                      <div className={styles.functionArgHeader}>
                        <span className={styles.functionArgLabel}>Argument</span>
                      </div>
                      
                      {children.length > 0 && (
                        <div className={styles.functionArgContent}>
                          <div className={styles.functionArgActions}>
                            <button
                              className={styles.functionArgButton}
                              onClick={e => {
                                e.stopPropagation();
                                // Add empty attribute node as child of the first group
                                const firstGroup = children.find(child => child.type === 'group');
                                if (firstGroup) {
                                  const newNode: FormulaNodeType = {
                                    id: generateId(),
                                    type: 'attribute',
                                    parentId: firstGroup.id
                                  };
                                  setState(prev => ({
                                    ...prev!,
                                    nodes: [...prev!.nodes, newNode],
                                    selectedNodeId: newNode.id
                                  }));
                                }
                              }}
                            >
                              + Add element
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
            onChange={(e) => onUpdate(node.id, { value: parseFloat(e.target.value) || 0 })}
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
                const newNode: FormulaNodeType = {
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
              onDelete(node.id);
            }}
            className={styles.deleteButton}
            title="Delete node"
          >
            <X size={14} />
          </button>
          
          {allowedActions.attribute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('attribute', node.id);
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
                onAddNode('operator', node.id);
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
                onAddNode('value', node.id);
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
                onAddNode('function', node.id);
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
                onAddNode('group', node.id);
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
          {childNodes.map(childNode => {
            const childChildNodes = allNodes.filter(n => n.parentId === childNode.id);
            return (
              <FormulaNode
                key={childNode.id}
                node={childNode}
                depth={depth + 1}
                attributes={attributes}
                isSelected={isSelected}
                isInBrokenConnection={isInBrokenConnection}
                childNodes={childChildNodes}
                allNodes={allNodes}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddNode={onAddNode}
                onContextMenu={onContextMenu}
                generateId={generateId}
                setState={setState}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}; 