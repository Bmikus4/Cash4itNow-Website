import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'

// The whole app, loaded by main.jsx only once the page has painted. See there for why.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
