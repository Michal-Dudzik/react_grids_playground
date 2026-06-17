import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'antd/dist/reset.css';
import '@syncfusion/ej2-base/styles/tailwind.css';
import '@syncfusion/ej2-buttons/styles/tailwind.css';
import '@syncfusion/ej2-calendars/styles/tailwind.css';
import '@syncfusion/ej2-dropdowns/styles/tailwind.css';
import '@syncfusion/ej2-inputs/styles/tailwind.css';
import '@syncfusion/ej2-navigations/styles/tailwind.css';
import '@syncfusion/ej2-popups/styles/tailwind.css';
import '@syncfusion/ej2-splitbuttons/styles/tailwind.css';
import '@syncfusion/ej2-grids/styles/tailwind.css';
import '@syncfusion/ej2-react-grids/styles/tailwind.css';
import { App } from './app/App';
import { AppLocaleProvider } from './app/locale';
import { registerSyncfusionLicense } from './config/syncfusionLicense';
import './styles/index.css';
import './styles/syncfusion-theme.css';
registerSyncfusionLicense();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppLocaleProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </AppLocaleProvider>
  </React.StrictMode>,
);
