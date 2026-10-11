/**
 * components/home/CategoryCard.tsx
 * Tarjeta de una categoría del concurso: imagen (con zoom al pasar el mouse),
 * título y descripción.
 */
import type { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="bg-surface-container-high rounded-xl overflow-hidden shadow-lg flex flex-col hover:bg-surface-bright transition-all group">
      <div className="relative h-56 w-full overflow-hidden">
        <img
          alt={category.title}
          src={category.imageUrl}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-headline-sm text-title-lg text-on-surface mb-2">{category.title}</h3>
          <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>
    </div>
  );
}
