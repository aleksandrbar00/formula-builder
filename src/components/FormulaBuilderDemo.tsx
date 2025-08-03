import React, { useState } from 'react';
import { Calculator, Zap, Code, ArrowRight, BookOpen, Play, CheckCircle } from 'lucide-react';
import { FormulaBuilder } from './FormulaBuilder';
import { LogicalFormulaBuilder } from './LogicalFormulaBuilder';
import { MixedFormulaBuilder } from './MixedFormulaBuilder';
import { FormulaBuilderState, Attribute } from '../types/formula';

// Sample attributes for demonstration
const SAMPLE_ATTRIBUTES: Attribute[] = [
  { id: 'price', name: 'Price', type: 'number', description: 'Product price' },
  { id: 'quantity', name: 'Quantity', type: 'number', description: 'Quantity sold' },
  { id: 'age', name: 'Age', type: 'number', description: 'Customer age' },
  { id: 'income', name: 'Income', type: 'number', description: 'Customer income' },
  { id: 'status', name: 'Status', type: 'string', description: 'Customer status' },
  { id: 'vip', name: 'VIP', type: 'boolean', description: 'VIP customer flag' },
  { id: 'email', name: 'Email', type: 'string', description: 'Customer email' },
  { id: 'score', name: 'Credit Score', type: 'number', description: 'Credit score' }
];

type BuilderType = 'math' | 'logical' | 'mixed';

const BUILDER_CONFIGS = {
  math: {
    title: 'Math Formula Builder',
    description: 'Build mathematical formulas with operators, functions, and calculations',
    icon: Calculator,
    color: 'blue',
    examples: [
      {
        name: 'Total Revenue',
        description: 'Calculate total revenue from price and quantity',
        formula: 'Price * Quantity'
      },
      {
        name: 'Square Root of Revenue',
        description: 'Calculate the square root of revenue',
        formula: 'sqrt(Revenue)'
      },
      {
        name: '20% Markup',
        description: 'Calculate price with 20% markup',
        formula: 'Price * 1.2'
      }
    ]
  },
  logical: {
    title: 'Logical Formula Builder',
    description: 'Build logical conditions and boolean expressions',
    icon: Zap,
    color: 'purple',
    examples: [
      {
        name: 'High-Value Customer',
        description: 'Identify high-value customers',
        formula: 'Age > 18 AND Income > 50000'
      },
      {
        name: 'VIP Status Check',
        description: 'Check if customer has VIP status',
        formula: 'IF(Status == "VIP", "Premium", "Standard")'
      },
      {
        name: 'Valid Email',
        description: 'Check if email is provided',
        formula: 'NOT ISNULL(Email)'
      }
    ]
  },
  mixed: {
    title: 'Mixed Formula Builder',
    description: 'Combine math and logic for complex conditional calculations',
    icon: Code,
    color: 'indigo',
    examples: [
      {
        name: 'VIP Pricing',
        description: 'Apply VIP discount for eligible customers',
        formula: 'IF(Age > 18, Price * 1.1, Price)'
      },
      {
        name: 'Progressive Tax',
        description: 'Calculate tax based on income level',
        formula: 'IF(Income > 50000, Income * 0.3, Income * 0.2)'
      },
      {
        name: 'Conditional Bonus',
        description: 'Add bonus for VIP customers',
        formula: '(Price * Quantity) + IF(VIP == true, 100, 0)'
      }
    ]
  }
};

export const FormulaBuilderDemo: React.FC = () => {
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderType>('math');
  const [formulaState, setFormulaState] = useState<FormulaBuilderState>({
    nodes: [],
    selectedNodeId: undefined,
    formulaName: '',
    formulaDescription: '',
    mode: 'math'
  });

  const handleFormulaChange = (formula: FormulaBuilderState) => {
    setFormulaState(formula);
    console.log('Formula changed:', formula);
  };

  const renderBuilder = () => {
    const commonProps = {
      attributes: SAMPLE_ATTRIBUTES,
      onFormulaChange: handleFormulaChange,
      initialFormula: formulaState
    };

    switch (selectedBuilder) {
      case 'math':
        return <FormulaBuilder {...commonProps} />;
      case 'logical':
        return <LogicalFormulaBuilder {...commonProps} />;
      case 'mixed':
        return <MixedFormulaBuilder {...commonProps} />;
      default:
        return <FormulaBuilder {...commonProps} />;
    }
  };

  const config = BUILDER_CONFIGS[selectedBuilder];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Formula Builder</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <BookOpen size={16} />
                <span>Interactive Demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Builder Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Formula Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['math', 'logical', 'mixed'] as BuilderType[]).map((builderType) => {
              const builderConfig = BUILDER_CONFIGS[builderType];
              const BuilderIcon = builderConfig.icon;
              const isSelected = selectedBuilder === builderType;
              
              return (
                <div
                  key={builderType}
                  onClick={() => setSelectedBuilder(builderType)}
                  className={`
                    relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? `border-${builderConfig.color}-500 bg-${builderConfig.color}-50` 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                >
                  {isSelected && (
                    <div className={`absolute top-3 right-3 w-6 h-6 bg-${builderConfig.color}-500 rounded-full flex items-center justify-center`}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 bg-${builderConfig.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                      <BuilderIcon size={24} className={`text-${builderConfig.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{builderConfig.title}</h3>
                      <p className="text-sm text-gray-500">{builderConfig.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Examples:</h4>
                    {builderConfig.examples.map((example, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        <div className="font-medium">{example.name}</div>
                        <div className="text-gray-500">{example.description}</div>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{example.formula}</code>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <Play size={14} className="mr-1" />
                    Click to select
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Builder */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className={`border-b border-${config.color}-200 bg-${config.color}-50 px-6 py-4`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 bg-${config.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                <IconComponent size={20} className={`text-${config.color}-600`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {renderBuilder()}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['math', 'logical', 'mixed'] as BuilderType[]).map((builderType) => {
              const builderConfig = BUILDER_CONFIGS[builderType];
              const BuilderIcon = builderConfig.icon;
              const isSelected = selectedBuilder === builderType;
              
              return (
                <button
                  key={builderType}
                  onClick={() => setSelectedBuilder(builderType)}
                  disabled={isSelected}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                    ${isSelected 
                      ? `border-${builderConfig.color}-300 bg-${builderConfig.color}-50 text-${builderConfig.color}-700` 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                    ${isSelected ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center">
                    <BuilderIcon size={20} className="mr-3" />
                    <span className="font-medium">{builderConfig.title}</span>
                  </div>
                  {!isSelected && <ArrowRight size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <BookOpen size={20} className="mr-2" />
            Tips for Building Formulas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Getting Started:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Start by selecting attributes from your data</li>
                <li>• Use operators to connect values and attributes</li>
                <li>• Use functions for complex calculations</li>
                <li>• Use groups to control order of operations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Best Practices:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Give your formulas descriptive names</li>
                <li>• Test your formulas with sample data</li>
                <li>• Use the preview to verify your logic</li>
                <li>• Keep formulas simple and readable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 