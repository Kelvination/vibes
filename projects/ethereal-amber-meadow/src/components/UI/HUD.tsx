import { useGameState } from '../../context/GameContext';
import './HUD.css';

/**
 * HUD (Heads-Up Display) Component
 *
 * Displays game status information:
 * - Current score
 * - Time elapsed (MM:SS format)
 * - Stars collected
 *
 * The HUD updates in real-time as game state changes.
 */
export function HUD(): JSX.Element {
  const gameState = useGameState();

  /**
   * Format time in seconds to MM:SS format
   * @param seconds - Time in seconds (can be decimal)
   * @returns Formatted time string (MM:SS)
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format score with commas for thousands
   * @param score - Score number
   * @returns Formatted score string
   */
  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  return (
    <div className="hud" role="complementary" aria-label="Game status display" data-testid="hud">
      <div className="hud-item hud-score">
        <span className="hud-label">Score</span>
        <span className="hud-value" aria-label={`Score: ${gameState.score}`}>
          {formatScore(gameState.score)}
        </span>
      </div>

      <div className="hud-item hud-time">
        <span className="hud-label">Time</span>
        <span className="hud-value" aria-label={`Time: ${formatTime(gameState.timeElapsed)}`}>
          {formatTime(gameState.timeElapsed)}
        </span>
      </div>

      <div className="hud-item hud-stars">
        <span className="hud-label">Stars</span>
        <span className="hud-value" aria-label={`Stars collected: ${gameState.starsCollected}`}>
          <span className="star-icon" aria-hidden="true">⭐</span>
          {gameState.starsCollected}
        </span>
      </div>
    </div>
  );
}

export default HUD;
