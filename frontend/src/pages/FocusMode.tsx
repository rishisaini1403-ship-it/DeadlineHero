import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FocusMode: React.FC = () => {
  const navigate = useNavigate();
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // Sound notification
  const [showNotification, setShowNotification] = useState(false);

  const WORK_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  useEffect(() => {
    let interval: number | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    setShowNotification(true);
    
    // Play notification sound (browser default)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczE0uY0telejAdUpnSpbdtMCpOl87LtHApEE6Tzsmzciu')
        audio.play().catch(() => {});
    } catch (error) {}

    if (!isBreak) {
      setSessionsCompleted(prev => prev + 1);
      // Auto switch to break
      setTimeout(() => {
        setIsBreak(true);
        setTimeLeft(BREAK_TIME);
        setShowNotification(false);
        setIsRunning(true);
      }, 2000);
    } else {
      // Break completed, back to work
      setTimeout(() => {
        setIsBreak(false);
        setTimeLeft(WORK_TIME);
        setShowNotification(false);
      }, 2000);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((isBreak ? BREAK_TIME : WORK_TIME) - timeLeft) / (isBreak ? BREAK_TIME : WORK_TIME) * 100;

  const getMotivationalMessage = () => {
    if (sessionsCompleted === 0) return "Let's get started! You've got this! 💪";
    if (sessionsCompleted === 1) return "Great start! Keep the momentum going! 🔥";
    if (sessionsCompleted === 2) return "You're on fire! Amazing progress! ⚡";
    if (sessionsCompleted === 3) return "Incredible work! You're a productivity machine! 🚀";
    if (sessionsCompleted >= 4) return "Unstoppable! You're crushing your goals! 🎯";
    return "Keep going!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Exit Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all"
      >
        ✕ Exit Focus Mode
      </button>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            {isBreak ? '☕ Break Time' : '🎯 Focus Mode'}
          </h1>
          <p className="text-xl text-white/80">{getMotivationalMessage()}</p>
        </div>

        {/* Timer Display */}
        <div className="relative mb-12">
          {/* Circular Progress */}
          <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isBreak ? '#10B981' : '#3B82F6'}
              strokeWidth="3"
              strokeDasharray={`${progress * 2.83} 283`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Timer Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-7xl font-bold mb-2 font-mono">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xl text-white/70">
              {isRunning ? 'Running...' : 'Paused'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={toggleTimer}
            className={`px-12 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 ${
              isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRunning ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full text-xl font-bold transition-all"
          >
            🔄 Reset
          </button>
        </div>

        {/* Session Counter */}
        <div className="flex items-center space-x-2 mb-8">
          <span className="text-lg">Sessions Completed:</span>
          <div className="flex space-x-1">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full ${
                  idx < sessionsCompleted % 4 ? 'bg-yellow-400' : 'bg-white/20'
                }`}
              ></div>
            ))}
          </div>
          <span className="text-lg font-bold">{sessionsCompleted}</span>
        </div>

        {/* Pomodoro Info */}
        <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl max-w-2xl w-full">
          <h3 className="text-xl font-bold mb-4">📖 How it works:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-blue-300">25 min</p>
              <p className="text-sm text-white/70">Focused Work</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-green-300">5 min</p>
              <p className="text-sm text-white/70">Short Break</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">
            After 4 sessions, take a longer 15-30 minute break. Stay focused, eliminate distractions!
          </p>
        </div>

        {/* Notification Overlay */}
        {showNotification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 p-8 rounded-2xl max-w-md text-center animate-bounce">
              <div className="text-6xl mb-4">
                {isBreak ? '🎉' : '☕'}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {isBreak ? 'Session Complete!' : 'Break Over!'}
              </h2>
              <p className="text-lg text-gray-600">
                {isBreak
                  ? `Great job! Time for a 5-minute break.`
                  : 'Break is over. Ready to focus again?'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusMode;
