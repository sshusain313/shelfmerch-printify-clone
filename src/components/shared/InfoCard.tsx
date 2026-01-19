interface InfoCardProps {
    title: string;
    description: string;
  }
  
  const InfoCard = ({ title, description }: InfoCardProps) => {
    return (
      <div className="bg-card border border-border rounded-xl p-8 lg:p-4 shadow-sm card-hover">
        <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
        <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
      </div>
    );
  };
  
  export default InfoCard;