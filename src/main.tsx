import ReactDOM from 'react-dom/client'
import App from './App'
import './index.scss'

// In dev mode, flag the html element so index.scss can skip the Chub-embed
// transparency overrides and let message bubble backgrounds render normally.
if (import.meta.env.DEV) {
    document.documentElement.classList.add('dev-mode');
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
