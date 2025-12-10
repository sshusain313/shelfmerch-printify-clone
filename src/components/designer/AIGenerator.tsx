import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
}

const stylePresets = [
  { id: 'realistic', name: 'Realistic', thumbnail: '🎨' },
  { id: 'cartoon', name: 'Cartoon', thumbnail: '🖼️' },
  { id: 'watercolor', name: 'Watercolor', thumbnail: '💧' },
  { id: 'oil-painting', name: 'Oil Painting', thumbnail: '🖌️' },
  { id: 'digital-art', name: 'Digital Art', thumbnail: '💻' },
  { id: 'sketch', name: 'Sketch', thumbnail: '✏️' },
  { id: 'anime', name: 'Anime', thumbnail: '🎭' },
  { id: '3d-render', name: '3D Render', thumbnail: '🎲' },
];

const AIGenerator: React.FC<AIGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(10); // Mock credits
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  const maxChars = 1000;

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    try {
      // Mock API call - replace with actual GPT API
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const enhanced = `High quality, professional ${prompt}, detailed, 4k resolution, ${selectedStyle ? stylePresets.find(s => s.id === selectedStyle)?.name.toLowerCase() : 'realistic'} style`;
      setEnhancedPrompt(enhanced);
      setPrompt(enhanced);
      toast.success('Prompt enhanced!');
    } catch (error) {
      toast.error('Failed to enhance prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (credits <= 0) {
      toast.error('Insufficient credits. Please purchase more.');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Mock API call - replace with actual DALL-E/Midjourney/Stable Diffusion API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In production, this would be the actual API response
      const mockImageUrl = `https://via.placeholder.com/512x512/26A17B/ffffff?text=${encodeURIComponent(prompt.slice(0, 20))}`;
      
      setCredits(prev => prev - 1);
      onImageGenerated(mockImageUrl);
      toast.success('Image generated successfully!');
    } catch (error) {
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Image Generator</h3>
        <Badge variant="outline">{credits} credits</Badge>
      </div>

      <div>
        <Label>Prompt</Label>
        <Textarea
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setPrompt(e.target.value);
            }
          }}
          rows={4}
          className="resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {prompt.length}/{maxChars} characters
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnhancePrompt}
            disabled={isGenerating || !prompt.trim()}
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Enhance
          </Button>
        </div>
      </div>

      <div>
        <Label>Style Preset</Label>
        <ScrollArea className="h-32">
          <div className="grid grid-cols-4 gap-2">
            {stylePresets.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  selectedStyle === style.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="text-2xl mb-1">{style.thumbnail}</div>
                <div className="text-xs">{style.name}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Button
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim() || credits <= 0}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Image
          </>
        )}
      </Button>

      {enhancedPrompt && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Enhanced Prompt:</p>
          <p className="text-sm">{enhancedPrompt}</p>
        </div>
      )}
    </div>
  );
};

export default AIGenerator;

