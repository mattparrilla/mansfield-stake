import React from 'react';
import YearlyTrendContainer from './components/YearlyTrendContainer';
import './App.css';

const App = () => (
  <div className="app">
    <div className="top-border" />
    <div className="header">
      <h1>Snow Depth On Mt. Mansfield Since 1954</h1>
    </div>
    <YearlyTrendContainer />
  </div>
);

export default App;
