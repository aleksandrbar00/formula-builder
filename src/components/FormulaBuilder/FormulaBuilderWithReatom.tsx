import React, { useEffect, useRef } from 'react';
import { useAtom, useAction } from '@reatom/npm-react';
import { Plus, X, Parentheses, Code, HelpCircle, Info, Edit3, Copy, RotateCcw, RotateCw, Save, Type } from 'lucide-react';
import { FormulaBuilderProps, FormulaNode } from './types';
import { getRootAllowedActions, generateFormulaString, generateId } from './utils';
import { FormulaNode as FormulaNodeComponent } from './FormulaNodeWithStore';
import { FormulaPreview } from './FormulaPreview';
import { ContextMenu } from './ContextMenu';
import styles from '../FormulaBuilder.module.css';

// Import all the store atoms and actions
import {
  // State atoms
  nodesAtom,
  selectedNodeIdAtom,
  formulaNameAtom,
  formulaDescriptionAtom,
  showHelpAtom,
  validationErrorsAtom,
  editModeAtom,
  textFormulaAtom,
  editingNodeIdAtom,
  historyAtom,
  historyIndexAtom,
  showQuickFixAtom,
  brokenConnectionsAtom,
  contextMenuAtom,
  formulaStateAtom,
  
  // Actions
  setShowHelpAction,
  setEditModeAction,
  setTextFormulaAction,
  setFormulaNameAction,
  setFormulaDescriptionAction,
  setSelectedNodeIdAction,
  addNodeAction,
  addNodeFromPositionAction,
  updateNodeAction,
  deleteNodeAction,
  undoAction,
  redoAction,
  initializeFormulaAction,
  validateFormulaAction,
  applyTextFormulaAction,
  setContextMenuAction,
  hideContextMenuAction,
  updateNodeWithFunctionAction,

} from '../../stores/formulaStore';

