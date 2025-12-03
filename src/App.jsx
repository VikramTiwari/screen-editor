import React from 'react';
import EditorLayout from './components/EditorLayout';
import Background from './components/Background';

function App() {
  return (
    <div className="min-h-screen text-white relative">
      <Background />
      <div className="relative z-10">
        <EditorLayout />
      </div>
    </div>
  );
}

export default App;
