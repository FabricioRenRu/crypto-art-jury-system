/**
 * api/apiEndpoints.ts
 * Diccionario centralizado de rutas del backend.
 * MODIFICARLOS, ESTA SOLO ES UNA BASE
 */
export const ENDPOINTS = {
  // Rutas de Autenticación
  AUTH: {
    REGISTRO_PINTOR: '/api/auth/pintores/registro',
    LOGIN_PINTOR: '/api/auth/pintores/login',
    LOGIN_JURADO: '/api/auth/jurados/login',
  },
  
  // Rutas de Pintores
  PINTORES: {
    BASE: '/api/pintores',
    ME: '/api/pintores/me',
    // Ejemplo con Path Parameter
    DETALLE: (idPintor: string) => `/api/pintores/${idPintor}`, 
  },

  // Rutas de Pinturas
  PINTURAS: {
    CARGAR: '/api/pinturas/cargar',
    MIS_OBRAS: '/api/pinturas/mis-obras',
    IMAGEN: (idPintura: string) => `/api/pinturas/${idPintura}/imagen`,
    DETALLE: (idPintura: string) => `/api/pinturas/${idPintura}`,
    
    // Ejemplo combinando Path y Query Parameters (ej. /pinturas/pintor/123?estado=evaluada)
    POR_PINTOR: (idPintor: string, estado?: string) => {
      const url = `/api/pinturas/pintor/${idPintor}`;
      return estado ? `${url}?estado=${estado}` : url;
    }
  },

  // Rutas de Chaum / Jurado
  EVALUACIONES: {
    FIRMAR_CEGADO: '/api/evaluaciones/firmar-cegado',
    ENVIAR_FINAL: '/api/evaluaciones/enviar',
    DESCARGAR_SOBRE: (idEvaluacion: string) => `/api/evaluaciones/${idEvaluacion}/sobre`
  }
} as const;