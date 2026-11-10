/**
 * components/layout/Header.tsx
 * Encabezado fijo con menú de navegación y acciones de la derecha.
 *
 * El menú depende del tipo de usuario (se lee del JWT):
 *  - público (sin sesión): Inicio, Registro Pintor, Resultados + "Iniciar Sesión" / "Registrarse"
 *  - pintor:     Inicio, Panel Pintor, Resultados
 *  - juez:       Inicio, Evaluación Jurado, Resultados
 *  - presidente: Inicio, Visto Bueno Presidente, Resultados
 * Con sesión se muestra el rol y el botón "Cerrar sesión".
 * Ocultar enlaces es solo comodidad: las páginas siguen protegidas por RequireVault y por el backend.
 */
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { navegacionPara } from '../../data/navigation';
import { PROFILE_AVATAR_URL } from '../../data/assets';
import { PATHS } from '../../routes/paths';
import { useCryptoWorker } from '../../hooks/useCryptoWorker';
import { Acciones } from '../../workers/crypto.actions';
import { obtenerRolSesion } from '../../utils/session';
import type { RolUsuario } from '../../types';

const ETIQUETA_ROL: Record<Exclude<RolUsuario, 'publico'>, string> = {
  pintor: 'Pintor',
  jurado: 'Juez',
  presidente: 'Presidente',
};

const navBase = 'px-3 py-1.5 rounded transition-colors whitespace-nowrap';
const navActive = 'bg-primary-container text-on-primary font-bold';
const navInactive =
  'font-title-md text-body-md text-on-surface-variant hover:bg-surface-bright hover:text-on-surface';

const ctaButton =
  'inline-flex items-center justify-center bg-primary-container hover:bg-tertiary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded transition-all shadow-[0_0_16px_rgba(255,107,0,0.35)]';

export default function Header() {
  const navigate = useNavigate();
  const { ejecutarAccion } = useCryptoWorker();
  const [menuAbierto, setMenuAbierto] = useState(false);

  /** Rol actual según el JWT (o 'publico' si no hay sesión o ya expiró). */
  const rol: RolUsuario = obtenerRolSesion() ?? 'publico';
  const enlaces = navegacionPara(rol);

  /** Borra el JWT y las llaves de la RAM del worker. */
  const cerrarSesion = async () => {
    sessionStorage.removeItem('access_token');
    try {
      await ejecutarAccion(Acciones.CERRAR_SESION);
    } catch {
      // Si el worker falló, sus llaves igual se pierden al recargar la página
    }
    navigate(PATHS.inicio);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-highest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
      <div className="h-20 w-full px-gutter flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md shrink-0">
          <Link to={PATHS.inicio} className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-body-lg sm:text-headline-sm uppercase tracking-tight text-on-surface">
              ArtClash<span className="text-primary-container ml-0.5">Pro</span>
            </span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-space-md">
          {/* Menú principal (filtrado por rol), alineado a la derecha */}
          <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-1 xl:gap-2">
            {enlaces.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) => `${navBase} ${isActive ? navActive : navInactive}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-space-sm shrink-0">
            {rol === 'publico' ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link to={PATHS.sesion} className={`px-3 py-2 ${ctaButton}`}>
                  Iniciar Sesión
                </Link>
                <Link to={PATHS.registroPintor} className={`px-3 py-2 ${ctaButton}`}>
                  Registrarse
                </Link>
              </div>
            ) : (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm uppercase tracking-wider text-primary">
                  <Icon name="badge" className="text-[16px]" />
                  {ETIQUETA_ROL[rol]}
                </span>
                <button
                  type="button"
                  aria-label="Cerrar sesión"
                  onClick={cerrarSesion}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors"
                >
                  <Icon name="logout" className="text-[18px]" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
                <img
                  alt="Perfil"
                  className="hidden sm:block w-8 h-8 rounded-full object-cover ring-1 ring-primary-container/40"
                  src={PROFILE_AVATAR_URL}
                />
              </>
            )}
            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded text-on-surface hover:bg-surface-bright transition-colors"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuAbierto}
              aria-controls="mobile-navigation"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
              <Icon name={menuAbierto ? 'close' : 'menu'} className="text-[24px]" />
            </button>
          </div>
        </div>
      </div>

      {menuAbierto && (
        <div
          id="mobile-navigation"
          className="lg:hidden border-t border-outline-variant/20 bg-surface-container-highest px-gutter py-3 shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
        >
          <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
            {enlaces.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => setMenuAbierto(false)}
                className={({ isActive }) =>
                  `w-full ${navBase} ${isActive ? navActive : navInactive}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {rol === 'publico' && (
            <div className="mt-3 flex flex-col gap-2 border-t border-outline-variant/20 pt-3">
              <Link
                to={PATHS.sesion}
                onClick={() => setMenuAbierto(false)}
                className={`px-3 py-2 ${ctaButton}`}
              >
                Iniciar Sesión
              </Link>
              <Link
                to={PATHS.registroPintor}
                onClick={() => setMenuAbierto(false)}
                className={`px-3 py-2 ${ctaButton}`}
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}