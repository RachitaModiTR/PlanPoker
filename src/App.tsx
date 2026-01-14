import { useEffect } from 'react';
import { GlobalStateProvider } from './context/GlobalStateProvider';
import { SessionPage } from './pages/SessionPage';
import { useSessionStore } from './store/sessionStore';

/**
 * App Component
 * 
 * Responsibilities:
 * - Root provider wrapper
 * - Renders the main SessionPage
 * - Handles Global Theme
 */
function App() {
  const themeMode = useSessionStore(state => state.themeMode);

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <GlobalStateProvider>
      <SessionPage />
    </GlobalStateProvider>
  );
}

export default App;
