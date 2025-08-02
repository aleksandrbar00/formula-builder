# SQL Segmentator - Formula Builder

A React component for building dynamic mathematical formulas using database attributes. Perfect for creating custom calculated fields in SQL segmentation applications.

## Features

### 🎯 Core Functionality
- **Visual Formula Builder**: Drag-and-drop interface for creating mathematical expressions
- **Attribute Integration**: Connect to your database columns and attributes
- **Mathematical Operations**: Support for basic arithmetic (+, -, *, /, **, %) and functions (abs, sin, cos, tan, sqrt, log, exp, floor, ceil, round)
- **Nested Expressions**: Create complex formulas with parentheses and grouping
- **Real-time Preview**: See your formula as you build it

### 🏗️ Two Builder Modes

#### Basic Builder
- Linear formula construction
- Simple drag-and-drop interface
- Perfect for straightforward formulas

#### Advanced Builder (Tree Structure)
- Hierarchical formula construction
- Expandable/collapsible nodes
- Better for complex nested expressions
- Visual tree representation

### 📊 Supported Formula Types

```typescript
// Simple arithmetic
{cards_sum} * {card_rates}

// Complex expressions
abs({income} - {expenses}) / {transaction_count}

// Mathematical functions
sqrt({credit_score} * {account_balance})

// Nested operations
({income} + {bonus}) * {tax_rate}
```

## Installation

```bash
npm install
npm start
```

## Usage

### Basic Implementation

```tsx
import { FormulaBuilder } from './components/FormulaBuilder';
import { Attribute } from './types/formula';

const attributes: Attribute[] = [
  { id: 'cards_sum', name: 'Cards Sum', type: 'number' },
  { id: 'card_rates', name: 'Card Rates', type: 'number' },
  // ... more attributes
];

function App() {
  const handleFormulaChange = (formula) => {
    console.log('Formula changed:', formula);
    // Send to your backend for processing
  };

  return (
    <FormulaBuilder
      attributes={attributes}
      onFormulaChange={handleFormulaChange}
    />
  );
}
```

### Advanced Implementation

```tsx
import { AdvancedFormulaBuilder } from './components/AdvancedFormulaBuilder';

function App() {
  return (
    <AdvancedFormulaBuilder
      attributes={attributes}
      onFormulaChange={handleFormulaChange}
      initialFormula={savedFormula}
    />
  );
}
```

## Component API

### FormulaBuilder Props

```typescript
interface FormulaBuilderProps {
  attributes: Attribute[];           // Available database attributes
  onFormulaChange: (formula: FormulaBuilderState) => void;  // Callback when formula changes
  initialFormula?: FormulaBuilderState;  // Pre-populate with existing formula
}
```

### Data Types

```typescript
interface Attribute {
  id: string;
  name: string;
  type: 'number' | 'string' | 'date';
  description?: string;
}

interface FormulaNode {
  id: string;
  type: 'attribute' | 'operator' | 'function' | 'value' | 'group';
  value?: string | number;
  operator?: MathOperator;
  function?: MathFunction;
  attributeId?: string;
  children?: FormulaNode[];
  parentId?: string;
}

interface FormulaBuilderState {
  nodes: FormulaNode[];
  selectedNodeId?: string;
  formulaName: string;
  formulaDescription?: string;
}
```

## Formula Examples

### Financial Calculations
```typescript
// Revenue per transaction
{total_revenue} / {transaction_count}

// Profit margin
({revenue} - {costs}) / {revenue} * 100

// Compound interest
{principal} * (1 + {rate}) ** {years}
```

### Customer Analytics
```typescript
// Customer lifetime value
{avg_order_value} * {purchase_frequency} * {customer_lifespan}

// Risk score
sqrt({credit_score} * {income}) / {debt_ratio}

// Engagement score
({login_frequency} + {feature_usage} * 2) / 3
```

### Business Metrics
```typescript
// Conversion rate
{conversions} / {visitors} * 100

// Average order value
{total_revenue} / {order_count}

// Customer acquisition cost
{marketing_spend} / {new_customers}
```

## Backend Integration

The formula builder generates a structured representation that can be easily converted to SQL or other query languages:

```typescript
// Example output structure
{
  formulaName: "revenue_per_transaction",
  formulaDescription: "Average revenue per transaction",
  nodes: [
    { type: "attribute", attributeId: "total_revenue" },
    { type: "operator", operator: "/" },
    { type: "attribute", attributeId: "transaction_count" }
  ]
}

// Convert to SQL
SELECT 
  total_revenue / transaction_count as revenue_per_transaction
FROM customers
```

## Customization

### Adding New Functions
```typescript
// In types/formula.ts
export type MathFunction = 'abs' | 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'exp' | 'floor' | 'ceil' | 'round' | 'custom_function';
```

### Styling
The component uses Tailwind CSS classes and can be customized by overriding the className props or modifying the Tailwind configuration.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 