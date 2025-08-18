import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react'; // Import StrictMode directly
import App from './App';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

reportWebVitals();