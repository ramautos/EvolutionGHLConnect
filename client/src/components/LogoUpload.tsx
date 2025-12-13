import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
  maxSizeKB?: number;
  className?: string;
}

export function LogoUpload({
  value,
  onChange,
  maxSizeKB = 500,
  className,
}: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = useCallback(
    (file: File) => {
      setError(null);

      // Validar tipo
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        setError("Solo se permiten imágenes PNG, JPG, WebP o SVG");
        return;
      }

      // Validar tamaño
      const maxBytes = maxSizeKB * 1024;
      if (file.size > maxBytes) {
        setError(`El archivo es demasiado grande. Máximo ${maxSizeKB}KB`);
        return;
      }

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onChange(base64);
      };
      reader.onerror = () => {
        setError("Error al leer el archivo");
      };
      reader.readAsDataURL(file);
    },
    [maxSizeKB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        validateAndProcessFile(file);
      }
    },
    [validateAndProcessFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        validateAndProcessFile(file);
      }
    },
    [validateAndProcessFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-lg border-2 border-border bg-muted/30 flex items-center justify-center overflow-hidden">
            <img
              src={value}
              alt="Logo preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "flex flex-col items-center justify-center gap-2 text-muted-foreground",
            "hover:border-primary/50 hover:bg-muted/30",
            isDragging && "border-primary bg-primary/5",
            error && "border-destructive"
          )}
        >
          {isDragging ? (
            <>
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm text-primary">Suelta la imagen aquí</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm font-medium">Arrastra tu logo aquí</p>
              <p className="text-xs">o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground/70">
                PNG, JPG, WebP, SVG (máx {maxSizeKB}KB)
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
