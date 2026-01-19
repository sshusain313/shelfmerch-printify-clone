import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { forwardRef } from "react";

const sizeData = [
    { size: "XS", chest: "34-36\"", length: "26\"", sleeve: "7.5\"" },
    { size: "S", chest: "36-38\"", length: "28\"", sleeve: "8.5\"" },
    { size: "M", chest: "40-42\"", length: "29\"", sleeve: "9\"" },
    { size: "L", chest: "44-46\"", length: "30\"", sleeve: "9.5\"" },
    { size: "XL", chest: "48-50\"", length: "31\"", sleeve: "10\"" },
    { size: "XXL", chest: "52-54\"", length: "32\"", sleeve: "10.5\"" },
];

export const SizeChart = forwardRef<HTMLDivElement>((_, ref) => {
    return (
        <section ref={ref} className="space-y-4">
            <h2 className="section-title">Size Chart</h2>
            <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary hover:bg-secondary">
                            <TableHead className="font-semibold text-foreground">Size</TableHead>
                            <TableHead className="font-semibold text-foreground">Chest</TableHead>
                            <TableHead className="font-semibold text-foreground">Length</TableHead>
                            <TableHead className="font-semibold text-foreground">Sleeve</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sizeData.map((row, idx) => (
                            <TableRow
                                key={row.size}
                                className={idx % 2 === 0 ? "bg-background" : "bg-secondary/50 hover:bg-secondary/60"}
                            >
                                <TableCell className="font-medium">{row.size}</TableCell>
                                <TableCell>{row.chest}</TableCell>
                                <TableCell>{row.length}</TableCell>
                                <TableCell>{row.sleeve}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
});

SizeChart.displayName = "SizeChart";