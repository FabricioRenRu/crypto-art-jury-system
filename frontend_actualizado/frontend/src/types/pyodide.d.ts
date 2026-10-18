/**
 * types/pyodide.d.ts
 * Sirve para que el typescript no de error cuando use window.loadPyodide()
 * 
 * El objeto window ya tiene muchos metodos y propiedades estandar, si se quiere cargar una libreria externa
 * (pyodide), tenemos que definirlo explicitamente
 */

declare global {
    interface Window { 
        loadPyodide: (config?: Any) => Promise<Any>;
    }
}
