import { atom, action } from '@reatom/core';
import { FormulaBuilderState, FormulaNode } from '../components/FormulaBuilder/types';
import { generateId, validateFormula, parseTextFormula } from '../components/FormulaBuilder/utils';

// Initial state
const initialState: FormulaBuilderState = {
  nodes: [],
  selectedNodeId: undefined,
  formulaName: '',
  formulaDescription: '',
};

// Base atoms for each piece of state
export const nodesAtom = atom<FormulaNode[]>([], 'nodes');
export const selectedNodeIdAtom = atom<string | undefined>(undefined, 'selectedNodeId');
export const formulaNameAtom = atom<string>('', 'formulaName');
export const formulaDescriptionAtom = atom<string>('', 'formulaDescription');

// UI state atoms
export const showHelpAtom = atom<boolean>(false, 'showHelp');
export const validationErrorsAtom = atom<string[]>([], 'validationErrors');
export const editModeAtom = atom<'visual' | 'text'>('visual', 'editMode');
export const textFormulaAtom = atom<string>('', 'textFormula');
export const editingNodeIdAtom = atom<string | null>(null, 'editingNodeId');
export const historyAtom = atom<FormulaBuilderState[]>([], 'history');
export const historyIndexAtom = atom<number>(-1, 'historyIndex');
export const showQuickFixAtom = atom<boolean>(false, 'showQuickFix');
export const brokenConnectionsAtom = atom<{before: string, after: string}[]>([], 'brokenConnections');

// Context menu state
export const contextMenuAtom = atom<{
  show: boolean;
  x: number;
  y: number;
  nodeId: string;
  position: 'before' | 'after';
}>({
  show: false,
  x: 0,
  y: 0,
  nodeId: '',
  position: 'after'
}, 'contextMenu');

// Computed atom for the complete formula state
export const formulaStateAtom = atom((ctx) => ({
  nodes: ctx.spy(nodesAtom),
  selectedNodeId: ctx.spy(selectedNodeIdAtom),
  formulaName: ctx.spy(formulaNameAtom),
  formulaDescription: ctx.spy(formulaDescriptionAtom),
}), 'formulaState');

// Actions for updating state
export const setNodesAction = action((ctx, nodes: FormulaNode[]) => {
  nodesAtom(ctx, nodes);
}, 'setNodes');

export const setSelectedNodeIdAction = action((ctx, nodeId: string | undefined) => {
  selectedNodeIdAtom(ctx, nodeId);
}, 'setSelectedNodeId');

export const setFormulaNameAction = action((ctx, name: string) => {
  formulaNameAtom(ctx, name);
}, 'setFormulaName');

export const setFormulaDescriptionAction = action((ctx, description: string) => {
  formulaDescriptionAtom(ctx, description);
}, 'setFormulaDescription');

export const setShowHelpAction = action((ctx, show: boolean) => {
  showHelpAtom(ctx, show);
}, 'setShowHelp');

export const setValidationErrorsAction = action((ctx, errors: string[]) => {
  validationErrorsAtom(ctx, errors);
}, 'setValidationErrors');

export const setEditModeAction = action((ctx, mode: 'visual' | 'text') => {
  editModeAtom(ctx, mode);
}, 'setEditMode');

export const setTextFormulaAction = action((ctx, formula: string) => {
  textFormulaAtom(ctx, formula);
}, 'setTextFormula');

export const setEditingNodeIdAction = action((ctx, nodeId: string | null) => {
  editingNodeIdAtom(ctx, nodeId);
}, 'setEditingNodeId');

export const setBrokenConnectionsAction = action((ctx, connections: {before: string, after: string}[]) => {
  brokenConnectionsAtom(ctx, connections);
}, 'setBrokenConnections');

export const setShowQuickFixAction = action((ctx, show: boolean) => {
  showQuickFixAtom(ctx, show);
}, 'setShowQuickFix');

export const setContextMenuAction = action((ctx, contextMenu: {
  show: boolean;
  x: number;
  y: number;
  nodeId: string;
  position: 'before' | 'after';
}) => {
  contextMenuAtom(ctx, contextMenu);
}, 'setContextMenu');

// History actions
export const addToHistoryAction = action((ctx, state: FormulaBuilderState) => {
  const currentHistory = ctx.get(historyAtom);
  const currentIndex = ctx.get(historyIndexAtom);
  
  const newHistory = currentHistory.slice(0, currentIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(state))); // Deep copy
  
  historyAtom(ctx, newHistory);
  historyIndexAtom(ctx, newHistory.length - 1);
}, 'addToHistory');

