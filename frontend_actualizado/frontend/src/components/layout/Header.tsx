/**
 * components/layout/Header.tsx
 * Encabezado fijo con logo, menú de navegación y acciones de la derecha.
 *
 * El menú depende del tipo de usuario (se lee del JWT):
 *  - público (sin sesión): Inicio, Registro Pintor, Resultados + "Iniciar Sesión" / "Registrarse"
 *  - pintor:     Inicio, Panel Pintor, Resultados
 *  - juez:       Inicio, Evaluación Jurado, Resultados
 *  - presidente: Inicio, Visto Bueno Presidente, Resultados
 * Con sesión se muestra el rol y el botón "Cerrar sesión".
 * Ocultar enlaces es solo comodidad: las páginas siguen protegidas por RequireVault y por el backend.
 */
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { navegacionPara } from '../../data/navigation';
import { LOGO_URL, PROFILE_AVATAR_URL } from '../../data/assets';
import { PATHS } from '../../routes/paths';
import { useCryptoWorker } from '../../hooks/useCryptoWorker';
import { Acciones } from '../../workers/crypto.actions';
import { obtenerRolSesion } from '../../utils/session';
import type { HeaderVariant, RolUsuario } from '../../types';

interface HeaderProps {
  variant?: HeaderVariant;
}

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

export default function Header({ variant = 'competition' }: HeaderProps) {
  const isCompetition = variant === 'competition';
  const navigate = useNavigate();
  const { ejecutarAccion } = useCryptoWorker();

  /** HOOK: hace que el Header se vuelva a pintar en cada navegación, así el rol se actualiza
   *  justo después de iniciar o cerrar sesión. */
  useLocation();

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
        {/* Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link to={PATHS.inicio} className="flex items-center gap-space-sm">
            {isCompetition && (
              <img alt="ArtClash Digital Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
            )}
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface hidden sm:inline-block">
              ArtClash<span className="text-primary-container ml-0.5">Pro</span>
            </span>
          </Link>
        </div>

        {/* Menú principal (filtrado por rol) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {enlaces.map((item) => (
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
          {rol === 'publico' ? (
            <div className="hidden sm:flex items-center gap-2">
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
                onClick={cerrarSesion}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container hover:bg-surface-bright text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors"
              >
                <Icon name="logout" className="text-[18px]" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
              <img
                alt="Perfil"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-container/40"
                src={PROFILE_AVATAR_URL}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}