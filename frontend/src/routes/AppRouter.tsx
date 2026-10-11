/**
 * routes/AppRouter.tsx
 * Define qué página se muestra en cada URL.
 *
 * Hay dos grupos de rutas porque usan encabezados distintos:
 *  - Inicio → MainLayout con variante "public".
 *  - Resto  → MainLayout con variante "competition".
 * Cualquier ruta desconocida redirige a Inicio.
 */
/**
 * routes/AppRouter.tsx
 * Define qué página se muestra en cada URL.
 *
 * Hay dos grupos de rutas porque usan encabezados distintos:
 *  - Inicio → MainLayout con variante "public".
 *  - Resto  → MainLayout con variante "competition".
 * Cualquier ruta desconocida redirige a Inicio.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { PATHS } from './paths';

import InicioPage from '../pages/InicioPage';
import RegistroPintorPage from '../pages/RegistroPintorPage';
import RegistroJuradoPage from '../pages/RegistroJuradoPage';
import PanelPintorPage from '../pages/PanelPintorPage';
import EvaluacionJuradoPage from '../pages/EvaluacionJuradoPage';
import VistoBuenoPresidentePage from '../pages/VistoBuenoPresidentePage';
import ResultadosPage from '../pages/ResultadosPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout variant="public" />}>
        <Route path={PATHS.inicio} element={<InicioPage />} />
      </Route>

      <Route element={<MainLayout variant="competition" />}>
        <Route path={PATHS.registroPintor} element={<RegistroPintorPage />} />
        <Route path={PATHS.registroJurado} element={<RegistroJuradoPage />} />
        <Route path={PATHS.panelPintor} element={<PanelPintorPage />} />
        <Route path={PATHS.evaluacionJurado} element={<EvaluacionJuradoPage />} />
        <Route path={PATHS.vistoBuenoPresidente} element={<VistoBuenoPresidentePage />} />
        <Route path={PATHS.resultados} element={<ResultadosPage />} />
      </Route>

      <Route path="*" element={<Navigate to={PATHS.inicio} replace />} />
    </Routes>
  );
}
