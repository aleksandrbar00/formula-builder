import React, { useState } from 'react';
import { FormulaBuilder } from './FormulaBuilder';
import { LogicalFormulaBuilder } from './LogicalFormulaBuilder';
import { MixedFormulaBuilder } from './MixedFormulaBuilder';
import { Attribute, FormulaBuilderState, FormulaNode } from '../types/formula';
import { ToggleLeft, ToggleRight, Calculator, Zap, Layers } from 'lucide-react';
import { clsx } from 'clsx';

const sampleAttributes: Attribute[] = [
  { id: 'cards_sum', name: 'Cards Sum', type: 'number', description: 'Total sum of all cards' },
  { id: 'card_rates', name: 'Card Rates', type: 'number', description: 'Average card rates' },
  { id: 'transaction_count', name: 'Transaction Count', type: 'number', description: 'Number of transactions' },
  { id: 'customer_age', name: 'Customer Age', type: 'number', description: 'Customer age in years' },
  { id: 'account_balance', name: 'Account Balance', type: 'number', description: 'Current account balance' },
  { id: 'credit_score', name: 'Credit Score', type: 'number', description: 'Customer credit score' },
  { id: 'income', name: 'Income', type: 'number', description: 'Annual income' },
  { id: 'expenses', name: 'Expenses', type: 'number', description: 'Monthly expenses' },
  { id: 'vip_status', name: 'VIP Status', type: 'boolean', description: 'VIP customer status' },
  { id: 'active_account', name: 'Active Account', type: 'boolean', description: 'Account is active' }
];

