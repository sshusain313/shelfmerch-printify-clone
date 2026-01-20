
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

// const productTypes = [
//   { name: "T-shirt" },
//   { name: "Hoodie" },
//   { name: "Sweatshirt" },
//   { name: "Jacket" },
//   { name: "Crop Top" },
//   { name: "Tank Top" },
// ];

const materials = [
  { name: "Cotton" },
  { name: "Organic Cotton" },
  { name: "Polyester" },
  { name: "Blends" },
];

const printMethods = [
  { name: "DTG" },
  { name: "Screen Print" },
  { name: "Embroidery" },
  { name: "AOP" },
];

const colors = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Red", hex: "#ef4444" },
  { name: "Green", hex: "#22c55e" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "green", hex: "#eab308" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Orange", hex: "#f97316" },
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const deliveryOptions = [
  { name: "2-4 days" },
  { name: "5-7 days" },
  { name: "7-10 days" },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection = ({ title, children, defaultOpen = true }: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-semibold mb-3"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );
};

interface FilterCheckboxProps {
  name: string;
  checked: boolean;
  onChange: () => void;
}

const FilterCheckbox = ({ name, checked, onChange }: FilterCheckboxProps) => (
  <label className="flex items-center cursor-pointer group" onClick={onChange}>
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
          checked
            ? "bg-foreground border-foreground"
            : "border-muted-foreground group-hover:border-foreground"
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        )}
      </div>
      <span className="text-sm text-foreground group-hover:text-foreground transition-colors">
        {name}
      </span>
    </div>
  </label>
);

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

const FilterChip = ({ label, onRemove }: FilterChipProps) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center justify-center"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export const FilterSidebar = () => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedPrintMethods, setSelectedPrintMethods] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);

  const toggleFilter = (
    item: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const activeFiltersCount =
    selectedTypes.length +
    selectedMaterials.length +
    selectedPrintMethods.length +
    selectedColors.length +
    selectedSizes.length +
    selectedDelivery.length;

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedMaterials([]);
    setSelectedPrintMethods([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedDelivery([]);
    setPriceRange([0, 5000]);
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-[160px] bg-background">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="font-bold text-lg">Filters</h3>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-black hover:underline flex items-center gap-1"
            >
              Clear all
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Active filters */}
        {activeFiltersCount > 0 && (
          <div className="py-3 flex flex-wrap gap-2">
            {selectedTypes.map((type) => (
              <FilterChip
                key={`type-${type}`}
                label={type}
                onRemove={() =>
                  setSelectedTypes(selectedTypes.filter((value) => value !== type))
                }
              />
            ))}
            {selectedMaterials.map((material) => (
              <FilterChip
                key={`material-${material}`}
                label={material}
                onRemove={() =>
                  setSelectedMaterials(
                    selectedMaterials.filter((value) => value !== material)
                  )
                }
              />
            ))}
            {selectedColors.map((color) => (
              <FilterChip
                key={`color-${color}`}
                label={color}
                onRemove={() =>
                  setSelectedColors(selectedColors.filter((value) => value !== color))
                }
              />
            ))}
            {selectedSizes.map((size) => (
              <FilterChip
                key={`size-${size}`}
                label={size}
                onRemove={() =>
                  setSelectedSizes(selectedSizes.filter((value) => value !== size))
                }
              />
            ))}
          </div>
        )}

        {/* Filter sections */}
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {/* <FilterSection title="Product Type">
            {productTypes.map((type) => (
              <FilterCheckbox
                key={type.name}
                name={type.name}
                checked={selectedTypes.includes(type.name)}
                onChange={() => toggleFilter(type.name, selectedTypes, setSelectedTypes)}
              />
            ))}
          </FilterSection> */}

          <FilterSection title="Material">
            {materials.map((material) => (
              <FilterCheckbox
                key={material.name}
                name={material.name}
                checked={selectedMaterials.includes(material.name)}
                onChange={() =>
                  toggleFilter(material.name, selectedMaterials, setSelectedMaterials)
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="Print Method">
            {printMethods.map((method) => (
              <FilterCheckbox
                key={method.name}
                name={method.name}
                checked={selectedPrintMethods.includes(method.name)}
                onChange={() =>
                  toggleFilter(method.name, selectedPrintMethods, setSelectedPrintMethods)
                }
              />
            ))}
          </FilterSection>

          <FilterSection title="Price Range">
            <div className="space-y-3">
              {/* Price display */}
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-foreground">₹0</span>
                <span className="text-foreground">₹{priceRange[1]}</span>
              </div>

              
              {/* Bottom slider with single green track + handle */}
              <input
                type="range"
                min={0}
                max={5000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-2 cursor-pointer bg-green-500 rounded-full appearance-none
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-gray-700
                           [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                           [&::-webkit-slider-thumb]:shadow-md
                           [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                           [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:background-transparent
                           [&::-moz-range-thumb]:background-color:transparent"
              />
            </div>
          </FilterSection>

          <FilterSection title="Colors">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => toggleFilter(color.name, selectedColors, setSelectedColors)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColors.includes(color.name)
                      ? "border-foreground scale-110 ring-2 ring-green-500 ring-offset-2"
                      : "border-border hover:border-foreground"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Sizes">
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const active = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleFilter(size, selectedSizes, setSelectedSizes)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors
                      ${active
                        ? "bg-green-50 text-green-700 border-green-500"
                        : "bg-white text-foreground border-border hover:border-gray-400"
                      }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title="Delivery Time">
            {deliveryOptions.map((option) => (
              <FilterCheckbox
                key={option.name}
                name={option.name}
                checked={selectedDelivery.includes(option.name)}
                onChange={() =>
                  toggleFilter(option.name, selectedDelivery, setSelectedDelivery)
                }
              />
            ))}
          </FilterSection>
        </div>
      </div>
    </aside>
  );
};