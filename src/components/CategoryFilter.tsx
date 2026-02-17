import { motion } from "framer-motion";
import { categories, type Category } from "@/data/movies";

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className="relative whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors"
        >
          {selected === cat && (
            <motion.div
              layoutId="category-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 ${
              selected === cat
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
