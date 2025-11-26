import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ProductFAQ } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductFAQSectionProps {
  faqs: ProductFAQ[];
  onChange: (faqs: ProductFAQ[]) => void;
}

export const ProductFAQSection = ({ faqs, onChange }: ProductFAQSectionProps) => {
  const handleAddFAQ = () => {
    const newFAQ: ProductFAQ = {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: '',
      answer: '',
      order: faqs.length,
    };
    onChange([...faqs, newFAQ]);
  };

  const handleRemoveFAQ = (id: string) => {
    const updatedFAQs = faqs
      .filter(faq => faq.id !== id)
      .map((faq, index) => ({ ...faq, order: index }));
    onChange(updatedFAQs);
  };

  const handleUpdateFAQ = (id: string, field: 'question' | 'answer', value: string) => {
    const updatedFAQs = faqs.map(faq =>
      faq.id === id ? { ...faq, [field]: value } : faq
    );
    onChange(updatedFAQs);
  };

  const handleMoveFAQ = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const updatedFAQs = [...faqs];
    const [movedFAQ] = updatedFAQs.splice(fromIndex, 1);
    updatedFAQs.splice(toIndex, 0, movedFAQ);
    
    // Update order
    const reorderedFAQs = updatedFAQs.map((faq, index) => ({
      ...faq,
      order: index,
    }));
    
    onChange(reorderedFAQs);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
          <p className="text-sm text-muted-foreground">
            Add common questions and answers about this product to help customers
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddFAQ}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      {faqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground text-center mb-4">
              No FAQs added yet. Click "Add FAQ" to create your first question.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddFAQ}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add First FAQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={faq.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4 cursor-move" />
                      <span className="text-sm font-medium">FAQ #{index + 1}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFAQ(faq.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`faq-question-${faq.id}`}>
                    Question <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`faq-question-${faq.id}`}
                    placeholder="e.g., What is the return policy for this product?"
                    value={faq.question}
                    onChange={(e) => handleUpdateFAQ(faq.id, 'question', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-answer-${faq.id}`}>
                    Answer <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={`faq-answer-${faq.id}`}
                    placeholder="e.g., We offer a 30-day return policy. Items must be unused and in original packaging."
                    value={faq.answer}
                    onChange={(e) => handleUpdateFAQ(faq.id, 'answer', e.target.value)}
                    className="w-full min-h-[100px]"
                    rows={4}
                  />
                </div>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveFAQ(index, index - 1)}
                    className="text-xs"
                  >
                    Move Up
                  </Button>
                )}
                {index < faqs.length - 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveFAQ(index, index + 1)}
                    className="text-xs"
                  >
                    Move Down
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {faqs.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p>• FAQs will be displayed on the product detail page</p>
          <p>• Total FAQs: {faqs.length}</p>
        </div>
      )}
    </div>
  );
};


