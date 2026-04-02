import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageFile {
  name: string;
  url: string;
  created_at: string;
}

const ImageGallery = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase.storage.from("pill_images").list("", {
        limit: 12,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (!error && data) {
        const files = data
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({
            name: f.name,
            url: supabase.storage.from("pill_images").getPublicUrl(f.name).data.publicUrl,
            created_at: f.created_at,
          }));
        setImages(files);
      }
      setLoading(false);
    };
    fetchImages();
  }, []);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Camera className="w-4 h-4" /> Device Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images uploaded yet. Photos from your ESP32-CAM will appear here.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.name} className="rounded-lg overflow-hidden border border-border/50 bg-muted aspect-square">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGallery;
