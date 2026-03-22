import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

import Home from "./pages/Home";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Blockchain Land Registry</h1>
      <Home />
    </div>
  );
}

export default App;