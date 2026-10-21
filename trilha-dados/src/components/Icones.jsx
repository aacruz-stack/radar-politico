// Ícones SVG inline (traço), para não depender de biblioteca externa.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const Icone = ({ children, className = 'size-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
    {children}
  </svg>
)

export const IconeMenu = (p) => <Icone {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icone>
export const IconeFechar = (p) => <Icone {...p}><path d="M6 6l12 12M18 6L6 18" /></Icone>
export const IconeCheck = (p) => <Icone {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icone>
export const IconeSeta = (p) => <Icone {...p}><path d="M9 6l6 6-6 6" /></Icone>
export const IconeVoltar = (p) => <Icone {...p}><path d="M15 6l-6 6 6 6" /></Icone>
export const IconePlay = (p) => <Icone {...p}><path d="M8 5.5v13l10.5-6.5z" /></Icone>
export const IconeNota = (p) => <Icone {...p}><path d="M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5" /></Icone>
export const IconeLampada = (p) => <Icone {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></Icone>
export const IconeDownload = (p) => <Icone {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></Icone>
export const IconeNuvem = (p) => <Icone {...p}><path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.3 1.5A3.75 3.75 0 0 1 17.5 18z" /></Icone>
export const IconeExterno = (p) => <Icone {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Icone>
export const IconeTrofeu = (p) => <Icone {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></Icone>