export const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  attributes,
  onFormulaChange,
  initialFormula
}) => {
  // Use Reatom atoms
  const [nodes] = useAtom(nodesAtom);
  const [selectedNodeId] = useAtom(selectedNodeIdAtom);
  const [formulaName] = useAtom(formulaNameAtom);
  const [formulaDescription] = useAtom(formulaDescriptionAtom);
  const [showHelp] = useAtom(showHelpAtom);
  const [validationErrors] = useAtom(validationErrorsAtom);
  const [editMode] = useAtom(editModeAtom);
  const [textFormula] = useAtom(textFormulaAtom);
  const [editingNodeId] = useAtom(editingNodeIdAtom);
  const [history] = useAtom(historyAtom);
  const [historyIndex] = useAtom(historyIndexAtom);
  const [showQuickFix] = useAtom(showQuickFixAtom);
  const [brokenConnections] = useAtom(brokenConnectionsAtom);
  const [contextMenu] = useAtom(contextMenuAtom);
  const [formulaState] = useAtom(formulaStateAtom);
  
  // Use Reatom actions
  const setShowHelp = useAction(setShowHelpAction);
  const setEditMode = useAction(setEditModeAction);
  const setTextFormula = useAction(setTextFormulaAction);
  const setFormulaName = useAction(setFormulaNameAction);
  const setFormulaDescription = useAction(setFormulaDescriptionAction);
  const setSelectedNodeId = useAction(setSelectedNodeIdAction);
  const addNode = useAction(addNodeAction);
  const addNodeFromPosition = useAction(addNodeFromPositionAction);
  const updateNode = useAction(updateNodeAction);
  const deleteNode = useAction(deleteNodeAction);
  const undo = useAction(undoAction);
  const redo = useAction(redoAction);
  const initializeFormula = useAction(initializeFormulaAction);
  const validateFormula = useAction(validateFormulaAction);
  const applyTextFormula = useAction(applyTextFormulaAction);
  const setContextMenu = useAction(setContextMenuAction);
  const hideContextMenu = useAction(hideContextMenuAction);
  const updateNodeWithFunction = useAction(updateNodeWithFunctionAction);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize formula on mount
  useEffect(() => {
    if (initialFormula) {
      initializeFormula(initialFormula);
    }
  }, [initialFormula]); // Removed initializeFormula from deps

  // Handle formula changes
  useEffect(() => {
    onFormulaChange(formulaState);
  }, [formulaState]); // Only call onFormulaChange
  
  // Handle validation separately when nodes change
  useEffect(() => {
    validateFormula(attributes);
  }, [nodes, attributes]);

  // Initialize text formula when switching to text mode
  useEffect(() => {
    if (editMode === 'text') {
      const generatedFormula = generateFormulaString(
        nodes.filter(node => !node.parentId), 
        attributes, 
        nodes
      );
      setTextFormula(generatedFormula);
    }
  }, [editMode, nodes, attributes]); // Removed setTextFormula from deps

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
  }, [contextMenu.show, hideContextMenu]);

  const copyFormula = () => {
    const formulaString = generateFormulaString(
      nodes.filter(node => !node.parentId), 
      attributes, 
      nodes
    );
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

  const handleApplyTextFormula = () => {
    try {
      applyTextFormula(textFormula, attributes);
    } catch (error) {
      console.error('Failed to parse formula:', error);
      alert('Неверный формат формулы. Пожалуйста, проверьте синтаксис.');
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

  const handleContextMenuAction = (type: FormulaNode['type']) => {
    addNodeFromPosition(type, contextMenu.position, contextMenu.nodeId);
    hideContextMenu();
  };

  const rootAllowedActions = getRootAllowedActions(nodes);

  const renderNode = (node: FormulaNode, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const childNodes = nodes.filter(n => n.parentId === node.id);
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
        allNodes={nodes}
        onSelect={setSelectedNodeId}
        onUpdate={updateNode}
        onDelete={deleteNode}
        onAddNode={addNode}
        onContextMenu={showContextMenu}
        generateId={generateId} // Keep for compatibility
        setState={() => {}} // This is no longer needed with Reatom
      />
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Конструктор математических формул</h2>
          <div className={styles.headerButtons}>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`${styles.button} ${styles.blue}`}
            >
              <HelpCircle size={16} />
              {showHelp ? 'Скрыть справку' : 'Показать справку'}
            </button>
          </div>
        </div>
        
        {showHelp && (
          <div className={styles.helpModal}>
            <h3 className={styles.helpTitle}>Как создавать математические формулы</h3>
            <div className={styles.helpGrid}>
              <div className={styles.helpSection}>
                <h4>Основные операции:</h4>
                <ul className={styles.helpList}>
                  <li><strong>Атрибуты:</strong> Выберите из полей данных</li>
                  <li><strong>Математические операторы:</strong> +, -, *, /, ** (степень), % (остаток)</li>
                  <li><strong>Логические операторы:</strong> AND, OR, NOT, ==, !=, &gt;, &lt;, &gt;=, &lt;=</li>
                  <li><strong>Значения:</strong> Введите постоянные числа</li>
                  <li><strong>Математические функции:</strong> Математические операции (1-2 аргумента)</li>
                  <li><strong>Логические функции:</strong> IF, AND, OR, NOT, ISNULL, ISNOTNULL</li>
                  <li><strong>Группы:</strong> Используйте скобки для порядка операций</li>
                </ul>
              </div>
              <div className={styles.helpSection}>
                <h4>Примеры:</h4>
                <ul className={styles.helpList}>
                  <li><code>Price * Quantity</code> - Базовое умножение</li>
                  <li><code>sqrt(Revenue)</code> - Квадратный корень дохода</li>
                  <li><code>(Price - Cost) * 0.2</code> - Расчет наценки 20%</li>
                  <li><code>abs(Profit)</code> - Абсолютное значение прибыли</li>
                  <li><code>min(Price, Cost)</code> - Минимум из двух значений</li>
                  <li><code>max(Revenue, 1000)</code> - Максимум дохода и 1000</li>
                  <li><code>pow(2, 3)</code> - 2 в степени 3</li>
                  <li><code>Age &gt; 18 AND Income &gt; 50000</code> - Логическое условие</li>
                  <li><code>IF(VIP == true, Price * 0.9, Price)</code> - Условное ценообразование</li>
                  <li><code>NOT ISNULL(Email)</code> - Проверка существования email</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.formGrid}>
          <div>
            <label className={styles.formField}>
              Название формулы
            </label>
            <input
              type="text"
              value={formulaName}
              onChange={(e) => setFormulaName(e.target.value)}
              className={styles.formInput}
              placeholder="например, общий_доход"
            />
          </div>
          
          <div>
            <label className={styles.formField}>
              Описание
            </label>
            <input
              type="text"
              value={formulaDescription}
              onChange={(e) => setFormulaDescription(e.target.value)}
              className={styles.formInput}
              placeholder="например, Рассчитать общий доход от цены и количества"
            />
          </div>
        </div>
      </div>

      {/* Edit Mode Toggle */}
      <div className={styles.editModeSection}>
        <div className={styles.editModeHeader}>
          <h3 className={styles.editModeTitle}>Конструирование формулы</h3>
          <div className={styles.editModeButtons}>
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`${styles.iconButton} ${historyIndex > 0 ? styles.enabled : styles.disabled}`}
              title="Отменить"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`${styles.iconButton} ${historyIndex < history.length - 1 ? styles.enabled : styles.disabled}`}
              title="Повторить"
            >
              <RotateCw size={16} />
            </button>
            <button
              onClick={copyFormula}
              className={`${styles.iconButton} ${styles.enabled}`}
              title="Копировать формулу"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => setEditMode(editMode === 'visual' ? 'text' : 'visual')}
              className={`${styles.modeToggleButton} ${editMode === 'text' ? styles.text : styles.visual}`}
            >
              {editMode === 'text' ? <Edit3 size={16} /> : <Type size={16} />}
              {editMode === 'text' ? 'Визуальный режим' : 'Текстовый режим'}
            </button>
          </div>
        </div>

        {editMode === 'text' ? (
          <div className={styles.textModeSection}>
            <div>
              <label className={styles.formField}>
                Редактировать формулу как текст
              </label>
              <textarea
                ref={textAreaRef}
                value={textFormula}
                onChange={(e) => setTextFormula(e.target.value)}
                className={styles.textArea}
                placeholder="Введите вашу формулу здесь... например, Price * Quantity + 100"
              />
              <div className={styles.textAreaHint}>
                Используйте имена атрибутов в фигурных скобках: {'{Price}'}, {'{Quantity}'}
              </div>
            </div>
            <div className={styles.textModeButtons}>
              <button
                onClick={handleApplyTextFormula}
                className={`${styles.textModeButton} ${styles.primary}`}
              >
                Применить формулу
              </button>
              <button
                onClick={pasteFormula}
                className={`${styles.textModeButton} ${styles.secondary}`}
              >
                Вставить из буфера
              </button>
              <button
                onClick={() => setEditMode('visual')}
                className={`${styles.textModeButton} ${styles.cancel}`}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.visualModeSection}>
              <div className={styles.rootElementsSection}>
                <h4 className={styles.rootElementsTitle}>Добавить корневые элементы:</h4>
                <div className={styles.rootElementsButtons}>
                  <button
                    onClick={() => addNode('attribute')}
                    disabled={!rootAllowedActions.attribute}
                    className={`${styles.rootElementButton} ${styles.attribute} ${!rootAllowedActions.attribute ? styles.disabled : ''}`}
                  >
                    <Plus size={16} />
                    Атрибут
                  </button>
                  
                  <button
                    onClick={() => addNode('operator')}
                    disabled={!rootAllowedActions.operator}
                    className={`${styles.rootElementButton} ${styles.operator} ${!rootAllowedActions.operator ? styles.disabled : ''}`}
                  >
                    <span className="text-sm font-mono">⚡</span>
                    Оператор
                  </button>
                  
                  <button
                    onClick={() => addNode('function')}
                    disabled={!rootAllowedActions.function}
                    className={`${styles.rootElementButton} ${styles.function} ${!rootAllowedActions.function ? styles.disabled : ''}`}
                  >
                    <Code size={16} />
                    Функция
                  </button>
                  
                  <button
                    onClick={() => addNode('value')}
                    disabled={!rootAllowedActions.value}
                    className={`${styles.rootElementButton} ${styles.value} ${!rootAllowedActions.value ? styles.disabled : ''}`}
                  >
                    <span className="text-sm">#</span>
                    Значение
                  </button>
                  
                  <button
                    onClick={() => addNode('group')}
                    disabled={!rootAllowedActions.group}
                    className={`${styles.rootElementButton} ${styles.group} ${!rootAllowedActions.group ? styles.disabled : ''}`}
                  >
                    <Parentheses size={16} />
                    Группа
                  </button>
                </div>
              </div>

              <div className={styles.formulaTreeSection}>
                <h4 className={styles.formulaTreeTitle}>Дерево формулы:</h4>
                <div className={styles.formulaTreeContainer}>
                  {nodes.filter(node => !node.parentId).length === 0 ? (
                    <div className={styles.emptyState}>
                      <Info size={48} className={styles.emptyStateIcon} />
                      <p className={styles.emptyStateTitle}>Начните создавать вашу формулу</p>
                      <p className={styles.emptyStateDescription}>Нажмите кнопки выше, чтобы добавить элементы в формулу</p>
                      <div className={styles.emptyStateTips}>
                        <p>• Нажмите на любой элемент, чтобы добавить вложенные компоненты внутрь него</p>
                        <p>• Используйте операторы для соединения атрибутов и значений</p>
                        <p>• Используйте функции для математических операций</p>
                        <p>• Используйте группы для контроля порядка операций</p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.nodeContainer}>
                      {nodes.filter(node => !node.parentId).map(node => renderNode(node))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <FormulaPreview
        nodes={nodes}
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