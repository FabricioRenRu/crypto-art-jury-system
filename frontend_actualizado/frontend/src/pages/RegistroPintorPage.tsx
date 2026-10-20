/**
 * pages/RegistroPintorPage.tsx
 * Página "Registro de Pintor Digital" (migrada de Interfaces/Registro).
 *
 * Formulario de inscripción con foto de perfil, datos de acceso y certificación
 * de autoría humana. Al enviarlo llama al backend con el hook useRegisterPainter.
 *
 * Nota: el backend (PainterCreate) solo recibe nombre, correo, contraseña y categoría.
 * El diseño no tiene selector de categoría, por eso se manda DEFAULT_CATEGORY;
 * el seudónimo y la foto se quedan en el formulario hasta que el backend los soporte.
 */
import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import CryptoTestPanel from '../components/dev/CryptoTestPanel';
import { useRegisterPainter } from '../hooks/useRegisterPainter';
import { DEFAULT_AVATAR_URL } from '../data/assets';
import { PATHS } from '../routes/paths';


const inputClase =
  'w-full pl-10 pr-3 py-3 rounded-lg bg-surface-container-low text-on-surface font-body-md placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary-container';

const labelClase =
  'font-label-md text-label-md text-on-surface uppercase tracking-wider block';

const BENEFITS = [
  {
    icon: 'public',
    title: '1. Exposición Global',
    text: 'Tu proceso en vivo ante más de 120.000 espectadores y directores de arte.',
  },
  {
    icon: 'rate_review',
    title: '2. Feedback de Expertos',
    text: 'Evaluación detallada de técnica, color y composición por artistas veteranos.',
  },
  {
    icon: 'trophy',
    title: '3. Premios y Podio',
    text: 'Premios económicos, hardware profesional y acreditación verificada.',
  },
];

