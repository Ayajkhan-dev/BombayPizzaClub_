import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'

const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === "true";

createRoot(document.getElementById('root')).render(
  isMaintenance ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      fontFamily: 'Arial',
      textAlign: 'center'
    }}>
      <div>
        <h1>🍕 We'll be back soon!</h1>
        <p>Site under maintenance. Please check back shortly.</p>
      </div>
    </div>
  ) : (
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  )
)
