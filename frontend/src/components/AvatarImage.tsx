import { useEffect, useState } from "react";

interface Props {
  email: string | null;
  name: string | null;
  size?: number;
  className?: string;
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarImage({ email, name, size = 32, className = "" }: Props) {
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!email) {
      setGravatarUrl(null);
      return;
    }
    sha256(email.trim().toLowerCase()).then((hash) => {
      // d=404 faz o Gravatar retornar erro real (em vez de um avatar generico)
      // quando a pessoa nao tem foto cadastrada - assim sabemos usar as iniciais.
      setGravatarUrl(`https://gravatar.com/avatar/${hash}?d=404&s=${size * 2}`);
    });
    setFailed(false);
  }, [email, size]);

  const showInitials = !gravatarUrl || failed;

  return (
    <div
      className={`rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/30 flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {showInitials ? (
        <span className="text-[#14B8A6] font-semibold" style={{ fontSize: size * 0.35 }}>
          {initials(name)}
        </span>
      ) : (
        <img
          src={gravatarUrl!}
          alt={name ?? "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}