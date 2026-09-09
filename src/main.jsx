import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
//import "./parser/testParser";
//import "./parser/testDataset.js"
//import "./graph/testGraphBuilder";
//import "./graph/testGraphLayout";
//import "./analysis/testDependencyAnalyzer";
//import "./analysis/testFailureAnalyzer";
//import "./analysis/changeImpactTest.js"
//import "./analysis/testDependencyPaths.js"
import "./analysis/testScopeTest";
//import "./analysis/changeImpactPathsTest";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
