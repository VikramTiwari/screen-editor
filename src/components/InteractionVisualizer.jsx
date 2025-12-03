import React, { useEffect, useState, useMemo } from 'react';

const InteractionVisualizer = ({ src, currentTime }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!src) return;
    fetch(src)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Failed to load interactions", err));
  }, [src]);

  const currentEvent = useMemo(() => {
    return events.find(e => {
        const t = e.timestamp; 
        return t <= currentTime && t > currentTime - 0.1; 
    });
  }, [currentTime, events]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Overlay for mouse cursor, clicks, etc. */}
      {currentEvent && (
        <div 
            className="absolute w-4 h-4 bg-red-500 rounded-full opacity-50 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{ left: `${currentEvent.x}px`, top: `${currentEvent.y}px` }}
        />
      )}
    </div>
  );
};

export default InteractionVisualizer;
