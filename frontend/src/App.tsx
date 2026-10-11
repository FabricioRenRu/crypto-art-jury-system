/**
 * App.tsx
 * Componente raíz. Envuelve la app con el router (BrowserRouter)
 * para que funcionen las URLs y los <Link>/<NavLink>.
 */
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';

function App() {
  

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
