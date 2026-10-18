/**
 * components/layout/Header.tsx
 * Encabezado fijo con logo, menú de navegación y acciones de la derecha.
 *
 * Tiene dos variantes porque los HTML originales traían encabezados distintos:
 *  - "public"      (Inicio): botones "Iniciar Sesión" y "Registrarse", sin logo de imagen.
 *  - "competition" (resto):  logo, insignia "FASE EN VIVO" y botón "Competir Ahora".
 *
 * El enlace activo se resalta automáticamente con <NavLink> de React Router
 * (en el HTML se hacía a mano con aria-current="page").
 */
import { Link, NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { MAIN_NAV } from '../../data/navigation';
import { LOGO_URL, PROFILE_AVATAR_URL } from '../../data/assets';
import { PATHS } from '../../routes/paths';
import type { HeaderVariant } from '../../types';

interface HeaderProps {
  variant?: HeaderVariant;
}

const navBase = 'px-3 py-1.5 rounded transition-colors whitespace-nowrap';
const navActive = 'bg-primary-container text-on-primary font-bold';
const navInactive =
  'font-title-md text-body-md text-on-surface-variant hover:bg-surface-bright hover:text-on-surface';

const ctaButton =
  'inline-flex items-center justify-center bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded transition-all shadow-[0_0_16px_rgba(255,107,0,0.35)]';

export default function Header({ variant = 'competition' }: HeaderProps) {
  const isCompetition = variant === 'competition';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-highest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
      <div className="h-20 w-full px-gutter flex items-center justify-between gap-space-md">
        {/* Logo + insignia de fase */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link to={PATHS.inicio} className="flex items-center gap-space-sm">
            {isCompetition && (
              <img alt="ArtClash Digital Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
            )}
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface hidden sm:inline-block">
              ArtClash<span className="text-primary-container ml-0.5">Pro</span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded border border-outline-variant/30">
            <span className="h-2 w-2 rounded-full bg-primary-container animate-pulse" />
            {isCompetition && (
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                FASE EN VIVO: RONDA FINAL
              </span>
            )}
          </div>
        </div>

        {/* Menú principal */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end // evita que "/" quede activo en todas las rutas
              className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones derecha */}
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            aria-label="Notificaciones"
            className="w-10 h-10 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors relative"
          >
            <Icon name="notifications" className="text-[20px]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface-variant" />
          </button>

          {isCompetition ? (
            <Link to={PATHS.registroPintor} className={`hidden sm:inline-flex px-4 py-2 ${ctaButton}`}>
              Competir Ahora
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <a href="#" className={`px-3 py-2 ${ctaButton}`}>
                Iniciar Sesión
              </a>
              <Link to={PATHS.registroPintor} className={`px-3 py-2 ${ctaButton}`}>
                Registrarse
              </Link>
            </div>
          )}

          <div className="flex items-center pl-space-xs">
            <img
              alt="Perfil"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-container/40"
              src={PROFILE_AVATAR_URL}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
