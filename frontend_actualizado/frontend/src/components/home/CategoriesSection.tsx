/**
 * components/home/CategoriesSection.tsx
 * Sección "Categorías Oficiales": recorre la lista de categorías y pinta una tarjeta por cada una.
 */
import SectionHeading from '../ui/SectionHeading';
import CategoryCard from './CategoryCard';
import { CATEGORIES } from '../../data/categories';

export default function CategoriesSection() {
  return (
    <section className="w-full py-20 bg-surface border-t border-outline-variant/20">
      <div className="max-w-[1400px] mx-auto px-margin-mobile md:px-margin">
        <SectionHeading
          title="Categorías Oficiales"
          subtitle="Cuatro disciplinas principales evaluadas con rúbricas de técnica, narrativa visual y composición."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
