import React from 'react';
import YearlyTrendContainer from './components/YearlyTrendContainer';
import './App.css';

const App = () => (
  <div style={{ marginBottom: '20px' }} className="app">
    <div className="top-border" />
    <h1>Snow Depth On Mt. Mansfield Since 1954</h1>
    <YearlyTrendContainer />
  </div>
);

export default App;
