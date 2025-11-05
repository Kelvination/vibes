import React from 'react';
import './App.css';

function App(): JSX.Element {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Bounce & Collect</h1>
        <p>2D Physics Puzzle Game</p>
      </header>
      <main className="app-main">
        <p>Game loading...</p>
      </main>
    </div>
  );
}

export default App;
