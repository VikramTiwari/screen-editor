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

  const activeEvents = useMemo(() => {
    return events.filter(e => {
        const t = e.timestamp; 
        // Fetch a wider window for keyboard events to allow for grouping
        if (e.type === 'keydown' || e.type === 'keypress') {
             return t <= currentTime && t > currentTime - 3.0;
        }
        return t <= currentTime && t > currentTime - 0.1; 
    });
  }, [currentTime, events]);

  const mouseEvent = activeEvents.find(e => !e.type || e.type === 'mousemove' || e.type === 'click');
  
  // Group keyboard events
  const keyboardGroups = useMemo(() => {
      const kEvents = activeEvents
        .filter(e => e.type === 'keydown' || e.type === 'keypress')
        .sort((a, b) => a.timestamp - b.timestamp);
      
      const groups = [];
      let currentGroup = [];
      
      kEvents.forEach((e, i) => {
          const prev = kEvents[i-1];
          // Start new group if gap is too large (e.g. > 1s)
          if (prev && (e.timestamp - prev.timestamp > 1.0)) {
              groups.push(currentGroup);
              currentGroup = [];
          }
          currentGroup.push(e);
      });
      if (currentGroup.length > 0) groups.push(currentGroup);

      // Process each group into text
      return groups.map(group => {
          let text = '';
          const specialKeys = {
              'Backspace': '⌫',
              'Enter': '⏎',
              'ArrowUp': '↑',
              'ArrowDown': '↓',
              'ArrowLeft': '←',
              'ArrowRight': '→',
              'Escape': '⎋',
              'Tab': '⇥',
              'Shift': '⇧',
              'Control': '⌃',
              'Alt': '⌥',
              'Meta': '⌘',
              'CapsLock': '⇪'
          };

          group.forEach(e => {
              if (specialKeys[e.key]) {
                  text += specialKeys[e.key];
              } else if (e.key === 'Space' || e.key === ' ') {
                  text += ' ';
              } else if (e.key.length === 1) {
                  text += e.key;
              } else {
                  // Ignore other special keys or handle if needed
              }
          });
          
          // Determine if group should be visible
          // It should be visible if the last event was recent
          const lastTime = group[group.length - 1].timestamp;
          const isVisible = currentTime - lastTime < 1.5; // Fade out after 1.5s
          
          return { text, isVisible, id: group[0].timestamp };
      }).filter(g => g.isVisible && g.text.length > 0);
  }, [activeEvents, currentTime]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Mouse Cursor */}
      {mouseEvent && (
        <div 
            className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ${
                mouseEvent.type === 'click' ? 'bg-red-500 scale-150' : 'bg-red-500/50'
            }`}
            style={{ left: `${mouseEvent.x}px`, top: `${mouseEvent.y}px` }}
        />
      )}

      {/* Keyboard Events */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 items-center">
          {keyboardGroups.map((g) => (
              <div key={g.id} className="bg-neutral-900/90 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-neutral-700/50 text-xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
                  {g.text}
              </div>
          ))}
      </div>
    </div>
  );
};

export default InteractionVisualizer;
