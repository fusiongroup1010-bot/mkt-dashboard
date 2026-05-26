import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// One-time cleanup: remove old RNDSP data keys and old themes from localStorage (MKT Dashboard uses its own keys)
const MKT_INIT_KEY = 'mkt_storage_init_v2';
if (!localStorage.getItem(MKT_INIT_KEY)) {
  ['rd_last_known_fb_data', 'rd_local_changes', 'mockUser_sonl', 'themeColor', 'bgColor'].forEach(k => localStorage.removeItem(k));
  localStorage.setItem(MKT_INIT_KEY, '1');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
