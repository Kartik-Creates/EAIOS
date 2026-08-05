import React, { useState, useEffect } from 'react';
import './RotatingText.css';

const MESSAGES = [
  'Connect Gmail instantly.',
  'Search every document.',
  'Summarize meetings in seconds.',
  'Talk to your workspace.',
  'Your AI remembers everything.',
  'One search across every app.',
  'Slack. GitHub. Notion. Gmail.',
  'Automate repetitive work.',
  'Your second brain for work.',
  'AI that works across your tools.'
];

export const RotatingText: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MESSAGES.length);
        setIsExiting(false);
      }, 400);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rotating-text-container">
      <span className={`rotating-text-item ${isExiting ? 'exit' : 'enter'}`}>
        {MESSAGES[index]}
      </span>
    </div>
  );
};

export default RotatingText;