export const undoAction = action((ctx) => {
  const currentIndex = ctx.get(historyIndexAtom);
  const history = ctx.get(historyAtom);
  
  if (currentIndex > 0) {
    const newIndex = currentIndex - 1;
    const previousState = history[newIndex];
    
    historyIndexAtom(ctx, newIndex);
    nodesAtom(ctx, previousState.nodes);
    selectedNodeIdAtom(ctx, previousState.selectedNodeId);
    formulaNameAtom(ctx, previousState.formulaName);
    formulaDescriptionAtom(ctx, previousState.formulaDescription);
  }
}, 'undo');

export const redoAction = action((ctx) => {
  const currentIndex = ctx.get(historyIndexAtom);
  const history = ctx.get(historyAtom);
  
  if (currentIndex < history.length - 1) {
    const newIndex = currentIndex + 1;
    const nextState = history[newIndex];
    
    historyIndexAtom(ctx, newIndex);
    nodesAtom(ctx, nextState.nodes);
    selectedNodeIdAtom(ctx, nextState.selectedNodeId);
    formulaNameAtom(ctx, nextState.formulaName);
    formulaDescriptionAtom(ctx, nextState.formulaDescription);
  }
}, 'redo');

// Complex actions for node operations
export const addNodeAction = action((ctx, type: FormulaNode['type'], parentId?: string, insertAfterId?: string) => {
  const currentNodes = ctx.get(nodesAtom);
  
  // Save current state to history before making changes
  const currentState = {
    nodes: currentNodes,
    selectedNodeId: ctx.get(selectedNodeIdAtom),
    formulaName: ctx.get(formulaNameAtom),
    formulaDescription: ctx.get(formulaDescriptionAtom),
  };
  
  const newNode: FormulaNode = {
    id: generateId(),
    type,
    parentId
  };

  let newNodes: FormulaNode[];
  
  if (insertAfterId) {
    const nodeIndex = currentNodes.findIndex(node => node.id === insertAfterId);
    newNodes = [...currentNodes];
    newNodes.splice(nodeIndex + 1, 0, newNode);
  } else {
    newNodes = [...currentNodes, newNode];
  }

  nodesAtom(ctx, newNodes);
  selectedNodeIdAtom(ctx, newNode.id);
  
  // Add to history after changes
  addToHistoryAction(ctx, currentState);
}, 'addNode');

export const addNodeFromPositionAction = action((ctx, type: FormulaNode['type'], position: 'before' | 'after', targetNodeId: string) => {
  const currentNodes = ctx.get(nodesAtom);
  
  // Save current state to history before making changes
  const currentState = {
    nodes: currentNodes,
    selectedNodeId: ctx.get(selectedNodeIdAtom),
    formulaName: ctx.get(formulaNameAtom),
    formulaDescription: ctx.get(formulaDescriptionAtom),
  };
  
  const targetNode = currentNodes.find(node => node.id === targetNodeId);
  if (!targetNode) return;

  const newNode: FormulaNode = {
    id: generateId(),
    type,
    parentId: targetNode.parentId
  };

  const targetIndex = currentNodes.findIndex(node => node.id === targetNodeId);
  const newNodes = [...currentNodes];
  
  if (position === 'before') {
    newNodes.splice(targetIndex, 0, newNode);
  } else {
    newNodes.splice(targetIndex + 1, 0, newNode);
  }

  nodesAtom(ctx, newNodes);
  selectedNodeIdAtom(ctx, newNode.id);
  
  // Add to history after changes
  addToHistoryAction(ctx, currentState);
}, 'addNodeFromPosition');

export const updateNodeAction = action((ctx, nodeId: string, updates: Partial<FormulaNode>) => {
  const currentNodes = ctx.get(nodesAtom);
  
  // Save current state to history before making changes
  const currentState = {
    nodes: currentNodes,
    selectedNodeId: ctx.get(selectedNodeIdAtom),
    formulaName: ctx.get(formulaNameAtom),
    formulaDescription: ctx.get(formulaDescriptionAtom),
  };
  
  const newNodes = currentNodes.map(node => 
    node.id === nodeId ? { ...node, ...updates } : node
  );
  
  nodesAtom(ctx, newNodes);
  
  // Add to history after changes
  addToHistoryAction(ctx, currentState);
}, 'updateNode');

export const deleteNodeAction = action((ctx, nodeId: string) => {
  const currentNodes = ctx.get(nodesAtom);
  const currentSelectedId = ctx.get(selectedNodeIdAtom);
  
  // Save current state to history before making changes
  const currentState = {
    nodes: currentNodes,
    selectedNodeId: currentSelectedId,
    formulaName: ctx.get(formulaNameAtom),
    formulaDescription: ctx.get(formulaDescriptionAtom),
  };
  
  const newNodes = currentNodes.filter(node => node.id !== nodeId);
  
  nodesAtom(ctx, newNodes);
  
  if (currentSelectedId === nodeId) {
    selectedNodeIdAtom(ctx, undefined);
  }
  
  // Add to history after changes
  addToHistoryAction(ctx, currentState);
}, 'deleteNode');

