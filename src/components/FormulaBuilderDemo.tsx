import React, { useState } from 'react';
import { Calculator, Zap, Code, ArrowRight, BookOpen, Play, CheckCircle } from 'lucide-react';
import { FormulaBuilder } from './FormulaBuilder';
import { LogicalFormulaBuilder } from './LogicalFormulaBuilder';
import { MixedFormulaBuilder } from './MixedFormulaBuilder';
import { FormulaBuilderState, Attribute } from '../types/formula';
import styles from './FormulaBuilderDemo.module.css';

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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <div className={styles.headerTitle}>
                <h1>Formula Builder</h1>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.headerInfo}>
                <BookOpen size={16} />
                <span>Interactive Demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Builder Selection */}
        <div className={styles.builderSelection}>
          <h2 className={styles.selectionTitle}>Choose Your Formula Type</h2>
          <div className={styles.builderGrid}>
            {(['math', 'logical', 'mixed'] as BuilderType[]).map((builderType) => {
              const builderConfig = BUILDER_CONFIGS[builderType];
              const BuilderIcon = builderConfig.icon;
              const isSelected = selectedBuilder === builderType;
              
              return (
                <div
                  key={builderType}
                  onClick={() => setSelectedBuilder(builderType)}
                  className={`${styles.builderCard} ${isSelected ? `${styles.selected} ${styles[builderConfig.color]}` : ''}`}
                >
                  {isSelected && (
                    <div className={`${styles.selectedIndicator} ${styles[builderConfig.color]}`}>
                      <CheckCircle size={16} className={styles.selectedIndicatorIcon} />
                    </div>
                  )}
                  
                  <div className={styles.builderHeader}>
                    <div className={`${styles.builderIcon} ${styles[builderConfig.color]}`}>
                      <BuilderIcon size={24} />
                    </div>
                    <div className={styles.builderInfo}>
                      <h3>{builderConfig.title}</h3>
                      <p>{builderConfig.description}</p>
                    </div>
                  </div>
                  
                  <div className={styles.examples}>
                    <h4>Examples:</h4>
                    {builderConfig.examples.map((example, index) => (
                      <div key={index} className={styles.example}>
                        <div className={styles.exampleName}>{example.name}</div>
                        <div className={styles.exampleDescription}>{example.description}</div>
                        <code className={styles.exampleCode}>{example.formula}</code>
                      </div>
                    ))}
                  </div>
                  
                  <div className={styles.clickHint}>
                    <Play size={14} />
                    Click to select
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Builder */}
        <div className={styles.selectedBuilder}>
          <div className={`${styles.selectedBuilderHeader} ${styles[config.color]}`}>
            <div className={styles.selectedBuilderHeaderContent}>
              <div className={`${styles.selectedBuilderIcon} ${styles[config.color]}`}>
                <IconComponent size={20} />
              </div>
              <div className={styles.selectedBuilderInfo}>
                <h2>{config.title}</h2>
                <p>{config.description}</p>
              </div>
            </div>
          </div>
          
          <div className={styles.selectedBuilderContent}>
            {renderBuilder()}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className={styles.quickNavigation}>
          <h3>Quick Navigation</h3>
          <div className={styles.navigationGrid}>
            {(['math', 'logical', 'mixed'] as BuilderType[]).map((builderType) => {
              const builderConfig = BUILDER_CONFIGS[builderType];
              const BuilderIcon = builderConfig.icon;
              const isSelected = selectedBuilder === builderType;
              
              return (
                <button
                  key={builderType}
                  onClick={() => setSelectedBuilder(builderType)}
                  disabled={isSelected}
                  className={`${styles.navigationButton} ${isSelected ? `${styles.selected} ${styles[builderConfig.color]}` : ''}`}
                >
                  <div className={styles.navigationButtonContent}>
                    <BuilderIcon size={20} />
                    <span>{builderConfig.title}</span>
                  </div>
                  {!isSelected && <ArrowRight size={16} className={styles.navigationButtonArrow} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className={styles.tipsSection}>
          <h3 className={styles.tipsHeader}>
            <BookOpen size={20} />
            Tips for Building Formulas
          </h3>
          <div className={styles.tipsGrid}>
            <div className={styles.tipsColumn}>
              <h4>Getting Started:</h4>
              <ul className={styles.tipsList}>
                <li>Start by selecting attributes from your data</li>
                <li>Use operators to connect values and attributes</li>
                <li>Use functions for complex calculations</li>
                <li>Use groups to control order of operations</li>
              </ul>
            </div>
            <div className={styles.tipsColumn}>
              <h4>Best Practices:</h4>
              <ul className={styles.tipsList}>
                <li>Give your formulas descriptive names</li>
                <li>Test your formulas with sample data</li>
                <li>Use the preview to verify your logic</li>
                <li>Keep formulas simple and readable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 