import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ProductVariant, ViewKey } from '@/types/product';

interface VariantImagesModalProps {
    variant: ProductVariant;
    isOpen: boolean;
    onClose: () => void;
    onSave: (variantId: string, viewImages: ProductVariant['viewImages']) => void;
}

const VIEWS: { key: ViewKey; label: string }[] = [
    { key: 'front', label: 'Front View' },
    { key: 'back', label: 'Back View' },
    { key: 'left', label: 'Left View' },
    { key: 'right', label: 'Right View' },
];

export const VariantImagesModal = ({
    variant,
    isOpen,
    onClose,
    onSave,
}: VariantImagesModalProps) => {
    const { toast } = useToast();
    const [viewImages, setViewImages] = useState<ProductVariant['viewImages']>(
        variant.viewImages || { front: '', back: '', left: '', right: '' }
    );
    const [uploadingViews, setUploadingViews] = useState<Set<ViewKey>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // CRITICAL: Re-sync viewImages state when a different variant is selected
    // Without this, opening the modal for a different color shows stale data
    // Note: MongoDB uses _id, frontend uses id - check both
    useEffect(() => {
        setViewImages(variant.viewImages || { front: '', back: '', left: '', right: '' });
    }, [(variant as any)._id, variant.id, variant.viewImages]);

    const handleImageUpload = useCallback(async (view: ViewKey, file: File) => {
        setUploadingViews(prev => new Set(prev).add(view));

        try {
            const s3Url = await uploadApi.uploadImage(file, 'variant-images');
            setViewImages(prev => ({
                ...prev,
                [view]: s3Url,
            }));
            toast({
                title: 'Upload successful',
                description: `${view.charAt(0).toUpperCase() + view.slice(1)} image uploaded`,
            });
        } catch (error) {
            console.error('Error uploading variant image:', error);
            toast({
                title: 'Upload failed',
                description: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setUploadingViews(prev => {
                const next = new Set(prev);
                next.delete(view);
                return next;
            });
        }
    }, [toast]);

    const handleRemoveImage = useCallback((view: ViewKey) => {
        setViewImages(prev => ({
            ...prev,
            [view]: '',
        }));
    }, []);

    const handleSave = useCallback(() => {
        setIsSaving(true);
        try {
            // IMPORTANT: MongoDB uses _id, frontend uses id - support both
            const variantId = (variant as any)._id || variant.id;
            onSave(variantId, viewImages);
            toast({
                title: 'Saved',
                description: 'Variant images updated successfully',
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save variant images',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }, [variant.id, viewImages, onSave, onClose, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                {/* <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div
                            className="w-5 h-5 rounded-full border-2"
                            style={{
                                backgroundColor: variant.colorHex || '#ccc',
                                borderColor: variant.color?.toLowerCase() === 'white' ? '#E5E7EB' : 'transparent',
                            }}
                        />
                        Variant Images – {variant.size} / {variant.color}
                    </DialogTitle>
                </DialogHeader> */}

                <div className="grid grid-cols-2 gap-4 py-4">
                    {VIEWS.map(({ key, label }) => {
                        const imageUrl = viewImages?.[key] || '';
                        const isUploading = uploadingViews.has(key);

                        return (
                            <Card key={key} className="overflow-hidden">
                                <CardContent className="p-3 space-y-2">
                                    <Label className="text-sm font-medium">{label}</Label>

                                    <div className="relative aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="text-xs mt-1">Uploading...</span>
                                            </div>
                                        ) : imageUrl ? (
                                            <>
                                                <img
                                                    src={imageUrl}
                                                    alt={`${variant.color} ${label}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 hover:opacity-100 transition-opacity"
                                                    onClick={() => handleRemoveImage(key)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <ImageIcon className="h-8 w-8" />
                                                <span className="text-xs mt-1">No image</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(key, file);
                                            }}
                                            disabled={isUploading}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2"
                                            disabled={isUploading}
                                        >
                                            <Upload className="h-4 w-4" />
                                            {imageUrl ? 'Change' : 'Upload'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* <p className="text-xs text-muted-foreground">
                    💡 Upload base product images for this color variant. These will be used in the Mockups Library for realistic previews.
                </p> */}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || uploadingViews.size > 0}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Images'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
