/**
 * pages/InicioPage.tsx
 * Página de Inicio (migrada de inicio.html).
 * Solo arma la página uniendo sus secciones; cada sección vive en components/home/.
 */
import HeroSection from '../components/home/HeroSection';
import CategoriesSection from '../components/home/CategoriesSection';
import PhasesSection from '../components/home/PhasesSection';
import CallToActionSection from '../components/home/CallToActionSection';

export default function InicioPage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <CategoriesSection />
      <PhasesSection />
      <CallToActionSection />
    </div>
  );
}