export const FormulaBuilderDemo: React.FC = () => {
  const [currentFormula, setCurrentFormula] = useState<FormulaBuilderState>({
    nodes: [],
    formulaName: '',
    formulaDescription: ''
  });

  const [savedFormulas, setSavedFormulas] = useState<FormulaBuilderState[]>([]);
  const [mode, setMode] = useState<'math' | 'logical' | 'mixed'>('math');

  const handleFormulaChange = (formula: FormulaBuilderState) => {
    setCurrentFormula(formula);
  };

  const handleSaveFormula = () => {
    if (currentFormula.formulaName && currentFormula.nodes.length > 0) {
      setSavedFormulas(prev => [...prev, currentFormula]);
      setCurrentFormula({
        nodes: [],
        formulaName: '',
        formulaDescription: ''
      });
    }
  };

  const handleLoadFormula = (formula: FormulaBuilderState) => {
    setCurrentFormula(formula);
  };

  const handleDeleteFormula = (index: number) => {
    setSavedFormulas(prev => prev.filter((_, i) => i !== index));
  };

  const generateFormulaString = (nodes: FormulaNode[]): string => {
    return nodes.map(node => {
      switch (node.type) {
        case 'attribute':
          const attr = sampleAttributes.find(a => a.id === node.attributeId);
          return attr ? `{${attr.name}}` : '{attribute}';
        case 'operator':
          return node.operator || '';
        case 'logical_operator':
          return node.logicalOperator || '';
        case 'function':
          return node.function ? `${node.function}(...)` : 'function(...)';
        case 'logical_function':
          return node.logicalFunction ? `${node.logicalFunction}(...)` : 'function(...)';
        case 'value':
          return node.value?.toString() || '0';
        case 'condition':
          const cond = node.condition;
          return cond ? `${cond.leftOperand} ${cond.operator} ${cond.rightOperand}` : 'condition';
        case 'group':
          return `(${generateFormulaString(node.children || [])})`;
        default:
          return '';
      }
    }).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SQL Segmentator - Formula Builder</h1>
          <p className="text-gray-600 mb-4">
            Build custom formulas using your database attributes. Create complex mathematical expressions
            and logical conditions for segmentation and analysis.
          </p>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Formula Mode:</span>
            <button
              onClick={() => setMode('math')}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                mode === 'math'
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              <Calculator size={16} />
              Math Formulas
            </button>
            <button
              onClick={() => setMode('logical')}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                mode === 'logical'
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              <Zap size={16} />
              Logical Conditions
            </button>
            <button
              onClick={() => setMode('mixed')}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                mode === 'mixed'
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              <Layers size={16} />
              Mixed Mode
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Formula Builder */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {mode === 'logical' ? (
                <LogicalFormulaBuilder
                  attributes={sampleAttributes}
                  onFormulaChange={handleFormulaChange}
                  initialFormula={currentFormula}
                />
              ) : mode === 'mixed' ? (
                <MixedFormulaBuilder
                  attributes={sampleAttributes}
                  onFormulaChange={handleFormulaChange}
                  initialFormula={currentFormula}
                />
              ) : (
                <FormulaBuilder
                  attributes={sampleAttributes}
                  onFormulaChange={handleFormulaChange}
                  initialFormula={currentFormula}
                />
              )}
              
              <div className="p-6 border-t">
                <button
                  onClick={handleSaveFormula}
                  disabled={!currentFormula.formulaName || currentFormula.nodes.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save Formula
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Attributes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Attributes</h3>
              <div className="space-y-2">
                {sampleAttributes.map(attr => (
                  <div key={attr.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium text-gray-900">{attr.name}</div>
                    <div className="text-sm text-gray-600">{attr.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Type: {attr.type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Formulas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Formulas</h3>
              {savedFormulas.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved formulas yet</p>
              ) : (
                <div className="space-y-3">
                  {savedFormulas.map((formula, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">{formula.formulaName}</div>
                        <button
                          onClick={() => handleDeleteFormula(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      {formula.formulaDescription && (
                        <div className="text-sm text-gray-600 mb-2">{formula.formulaDescription}</div>
                      )}
                      <div className="text-xs font-mono bg-white p-2 rounded border">
                        {generateFormulaString(formula.nodes)}
                      </div>
                      <button
                        onClick={() => handleLoadFormula(formula)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Usage Examples */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Examples</h3>
              <div className="space-y-3">
                {mode === 'math' ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="font-medium text-blue-900 mb-1">Simple Multiplication</div>
                      <div className="text-sm text-blue-700">{'{Cards Sum} * {Card Rates}'}</div>
                      <div className="text-xs text-blue-600 mt-1">Multiply total cards by average rate</div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-md">
                      <div className="font-medium text-green-900 mb-1">Complex Formula</div>
                      <div className="text-sm text-green-700">abs({'{Income}'} - {'{Expenses}'}) / {'{Transaction Count}'}</div>
                      <div className="text-xs text-green-600 mt-1">Absolute difference divided by transactions</div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-md">
                      <div className="font-medium text-purple-900 mb-1">With Functions</div>
                      <div className="text-sm text-purple-700">sqrt({'{Credit Score}'} * {'{Account Balance}'})</div>
                      <div className="text-xs text-purple-600 mt-1">Square root of credit score times balance</div>
                    </div>
                  </>
                ) : mode === 'logical' ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="font-medium text-blue-900 mb-1">Customer Segmentation</div>
                      <div className="text-sm text-blue-700">{'{Credit Score}'} &gt; 700 AND {'{Income}'} &gt; 50000</div>
                      <div className="text-xs text-blue-600 mt-1">High-value customers with good credit</div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-md">
                      <div className="font-medium text-green-900 mb-1">Complex Conditions</div>
                      <div className="text-sm text-green-700">({'{Age}'} &gt;= 25 AND {'{Income}'} &gt; 30000) OR {'{VIP Status}'}</div>
                      <div className="text-xs text-green-600 mt-1">Adults with good income or VIP customers</div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-md">
                      <div className="font-medium text-purple-900 mb-1">IF Statement</div>
                      <div className="text-sm text-purple-700">IF({'{Credit Score}'} &gt; 750, "Excellent", "Good")</div>
                      <div className="text-xs text-purple-600 mt-1">Conditional credit rating</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-indigo-50 rounded-md">
                      <div className="font-medium text-indigo-900 mb-1">Conditional Calculation</div>
                      <div className="text-sm text-indigo-700">IF({'{VIP Status}'}, {'{Income}'} * 1.2, {'{Income}'})</div>
                      <div className="text-xs text-indigo-600 mt-1">VIP customers get 20% bonus</div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-md">
                      <div className="font-medium text-orange-900 mb-1">Complex Mixed Logic</div>
                      <div className="text-sm text-orange-700">IF({'{Credit Score}'} &gt; 750, {'{Income}'} * 1.5, {'{Income}'} * 0.8)</div>
                      <div className="text-xs text-orange-600 mt-1">High credit gets 50% bonus, low gets 20% penalty</div>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-md">
                      <div className="font-medium text-red-900 mb-1">Risk-Adjusted Revenue</div>
                      <div className="text-sm text-red-700">abs({'{Income}'} - {'{Expenses}'}) * IF({'{VIP Status}'}, 1.1, 0.9)</div>
                      <div className="text-xs text-red-600 mt-1">Net income with VIP multiplier</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 