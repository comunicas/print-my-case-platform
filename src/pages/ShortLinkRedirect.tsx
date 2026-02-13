import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ShortLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;

    const redirect = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redirect-short-link?code=${encodeURIComponent(code)}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!res.ok) {
          setError(true);
          return;
        }

        const result = await res.json();
        if (result.target_url) {
          window.location.replace(result.target_url);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    redirect();
  }, [code]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-lg text-muted-foreground">Link não encontrado</p>
        <a href="/" className="text-primary underline">Voltar ao início</a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
