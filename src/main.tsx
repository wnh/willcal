import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <h1>{time}</h1>;
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Clock />);
