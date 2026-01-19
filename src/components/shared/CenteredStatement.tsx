interface CenteredStatementProps {
    text: string;
  }
  
  const CenteredStatement = ({ text }: CenteredStatementProps) => {
    return (
      <section className="py-3 lg:py-16 bg-background">
        <div className="container-custom">
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground leading-relaxed max-w-4xl mx-auto">
            {text}
          </p>
        </div>
      </section>
    );
  };
  
  export default CenteredStatement;