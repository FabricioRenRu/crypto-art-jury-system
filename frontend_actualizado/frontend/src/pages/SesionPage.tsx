/**
 * pages/SesionPage.tsx
 * Página "Iniciar Sesión" (migrada de Interfaces/Sesion).
 *
 * Formulario de correo y contraseña para pintores y jurados.
 * Todavía no existe el endpoint de login en el backend: al enviar el formulario
 * se redirige al Panel del Pintor. Cuando exista, reemplazar iniciarSesion().
 */
import { useRef, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { PATHS } from '../routes/paths';
import { useLogin, type RolLogin } from '../hooks/useLogin';
import { authService } from '../services/authService';
import { useCryptoWorker } from '../hooks/useCryptoWorker';
import { Acciones } from '../workers/crypto.worker'

const inputBase =
  'w-full bg-surface-container-highest text-on-surface placeholder:text-secondary/50 pl-11 py-3 rounded-lg font-body-md text-body-md border border-transparent focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container transition-all';

export default function SesionPage() {
  const navigate = useNavigate();
  const {login, isLoading, error} = useLogin();
  const { ejecutarAccion } = useCryptoWorker();

  //ESTADOS PASO 1 (Peticion HTTP)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState<RolLogin>('pintor');


  //ESTADOS PASO 2 (solicitar .pem)
  const [paso, setPaso] = useState<1 | 2>(1);
  const [isInjecting, setIsInjecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const exito = await login(email, password, rol); 
    if(exito){
      setPaso(2); //Pasamos a pedir el .pem
    }
  }


  const handleSubirPem = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setIsInjecting(true);
    const lector = new FileReader();
    
    lector.onload = async (evento) => {
      const llaveTexto = evento.target?.result as string;
      
      try {
        if (rol === 'pintor') {
          // El backend valida que el .pem corresponda a tu llave pública y lo deja solo en RAM
          await authService.cargarLlavePintor(llaveTexto);
        } else {
          // El jurado sigue usando la RAM del worker
          await ejecutarAccion(Acciones.INYECCION_LLAVE_PRIVADA, { pem: llaveTexto, rol: rol });
        }
        
        // Redirigimos al panel
        if (rol === 'pintor') {
          navigate(PATHS.panelPintor);
        } else {
          navigate(PATHS.evaluacionJurado);
        }
        
      } catch (err: any) {
        console.error("Error inyectando la llave", err.message || err);
        alert(err.message || "El archivo PEM no es valido o esta corrupto.");
      } finally {
        setIsInjecting(false);
      }
    };
    
    lector.readAsText(archivo); // Leemos como texto, no como Base64
  };

return (
    <div className="w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
        {/* Titulo */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-primary-container font-label-md text-label-md font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
            Acceso a la plataforma • Temporada 2026
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-tight text-on-surface">
            {paso === 1 ? 'Iniciar Sesión' : 'Desbloquear Bóveda'}
          </h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-md">
            Bienvenido de vuelta. Ingresa a tu panel de pintor o jurado para continuar la competencia
            en tiempo real.
          </p>
        </div>

        {/* Tarjeta de login */}
        <div className="w-full bg-surface-container-low border border-surface-container-high/60 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all">
          
          {paso === 1 ? (
            // ================= PASO 1: FORMULARIO HTTP =================
            <>
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
                {/* Selector de Rol (Tabs) */}
                <div className="flex p-1 bg-surface-container-highest rounded-lg mb-2">
                  <button
                    type="button"
                    onClick={() => setRol('pintor')}
                    className={`flex-1 py-2 rounded-md font-label-md uppercase tracking-wider transition-all duration-200 ${
                      rol === 'pintor' 
                        ? 'bg-primary-container text-on-primary shadow-sm' 
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    Soy Artista
                  </button>
                  <button
                    type="button"
                    onClick={() => setRol('jurado')}
                    className={`flex-1 py-2 rounded-md font-label-md uppercase tracking-wider transition-all duration-200 ${
                      rol === 'jurado' 
                        ? 'bg-primary-container text-on-primary shadow-sm' 
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    Soy Jurado
                  </button>
                </div>

                {/* Mostrar error si las credenciales fallan */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-error-container text-on-error-container font-body-sm">
                    <Icon name="error" className="text-[18px]" />
                    <span>{error}</span>
                  </div>
                )}

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
                  disabled={isLoading}
                  className="w-full mt-2 bg-primary-container hover:bg-tertiary-container text-on-primary font-title-lg text-title-lg font-bold uppercase tracking-wide py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-container/25 hover:shadow-primary-container/40 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
                  <Icon name={isLoading ? 'sync' : 'arrow_forward'} className={`text-[20px] ${isLoading ? 'animate-spin' : ''}`} />
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
            </>
          ) : (
            // ================= PASO 2: INYECCIÓN CRIPTOGRÁFICA =================
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
                <Icon name="vpn_key" className="text-[32px]" />
              </div>
              
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold mb-2">
                  Identidad Confirmada
                </h2>
                <p className="font-body-md text-body-md text-secondary">
                  Para firmar tus acciones, sube tu llave privada <strong>.pem</strong>. <br/>
                  <span className="text-primary-container text-xs">{rol === 'pintor' ? 'El servidor solo la mantiene en memoria durante tu sesión; nunca la guarda.' : 'Esta llave NUNCA saldrá de tu navegador.'}</span>
                </p>
              </div>

              <input 
                type="file" 
                accept=".pem" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleSubirPem} 
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isInjecting}
                className="w-full bg-surface-container-highest hover:bg-surface-bright text-primary border border-primary/30 font-title-lg uppercase tracking-wide py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Icon name="upload_file" />
                {isInjecting ? 'Inyectando en RAM...' : 'Seleccionar archivo .pem'}
              </button>
            </div>
          )}
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
