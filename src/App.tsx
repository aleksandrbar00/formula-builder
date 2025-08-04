import './App.css';
import { FormulaBuilderDemo } from './components/FormulaBuilderDemo';
import { ReatomProvider } from './providers/ReatomProvider';

function App() {
  return (
    <ReatomProvider>
      <div className="App">
        <FormulaBuilderDemo />
      </div>
    </ReatomProvider>
  );
}

export default App; 
