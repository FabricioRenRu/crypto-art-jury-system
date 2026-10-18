/**
 * pages/SesionPage.tsx
 * Página "Iniciar Sesión" (migrada de Interfaces/Sesion).
 *
 * Formulario de correo y contraseña para pintores y jurados.
 * Todavía no existe el endpoint de login en el backend: al enviar el formulario
 * se redirige al Panel del Pintor. Cuando exista, reemplazar iniciarSesion().
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { PATHS } from '../routes/paths';

const inputBase =
  'w-full bg-surface-container-highest text-on-surface placeholder:text-secondary/50 pl-11 py-3 rounded-lg font-body-md text-body-md border border-transparent focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container transition-all';

export default function SesionPage() {
  const navigate = useNavigate();

  /** STATE: valores de los campos del formulario. */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /** STATE: true cuando la contraseña se muestra en texto plano. */
  const [showPassword, setShowPassword] = useState(false);

  /** Aqui se llamaria al backend con email y password. */
  const iniciarSesion = () => {
    navigate(PATHS.panelPintor);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    iniciarSesion();
  };

  return (
    <div className="w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
        {/* Titulo */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary-container font-label-md text-label-md font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
            Acceso a la plataforma • Temporada 2025
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-tight text-on-surface">
            Iniciar Sesión <span className="text-primary-container">ArtClash Pro</span>
          </h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-md">
            Bienvenido de vuelta. Ingresa a tu panel de pintor o jurado para continuar la competencia
            en tiempo real.
          </p>
        </div>

        {/* Tarjeta de login */}
        <div className="w-full bg-surface-container-low border border-surface-container-high/60 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start gap-3.5 pb-6 mb-6 border-b border-surface-container-high/60">
            <div className="w-10 h-10 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center shrink-0">
              <Icon name="key" className="text-primary-container text-[22px]" />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Inicio de sesión
              </h2>
              <p className="font-body-md text-body-md text-secondary">
                Ingresa tus datos autorizados de participante o juez
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Correo */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="email-input"
                  className="font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary"
                >
                  Correo electrónico
                </label>
                <span className="font-body-sm text-body-sm text-secondary/70">
                  Oficial o alias registrado
                </span>
              </div>
              <div className="relative flex items-center">
                <Icon
                  name="mail"
                  className="absolute left-3.5 text-secondary/70 text-[20px] pointer-events-none"
                />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artista@estudio.pro"
                  className={`${inputBase} pr-4`}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password-input"
                  className="font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary"
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  className="font-label-md text-label-md text-primary hover:text-on-surface transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative flex items-center">
                <Icon
                  name="lock"
                  className="absolute left-3.5 text-secondary/70 text-[20px] pointer-events-none"
                />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`${inputBase} pr-11`}
                />
                <button
                  type="button"
                  aria-label="Ver u ocultar contraseña"
                  onClick={() => setShowPassword((actual) => !actual)}
                  className="absolute right-3.5 text-secondary hover:text-on-surface transition-colors p-1"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[19px]" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-primary-container hover:bg-tertiary-container text-on-primary font-title-lg text-title-lg font-bold uppercase tracking-wide py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-container/25 hover:shadow-primary-container/40 transition-all duration-200 cursor-pointer"
            >
              <span>Iniciar Sesión</span>
              <Icon name="arrow_forward" className="text-[20px]" />
            </button>

            <div className="pt-4 border-t border-surface-container-high/60 flex items-center justify-center gap-2 text-center">
              <span className="font-body-md text-body-md text-secondary">
                ¿No tienes una cuenta aún?
              </span>
              <Link
                to={PATHS.registroPintor}
                className="font-label-md text-label-md uppercase tracking-wider text-primary hover:text-on-surface font-bold transition-colors inline-flex items-center gap-1"
              >
                Regístrate aquí
                <Icon name="open_in_new" className="text-[14px]" />
              </Link>
            </div>
          </form>
        </div>

        {/* Mensaje y sellos */}
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="font-body-md text-body-md text-secondary">
            Bienvenido a la competencia. ¡Te deseamos mucho éxito!
          </p>
          <div className="flex items-center justify-center gap-4 text-secondary/60">
            <div className="flex items-center gap-1.5">
              <Icon name="encrypted" className="text-[16px] text-secondary/70" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                Cifrado de extremo a extremo
              </span>
            </div>
            <span className="text-secondary/40">•</span>
            <div className="flex items-center gap-1.5">
              <Icon name="brush" className="text-[16px] text-secondary/70" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                Profesionalidad
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
