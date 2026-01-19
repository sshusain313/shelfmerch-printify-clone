import { LucideIcon } from 'lucide-react';

interface FeatureIconCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureIconCard = ({ icon: Icon, title, description }: FeatureIconCardProps) => {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureIconCard;