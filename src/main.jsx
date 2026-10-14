import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-serif-tamil';
import '@fontsource-variable/noto-sans-tamil';
import '@fontsource-variable/noto-serif-malayalam';
import '@fontsource-variable/noto-sans-malayalam';
import './styles/base.css';
import './styles/layout.css';
import './styles/pages.css';
import App from './App.jsx';
import { AppProvider } from './state/AppContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
