import { Link } from 'react-router-dom';
import { FOOTER_LINKS } from '../../data/navigation';
import { PATHS } from '../../routes/paths';

export default function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/20 bg-surface-container-lowest px-gutter py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Link
          to={PATHS.inicio}
          className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface"
        >
          ArtClash<span className="ml-0.5 text-primary-container">Pro</span>
        </Link>
        <nav aria-label="Enlaces informativos del pie de página" className="flex flex-wrap justify-center gap-4">
          {FOOTER_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
