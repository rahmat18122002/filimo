import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { uploadLargeVideo } from "@/lib/videoStorage";

interface VideoUploadButtonProps {
  onUploaded: (storageUrl: string) => void;
  label?: string;
}

/** Боркунии видеои калон мустақим ба анбори барнома — сервер лозим нест */
const VideoUploadButton = ({ onUploaded, label = "Загрузить видео" }: VideoUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    setDone(false);
    setProgress(0);
    try {
      const storageUrl = await uploadLargeVideo(file, setProgress);
      onUploaded(storageUrl);
      setDone(true);
      toast({ title: "Видео загружено ✅" });
    } catch (e) {
      toast({
        title: "Ошибка загрузки",
        description: e instanceof Error ? e.message : "Попробуйте ещё раз",
        variant: "destructive",
      });
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
      >
        {progress !== null ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{progress}%</>
        ) : done ? (
          <><CheckCircle2 className="mr-2 h-4 w-4 text-primary" />Загружено</>
        ) : (
          <><Upload className="mr-2 h-4 w-4" />{label}</>
        )}
      </Button>
      {progress !== null && <Progress value={progress} className="h-1.5" />}
    </div>
  );
};

export default VideoUploadButton;
