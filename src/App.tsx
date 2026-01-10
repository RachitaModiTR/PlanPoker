import { GlobalStateProvider } from './context/GlobalStateProvider';
import { SessionPage } from './pages/SessionPage';

/**
 * App Component
 * 
 * Responsibilities:
 * - Root provider wrapper
 * - Renders the main SessionPage
 */
function App() {
  return (
    <GlobalStateProvider>
      <SessionPage />
    </GlobalStateProvider>
  );
}

export default App;
