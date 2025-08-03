# FormulaBuilder Components

This directory contains the refactored FormulaBuilder components, broken down into smaller, more manageable pieces for better maintainability and reusability.

## Structure

```
FormulaBuilder/
├── index.ts              # Main exports
├── types.ts              # TypeScript types and constants
├── utils.ts              # Utility functions
├── FormulaBuilder.tsx    # Main component (orchestrates everything)
├── FormulaNode.tsx       # Individual node component
├── FormulaPreview.tsx    # Formula preview and validation
├── ContextMenu.tsx       # Right-click context menu
└── README.md            # This file
```

## Components

### FormulaBuilder (Main Component)
The main orchestrator component that manages the overall state and coordinates between all sub-components.

**Props:**
- `attributes`: Array of available attributes
- `onFormulaChange`: Callback when formula changes
- `initialFormula`: Optional initial formula state

### FormulaNode
Renders individual formula nodes (attributes, operators, functions, values, groups).

**Features:**
- Handles node-specific rendering logic
- Manages node interactions (select, update, delete)
- Supports nested child nodes
- Context menu integration

### FormulaPreview
Displays the formula preview, validation errors, and quick fixes.

**Features:**
- Real-time formula string generation
- Validation error display
- Quick fix suggestions for broken connections

### ContextMenu
Right-click context menu for adding new nodes.

**Features:**
- Position-aware menu
- Add different types of nodes
- Click-outside-to-close functionality

## Types

### FormulaNode
```typescript
interface FormulaNode {
  id: string;
  type: 'attribute' | 'operator' | 'function' | 'value' | 'group';
  parentId?: string;
  attributeId?: string;
  operator?: MathOperator;
  function?: MathFunction;
  value?: number;
}
```

### FormulaBuilderState
```typescript
interface FormulaBuilderState {
  nodes: FormulaNode[];
  selectedNodeId?: string;
  formulaName: string;
  formulaDescription: string;
}
```

## Utilities

### generateId()
Generates unique IDs for nodes.

### generateFormulaString(nodes, attributes)
Converts formula nodes to a readable string representation.

### validateFormula(nodes, attributes)
Validates formula structure and returns errors and broken connections.

### parseTextFormula(text, attributes)
Parses text formula into node structure.

### getAllowedActions(node)
Returns which actions are allowed for a specific node type.

## Usage

```typescript
import { FormulaBuilder } from './FormulaBuilder';

const attributes = [
  { id: '1', name: 'Price', type: 'number' },
  { id: '2', name: 'Quantity', type: 'number' }
];

const handleFormulaChange = (formula) => {
  console.log('Formula changed:', formula);
};

<FormulaBuilder
  attributes={attributes}
  onFormulaChange={handleFormulaChange}
  initialFormula={{
    formulaName: 'Total Revenue',
    formulaDescription: 'Calculate total revenue'
  }}
/>
```

## Benefits of Refactoring

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be used independently
3. **Testability**: Easier to unit test individual components
4. **Readability**: Code is more organized and easier to understand
5. **Performance**: Better optimization opportunities with smaller components
6. **Type Safety**: Centralized types and better TypeScript support

## Migration

The original `FormulaBuilder.tsx` now re-exports the new refactored version, so existing code will continue to work without changes. 