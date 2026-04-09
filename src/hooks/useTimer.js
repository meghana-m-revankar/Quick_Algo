import { useState, useEffect, useCallback } from 'react';

const useTimer = (initialTime = 30) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1); 
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const startTimer = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(true);
  }, [initialTime]);

  return { timeLeft, isRunning, startTimer };
};


export default useTimer;
