'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionTimeoutWarningProps {
  onExtendSession: () => void;
  onLogout: () => void;
  warningTimeLeft: number; // secondi rimanenti
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  onExtendSession,
  onLogout,
  warningTimeLeft
}) => {
  const [timeLeft, setTimeLeft] = useState(warningTimeLeft);

  useEffect(() => {
    setTimeLeft(warningTimeLeft);
  }, [warningTimeLeft]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Sessione in Scadenza
          </h3>
        </div>

        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-2xl font-mono font-bold text-red-600">
              {formatTime(timeLeft)}
            </span>
          </div>
          <p className="text-gray-600">
            La tua sessione scadrà a breve per inattività.
            <br />
            Vuoi continuare a utilizzare l'applicazione?
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExtendSession}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Continua Sessione
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;