export const initializeFormulaAction = action((ctx, initialFormula?: Partial<FormulaBuilderState>) => {
  if (initialFormula) {
    if (initialFormula.nodes) nodesAtom(ctx, initialFormula.nodes);
    if (initialFormula.selectedNodeId !== undefined) selectedNodeIdAtom(ctx, initialFormula.selectedNodeId);
    if (initialFormula.formulaName !== undefined) formulaNameAtom(ctx, initialFormula.formulaName);
    if (initialFormula.formulaDescription !== undefined) formulaDescriptionAtom(ctx, initialFormula.formulaDescription);
  }
}, 'initializeFormula');

export const validateFormulaAction = action((ctx, attributes: Array<{ id: string; name: string; type: string }>) => {
  const nodes = ctx.get(nodesAtom);
  const { errors, brokenConnections } = validateFormula(nodes, attributes);
  
  setValidationErrorsAction(ctx, errors);
  setBrokenConnectionsAction(ctx, brokenConnections);
  setShowQuickFixAction(ctx, brokenConnections.length > 0);
}, 'validateFormula');

export const applyTextFormulaAction = action((ctx, textFormula: string, attributes: Array<{ id: string; name: string; type: string }>) => {
  try {
    const nodes = parseTextFormula(textFormula, attributes);
    nodesAtom(ctx, nodes);
    selectedNodeIdAtom(ctx, undefined);
    setEditModeAction(ctx, 'visual');
  } catch (error) {
    console.error('Failed to parse formula:', error);
    throw new Error('Invalid formula format. Please check the syntax.');
  }
}, 'applyTextFormula');

export const hideContextMenuAction = action((ctx) => {
  setContextMenuAction(ctx, { 
    show: false, 
    x: 0, 
    y: 0, 
    nodeId: '', 
    position: 'after' 
  });
}, 'hideContextMenu');

// Action to update a node and handle function argument group creation
export const updateNodeWithFunctionAction = action((ctx, nodeId: string, updates: Partial<FormulaNode>) => {
  const currentNodes = ctx.get(nodesAtom);
  
  // Save current state to history before making changes
  const currentState = {
    nodes: currentNodes,
    selectedNodeId: ctx.get(selectedNodeIdAtom),
    formulaName: ctx.get(formulaNameAtom),
    formulaDescription: ctx.get(formulaDescriptionAtom),
  };
  
  // Update the node
  const updatedNodes = currentNodes.map(node => 
    node.id === nodeId ? { ...node, ...updates } : node
  );
  
  // If we're setting a function, auto-create argument groups
  if (updates.function) {
    // Import function signatures (we need to import this at the top instead)
    const FUNCTION_SIGNATURES: Record<string, { arity: number | 'variadic' }> = {
      abs: { arity: 1 },
      sin: { arity: 1 },
      cos: { arity: 1 },
      tan: { arity: 1 },
      sqrt: { arity: 1 },
      log: { arity: 1 },
      exp: { arity: 1 },
      floor: { arity: 1 },
      ceil: { arity: 1 },
      round: { arity: 1 },
      pow: { arity: 2 },
      min: { arity: 2 },
      max: { arity: 2 },
      atan2: { arity: 2 },
      IF: { arity: 3 },
      AND: { arity: 'variadic' },
      OR: { arity: 'variadic' },
      NOT: { arity: 1 },
      ISNULL: { arity: 1 },
      ISNOTNULL: { arity: 1 }
    };
    
    const sig = FUNCTION_SIGNATURES[updates.function];
    
    if (sig && sig.arity !== 'variadic') {
      const slots = typeof sig.arity === 'number' ? sig.arity : 1;
      
      // Remove any existing argument groups for this function
      const nodesWithoutOldGroups = updatedNodes.filter(node => 
        !(node.parentId === nodeId && node.type === 'group' && typeof node.argumentIndex === 'number')
      );
      
      // Create new argument groups
      const newGroups: FormulaNode[] = [];
      for (let i = 0; i < slots; i++) {
        newGroups.push({
          id: generateId(),
          type: 'group',
          parentId: nodeId,
          argumentIndex: i
        });
      }
      
      nodesAtom(ctx, [...nodesWithoutOldGroups, ...newGroups]);
    } else {
      nodesAtom(ctx, updatedNodes);
    }
  } else {
    nodesAtom(ctx, updatedNodes);
  }
  
  // Add to history after changes
  addToHistoryAction(ctx, currentState);
}, 'updateNodeWithFunction');