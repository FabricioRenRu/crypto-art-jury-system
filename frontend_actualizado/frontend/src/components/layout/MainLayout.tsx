/**
 * components/layout/MainLayout.tsx
 * Estructura común a todas las páginas: Header arriba, contenido en medio, Footer abajo.
 * React Router pinta la página actual dentro de <Outlet />.
 *
 * Recibe la variante para que Inicio use el encabezado "public"
 * y el resto de páginas el encabezado "competition".
 */
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import type { HeaderVariant } from '../../types';

interface MainLayoutProps {
  variant: HeaderVariant;
}

export default function MainLayout({ variant }: MainLayoutProps) {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary min-h-screen flex flex-col justify-between">
      <Header variant={variant} />
      <main className="w-full pt-20 bg-surface flex-1">
        <Outlet />
      </main>
      <Footer variant={variant} />
    </div>
  );
}