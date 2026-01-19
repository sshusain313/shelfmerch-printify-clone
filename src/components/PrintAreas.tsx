import printAreaFront from "@/assets/print-area-front.jpeg";
import printAreaBack from "@/assets/print-area-back.jpeg";

const printAreas = [
    { id: 1, label: "Front Center", image: printAreaFront, dimensions: "12\" × 16\"" },
    { id: 2, label: "Back Center", image: printAreaBack, dimensions: "12\" × 16\"" },
    { id: 3, label: "Left Chest", image: printAreaFront, dimensions: "4\" × 4\"" },
    { id: 4, label: "Right Sleeve", image: printAreaBack, dimensions: "3\" × 4\"" },
];

export const PrintAreas = () => {
    return (
        <section className="space-y-4">
            <h2 className="section-title">Print Areas</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Available printing zones highlighted in orange. Each area supports high-quality DTG printing.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {printAreas.map((area) => (
                    <div key={area.id} className="text-center space-y-2">
                        <div className="aspect-square bg-secondary rounded-xl overflow-hidden p-4">
                            <img
                                src={area.image}
                                alt={area.label}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{area.label}</p>
                            <p className="text-xs text-muted-foreground">{area.dimensions}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
