import React from 'react';
import './App.css';
import { GameProvider } from './context/GameContext';
import { HUD } from './components/UI/HUD';

function App(): JSX.Element {
  return (
    <GameProvider>
      <div className="app">
        <HUD />
        <header className="app-header">
          <h1>Bounce & Collect</h1>
          <p>2D Physics Puzzle Game</p>
        </header>
        <main className="app-main">
          <p>Game loading...</p>
        </main>
      </div>
    </GameProvider>
  );
}

export default App;
