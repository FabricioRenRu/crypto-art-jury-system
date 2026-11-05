/**
 * routes/AppRouter.tsx
 * Define qué página se muestra en cada URL.
 *
 * Las páginas comparten el mismo layout y encabezado.
 * Cualquier ruta desconocida redirige a Inicio.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { PATHS } from './paths';

import InicioPage from '../pages/InicioPage';
import SesionPage from '../pages/SesionPage';
import RegistroPintorPage from '../pages/RegistroPintorPage';
import RegistroJuradoPage from '../pages/RegistroJuradoPage';
import PanelPintorPage from '../pages/PanelPintorPage';
import RequireVault from '../pages/RequireVault';
import EvaluacionJuradoPage from '../pages/EvaluacionJuradoPage';
import VistoBuenoPresidentePage from '../pages/VistoBuenoPresidentePage';
import ResultadosPage from '../pages/ResultadosPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={PATHS.inicio} element={<InicioPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path={PATHS.sesion} element={<SesionPage />} />
        <Route path={PATHS.registroPintor} element={<RegistroPintorPage />} />
        <Route path={PATHS.registroJurado} element={<RegistroJuradoPage />} />
        <Route path={PATHS.panelPintor} element={<RequireVault rol="pintor"><PanelPintorPage /></RequireVault>} />
        <Route path={PATHS.evaluacionJurado} element={<RequireVault rol="jurado"><EvaluacionJuradoPage /></RequireVault>} />
        <Route
          path={PATHS.vistoBuenoPresidente}
          element={<RequireVault rol="presidente"><VistoBuenoPresidentePage /></RequireVault>}
        />
        <Route path={PATHS.resultados} element={<ResultadosPage />} />
      </Route>

      <Route path="*" element={<Navigate to={PATHS.inicio} replace />} />
    </Routes>
  );
}
