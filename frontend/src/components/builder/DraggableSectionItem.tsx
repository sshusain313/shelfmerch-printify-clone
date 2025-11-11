import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { BuilderSection } from '@/types/builder';
import SectionRenderer from './SectionRenderer';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface DraggableSectionItemProps {
  section: BuilderSection;
  products: Product[];
  globalStyles: any;
  onEdit: (section: BuilderSection) => void;
  onRemove: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string) => void;
  onSelect?: (section: BuilderSection) => void;
  isSelected?: boolean;
}

const DraggableSectionItem: React.FC<DraggableSectionItemProps> = ({
  section,
  products,
  globalStyles,
  onEdit,
  onRemove,
  onToggleVisibility,
  onSelect,
  isSelected = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group border-2 border-dashed border-transparent hover:border-primary rounded-xl transition-all',
        isSelected && 'border-primary shadow-lg'
      )}
      onClick={() => onSelect?.(section)}
    >
      {/* Section Content */}
      <div className={section.visible ? '' : 'opacity-50'}>
        <SectionRenderer
          section={section}
          products={products}
          globalStyles={globalStyles}
          isPreview={true}
        />
      </div>

      {/* Control Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
      
      {/* Control Buttons */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0"
          onClick={() => onToggleVisibility(section.id)}
        >
          {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(section)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 w-8 p-0"
          onClick={() => onRemove(section.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Drag Handle Label */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
          {section.type}
        </div>
      </div>
    </div>
  );
};

export default DraggableSectionItem;
