/**
 * components/layout/MainLayout.tsx
 * Estructura común a todas las páginas: Header arriba, contenido en medio, Footer abajo.
 * React Router pinta la página actual dentro de <Outlet />.
 *
 */
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary min-h-screen flex flex-col justify-between">
      <Header />
      <main className="w-full pt-20 bg-surface flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}