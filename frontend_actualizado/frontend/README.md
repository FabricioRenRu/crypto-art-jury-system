# ArtClash Pro

Plataforma web del concurso de arte digital ArtClash Pro, hecha con **React + TypeScript**, **Vite**, **Tailwind CSS** y **React Router**.

## Requisitos

- **Node.js 18 o superior.** Verifica con `node -v`. Si no lo tienes, descárgalo de [nodejs.org](https://nodejs.org) (versión LTS).
- **pnpm.** Verifica con `pnpm -v`. Si no lo tienes, instálalo con uno de estos comandos:

```bash
npm install -g pnpm
# o bien
corepack enable
```

## Cómo correr el proyecto

1. Clona o descarga el proyecto y entra a la carpeta:

```bash
cd artclash
```

2. Instala las dependencias:

```bash
pnpm install
```

3. Levanta el servidor de desarrollo:

```bash
pnpm dev
```

4. Abre en el navegador la URL que aparece en la terminal (normalmente http://localhost:5173).

## Otros comandos

| Comando        | Qué hace                                          |
|----------------|---------------------------------------------------|
| `pnpm dev`     | Servidor de desarrollo con recarga automática     |
| `pnpm build`   | Genera la versión de producción en `dist/`        |
| `pnpm preview` | Sirve la versión compilada para probarla          |

> Usen **pnpm** para todo, no npm ni yarn, para no generar otro archivo de lock y evitar conflictos con `pnpm-lock.yaml`.

## Estructura del proyecto

```
src/
├── main.tsx          # Punto de entrada: monta la app
├── App.tsx           # Envuelve la app con el router
├── index.css         # Tailwind + estilos globales
├── routes/           # URLs (paths.ts) y definición de rutas (AppRouter.tsx)
├── pages/            # Una página por ruta
├── components/
│   ├── layout/       # Header, Footer y MainLayout
│   ├── ui/           # Componentes reutilizables (Icon, SectionHeading, PendingPage)
│   ├── home/         # Secciones de la página de Inicio
│   └── approval/     # Tabla, filas y modal del Visto Bueno del Presidente
├── hooks/            # Hooks personalizados (selección de obras, cuenta regresiva)
├── data/             # Datos estáticos: categorías, fases, obras, menú
└── types/            # Interfaces de TypeScript
```

Cada archivo tiene al inicio un comentario que explica para qué sirve.

## Páginas

| Ruta                      | Página                    | Estado        |
|---------------------------|---------------------------|---------------|
| `/`                       | Inicio                    | Lista         |
| `/visto-bueno-presidente` | Visto Bueno Presidente    | Lista         |
| `/registro-pintor`        | Registro Pintor           | En desarrollo |
| `/registro-jurado`        | Registro Jurado           | En desarrollo |
| `/panel-pintor`           | Panel Pintor              | En desarrollo |
| `/evaluacion-jurado`      | Evaluación Jurado         | En desarrollo |
| `/resultados`             | Resultados & Podio        | En desarrollo |

## Notas

- Los colores, fuentes y tamaños del diseño están en `tailwind.config.js`.
- El proyecto usa **Tailwind v3**. Si reinstalan Tailwind, usen `pnpm add -D tailwindcss@3`; la v4 cambia la configuración y rompe los estilos.
- Las obras de `src/data/artworks.ts` son datos de ejemplo mientras no haya backend.