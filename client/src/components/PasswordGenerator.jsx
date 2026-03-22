import { useState } from 'react';
import './PasswordGenerator.css';

export function PasswordGenerator({ onGenerate, onUsePassword }) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleOptionChange = (key) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGenerate = () => {
    const password = onGenerate({
      length,
      ...options
    });
    setGeneratedPassword(password);
  };

  const handleUse = () => {
    if (generatedPassword && onUsePassword) {
      onUsePassword(generatedPassword);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        // Auto-clear clipboard after 30 seconds
        setTimeout(async () => {
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === generatedPassword) {
            await navigator.clipboard.writeText('');
          }
        }, 30000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="password-generator">
      <h3>Password Generator</h3>

      <div className="generator-options">
        <div className="length-slider">
          <label className="label">
            Length: <span className="length-value">{length}</span>
          </label>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="slider"
          />
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => handleOptionChange('uppercase')}
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => handleOptionChange('lowercase')}
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => handleOptionChange('numbers')}
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.special}
              onChange={() => handleOptionChange('special')}
            />
            <span>Special (!@#$...)</span>
          </label>
        </div>
      </div>

      <button onClick={handleGenerate} className="btn btn-primary generate-btn">
        Generate Password
      </button>

      {generatedPassword && (
        <div className="generated-password">
          <input
            type="text"
            value={generatedPassword}
            readOnly
            className="input password-display"
          />
          <div className="password-actions">
            <button onClick={copyToClipboard} className="btn btn-secondary btn-sm">
              Copy
            </button>
            {onUsePassword && (
              <button onClick={handleUse} className="btn btn-primary btn-sm">
                Use Password
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
