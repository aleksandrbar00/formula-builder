import React from 'react';
import { useAction } from '@reatom/npm-react';
import { Plus, X, Parentheses, Code } from 'lucide-react';
import { FormulaNode as FormulaNodeType, MathOperator, MathFunction, LogicalOperator, LogicalFunction } from './types';
import { ALL_OPERATORS, ALL_FUNCTIONS, FUNCTION_SIGNATURES, OPERATOR_DESCRIPTIONS } from './types';
import { getAllowedActions, generateId } from './utils';
import styles from '../FormulaBuilder.module.css';
import { 
  updateNodeAction, 
  addNodeAction, 
  setSelectedNodeIdAction,
  setNodesAction,
  nodesAtom,
  updateNodeWithFunctionAction
} from '../../stores/formulaStore';

interface FormulaNodeProps {
  node: FormulaNodeType;
  depth: number;
  attributes: Array<{ id: string; name: string; type: string }>;
  isSelected: boolean;
  isInBrokenConnection: boolean;
  childNodes: FormulaNodeType[];
  allNodes: FormulaNodeType[];
  onSelect: (nodeId: string) => void;
  onUpdate: (nodeId: string, updates: Partial<FormulaNodeType>) => void;
  onDelete: (nodeId: string) => void;
  onAddNode: (type: FormulaNodeType['type'], parentId?: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string, position: 'before' | 'after') => void;
  generateId: () => string; // Keep for compatibility but won't use
  setState: (updater: (prev: any) => any) => void; // Keep for compatibility but won't use
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
}) => {
  // Use Reatom actions directly for complex operations that need store access
  const updateNode = useAction(updateNodeAction);
  const addNode = useAction(addNodeAction);
  const setSelectedNodeId = useAction(setSelectedNodeIdAction);
  const setNodes = useAction(setNodesAction);
  const updateNodeWithFunction = useAction(updateNodeWithFunctionAction);

  const allowedActions = getAllowedActions(node, allNodes);

  const handleFunctionChange = (selectedFunction: MathFunction | LogicalFunction) => {
    // Use the store action that handles both function update and argument group creation
    updateNodeWithFunction(node.id, { function: selectedFunction });
  };

  const addChildNode = (type: FormulaNodeType['type'], parentId: string) => {
    const newNode: FormulaNodeType = {
      id: generateId(),
      type,
      parentId
    };
    
    const updatedNodes = [...allNodes, newNode];
    setNodes(updatedNodes);
    setSelectedNodeId(newNode.id);
  };

  const handleCreateArgument = (argumentIndex: number, initialType: FormulaNodeType['type'] = 'attribute') => {
    // Create argument group and add initial child
    const newGroup: FormulaNodeType = {
      id: generateId(),
      type: 'group',
      parentId: node.id,
      argumentIndex: argumentIndex
    };
    
    const newChild: FormulaNodeType = {
      id: generateId(),
      type: initialType,
      parentId: newGroup.id
    };
    
    // Add both group and child at once
    const updatedNodes = [...allNodes, newGroup, newChild];
    setNodes(updatedNodes);
    setSelectedNodeId(newChild.id);
  };

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
              <option value="">Выберите атрибут</option>
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
              <option value="">Выберите оператор</option>
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
                onChange={(e) => handleFunctionChange(e.target.value as MathFunction | LogicalFunction)}
                className={styles.nodeSelect}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Выберите функцию</option>
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
                          
                          {/* Show argument group content with proper actions */}
                          <div className={styles.functionArgContent}>
                            <div className={styles.functionArgActions}>
                              {existingArgGroup ? (
                                // If argument group exists, show full action panel
                                (() => {
                                  const argAllowedActions = getAllowedActions(existingArgGroup, allNodes);
                                  return (
                                    <>
                                      {argAllowedActions.attribute && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addChildNode('attribute', existingArgGroup.id);
                                          }}
                                          className={`${styles.addButton} ${styles.blue}`}
                                          title="Добавить атрибут"
                                        >
                                          <Plus size={14} />
                                        </button>
                                      )}
                                      
                                      {argAllowedActions.operator && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addChildNode('operator', existingArgGroup.id);
                                          }}
                                          className={`${styles.addButton} ${styles.green}`}
                                          title="Добавить оператор"
                                        >
                                          <span className="text-xs">⚡</span>
                                        </button>
                                      )}
                                      
                                      {argAllowedActions.function && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addChildNode('function', existingArgGroup.id);
                                          }}
                                          className={`${styles.addButton} ${styles.purple}`}
                                          title="Добавить функцию"
                                        >
                                          <span className="text-sm font-mono">⚡</span>
                                        </button>
                                      )}
                                      
                                      {argAllowedActions.value && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addChildNode('value', existingArgGroup.id);
                                          }}
                                          className={`${styles.addButton} ${styles.orange}`}
                                          title="Добавить значение"
                                        >
                                          <span className="text-xs">#</span>
                                        </button>
                                      )}
                                      
                                      {argAllowedActions.group && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addChildNode('group', existingArgGroup.id);
                                          }}
                                          className={`${styles.addButton} ${styles.gray}`}
                                          title="Добавить группу"
                                        >
                                          <span className="text-sm">#</span>
                                        </button>
                                      )}
                                    </>
                                  );
                                })()
                              ) : (
                                // If no argument group, show simple create button
                                <button
                                  className={styles.functionArgButton}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleCreateArgument(idx, 'attribute');
                                  }}
                                >
                                  + Добавить элемент
                                </button>
                              )}
                            </div>
                          </div>
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
                        <span className={styles.functionArgLabel}>Сначала выберите функцию</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {node.type === 'value' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={node.value || ''}
              onChange={(e) => onUpdate(node.id, { value: Number(e.target.value) })}
              className={styles.nodeInput}
              placeholder="Введите число"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {node.type === 'group' && (
          <div className="flex items-center gap-2">
            <Parentheses size={16} />
            {typeof node.argumentIndex === 'number' ? (
              // This is a function argument group - show meaningful label
              (() => {
                const parentFunction = allNodes.find(n => n.id === node.parentId && n.type === 'function');
                if (parentFunction && parentFunction.function) {
                  const sig = FUNCTION_SIGNATURES[parentFunction.function];
                  if (sig && sig.labels && sig.labels[node.argumentIndex]) {
                    return <span className={styles.argumentLabel}>{sig.labels[node.argumentIndex]}</span>;
                  }
                }
                // Fallback to generic label if function signature not found
                return <span className={styles.argumentLabel}>Аргумент {node.argumentIndex + 1}</span>;
              })()
            ) : (
              // Regular group - show "Группа"
              <span>Группа</span>
            )}
          </div>
        )}

        <div className={styles.nodeActions}>
          {allowedActions.attribute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('attribute', node.id);
              }}
              className={`${styles.actionButton} ${styles.attribute}`}
              title="Добавить атрибут"
            >
              <Plus size={12} />
            </button>
          )}
          
          {allowedActions.operator && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('operator', node.id);
              }}
              className={`${styles.actionButton} ${styles.operator}`}
              title="Добавить оператор"
            >
              <span className="text-xs">⚡</span>
            </button>
          )}
          
          {allowedActions.function && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('function', node.id);
              }}
              className={`${styles.actionButton} ${styles.function}`}
              title="Добавить функцию"
            >
              <Code size={12} />
            </button>
          )}
          
          {allowedActions.value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('value', node.id);
              }}
              className={`${styles.actionButton} ${styles.value}`}
              title="Добавить значение"
            >
              <span className="text-xs">#</span>
            </button>
          )}
          
          {allowedActions.group && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode('group', node.id);
              }}
              className={`${styles.actionButton} ${styles.group}`}
              title="Добавить группу"
            >
              <Parentheses size={12} />
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className={`${styles.actionButton} ${styles.delete}`}
            title="Удалить"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Render child nodes */}
      {childNodes.length > 0 && (
        <div className="ml-4">
          {childNodes.map(child => (
            <FormulaNode
              key={child.id}
              node={child}
              depth={depth + 1}
              attributes={attributes}
              isSelected={false} // Child selection will be handled by parent
              isInBrokenConnection={isInBrokenConnection}
              childNodes={allNodes.filter(n => n.parentId === child.id)}
              allNodes={allNodes}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddNode={onAddNode}
              onContextMenu={onContextMenu}
              generateId={() => ''}
              setState={() => {}}
            />
          ))}
        </div>
      )}


    </div>
  );
};