export default function RegistroPintorPage() {
  const { register, isLoading, error, result } = useRegisterPainter();
  const navigate = useNavigate();

  /** STATE: campos del formulario. */
  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  /** STATE: vista previa de la foto de perfil (URL local del archivo elegido). */
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR_URL);

  /** Lee la imagen elegida y la muestra como vista previa. */
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) {
      return;
    }
    const lector = new FileReader();
    lector.onload = (evento) => {
      setAvatarPreview(String(evento.target?.result ?? DEFAULT_AVATAR_URL));
    };
    lector.readAsDataURL(archivo);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    register({
      nombre: fullName,
      seudonimo: handle,     
      email: email,
      contrasena: password,
      fotoBase64: avatarPreview 
    });
  };

  useEffect(() => {
    if (result) {
      // Si hay un resultado exitoso, esperamos 4 segundos y lo mandamos al login
      const timer = setTimeout(() => {
        navigate(PATHS.sesion);
      }, 4000);
      
      // Limpieza del timer por seguridad
      return () => clearTimeout(timer);
    }
  }, [result, navigate]);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full relative overflow-hidden bg-surface py-space-xl px-gutter">
        {/* Luces decorativas de fondo */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-tertiary-container/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Encabezado */}
          <div className="mb-space-xl text-left">
            <div className="flex items-center gap-space-xs mb-space-xs">
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-surface-container-high px-2 py-1 rounded">
                Temporada 2026
              </span>
              <span className="font-label-sm text-label-sm text-secondary">Inscripción Rápida</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Registro de <span className="text-primary-container">Pintor Digital</span>
            </h1>
            <p className="font-body-md text-body-md text-secondary mt-1 max-w-xl">
              Únete a la liga de arte digital. Completa tus datos esenciales para ingresar al torneo
              oficial.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Formulario (columnas 1-8) */}
            <div className="lg:col-span-8 bg-surface-variant p-6 sm:p-8 md:p-10 rounded-xl shadow-xl relative">
              <div className="flex items-center justify-between pb-space-md mb-space-lg pt-1 border-t border-outline-variant/20">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
                    <Icon name="palette" className="text-[24px]" />
                  </div>
                  <div>
                    <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
                      Ficha del Artista
                    </h2>
                    <p className="font-body-sm text-body-sm text-secondary">
                      Completa los campos para configurar tu perfil de competición.
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-primary uppercase bg-surface-container-high px-3 py-1 rounded-full">
                  Paso Único
                </span>
              </div>

              <form className="space-y-space-md" onSubmit={handleSubmit}>
                {/* Foto de perfil */}
                <div className="flex flex-col sm:flex-row items-center gap-space-md p-space-md rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <div className="relative w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-primary-container/40">
                    <img alt="Vista previa del avatar" className="w-full h-full object-cover" src={avatarPreview} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="font-title-md text-title-md text-on-surface mb-0.5">
                      Foto de Perfil Oficial
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary mb-2">
                      Recomendado retrato cuadrado en PNG o JPG (máx. 8MB).
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm text-label-sm uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm">
                      <Icon name="upload" className="text-[16px] text-primary" />
                      <span>Subir Imagen</span>
                      <input accept="image/*" className="hidden" type="file" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </div>

                {/* Nombre y seudonimo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="space-y-1.5">
                    <label className={labelClase} htmlFor="fullName">
                      Nombre Completo <span className="text-primary-container">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Icon name="badge" className="absolute left-3 text-secondary text-[20px] pointer-events-none" />
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej. Valentina Morales"
                        className={inputClase}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClase} htmlFor="handle">
                      Seudónimo Artístico <span className="text-primary-container">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Icon name="draw" className="absolute left-3 text-secondary text-[20px] pointer-events-none" />
                      <input
                        id="handle"
                        type="text"
                        required
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="Ej. @Valen_Noir"
                        className={inputClase}
                      />
                    </div>
                  </div>
                </div>

                {/* Correo y contraseña */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="space-y-1.5">
                    <label className={labelClase} htmlFor="email">
                      Correo Electrónico <span className="text-primary-container">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Icon name="mail" className="absolute left-3 text-secondary text-[20px] pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="artista@estudio.pro"
                        className={inputClase}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClase} htmlFor="password">
                      Contraseña de Acceso <span className="text-primary-container">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Icon name="lock" className="absolute left-3 text-secondary text-[20px] pointer-events-none" />
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={inputClase}
                      />
                    </div>
                  </div>
                </div>

                {/* Certificacion de autoria humana */}
                <div className="pt-space-xs">
                  <label className="flex items-start gap-space-sm cursor-pointer p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container transition-colors group">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded-sm bg-surface-container accent-[#ff6b00] cursor-pointer"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors select-none leading-relaxed">
                      Certifico que mis obras son de{' '}
                      <strong className="text-primary">creación 100% humana</strong> y autorizo su
                      exhibición en las emisiones oficiales del torneo.
                    </span>
                  </label>
                </div>

                {/* Resultado de la peticion */}
                {error && (
                  <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
                    <Icon name="error" className="text-[20px]" />
                    <span>{error}</span>
                  </div>
                )}
                {result && (
                  <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-primary-container/15 border border-primary-container text-on-surface font-body-md text-body-md">
                    <Icon name="check_circle" filled className="text-[22px] text-primary-container" />
                    <div>
                      <div className="font-title-md text-title-md text-primary">
                        ¡Registro completado con éxito!
                      </div>
                      <div className="font-label-md text-label-md text-secondary mt-1">
                        ID: <span className="font-mono text-xs">{result.id}</span>
                      </div>
                      <p className="text-xs text-primary-container mt-2 font-medium">
                        ⚠️ Hemos descargado tu Llave Privada (.pem). Guárdala en un lugar seguro. Redirigiendo al inicio de sesión...
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-space-sm flex flex-col sm:flex-row items-center gap-space-md justify-between">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-space-sm px-8 py-3.5 bg-primary-container hover:bg-tertiary-container text-on-primary font-title-lg text-title-lg uppercase tracking-wider rounded-lg transition-all shadow-[0_0_24px_rgba(255,107,0,0.4)] hover:shadow-[0_0_32px_rgba(255,107,0,0.6)] group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{isLoading ? 'Registrando...' : 'Completar Registro'}</span>
                    <Icon
                      name={isLoading ? 'sync' : 'arrow_forward'}
                      className={`text-[20px] transition-transform ${isLoading ? 'animate-spin' : 'group-hover:translate-x-1'}`}
                    />
                  </button>
                  <Link
                    to={PATHS.sesion}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 bg-surface-container-high hover:bg-surface-bright text-on-surface font-title-md text-body-md rounded-lg transition-colors text-center whitespace-nowrap"
                  >
                    ¿Ya tienes cuenta? Iniciar Sesión
                  </Link>
                </div>
              </form>
            </div>

            {/* Barra lateral (columnas 9-12) */}
            <div className="lg:col-span-4 space-y-space-md">
              <div className="bg-surface-variant p-6 rounded-xl shadow-xl space-y-space-md border border-outline-variant/20">
                <div className="flex items-center gap-space-sm pb-2 border-b border-outline-variant/20">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
                    <Icon name="star" className="text-[20px]" />
                  </div>
                  <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">
                    ¿Por qué participar?
                  </h3>
                </div>
                <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
                  ArtClash Pro reúne el mejor talento de pintura digital en batallas directas y
                  transparentes.
                </p>

                <div className="space-y-space-sm">
                  {BENEFITS.map((beneficio) => (
                    <div
                      key={beneficio.title}
                      className="flex items-start gap-space-sm p-3 rounded-lg bg-surface-container-low border border-outline-variant/20"
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-0.5 text-primary">
                        <Icon name={beneficio.icon} className="text-[18px]" />
                      </div>
                      <div>
                        <h4 className="font-title-md text-body-md font-semibold text-on-surface">
                          {beneficio.title}
                        </h4>
                        <p className="font-body-sm text-body-sm text-secondary mt-0.5">{beneficio.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-space-sm p-3 bg-surface-container-low rounded-lg text-secondary border border-outline-variant/20">
                    <Icon name="support_agent" className="text-primary text-[20px]" />
                    <div className="min-w-0">
                      <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold">
                        ¿Necesitas ayuda?
                      </p>
                      <a href="#" className="font-body-sm text-body-sm text-primary hover:underline">
                        Canal de soporte en Discord 24/7
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prueba del motor criptografico */}
          <div className="mt-space-xl">
            <CryptoTestPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
