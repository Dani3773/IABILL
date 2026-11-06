import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./brand/Logo";
import "../pages/auth.css";

export const AUTH_INPUT_CLASS =
  "w-full rounded-md bg-white text-[#17130e] text-[15px] px-3.5 py-3 border border-black/25 transition-all duration-200 placeholder:text-[#8a857b] " +
  "hover:border-black/50 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/40 focus:border-[#D92B21]";

export const AUTH_BUTTON_CLASS =
  "w-full flex items-center justify-center gap-2 bg-[#D92B21] hover:bg-[#B4201A] active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none text-white text-[15px] font-semibold rounded-md py-3 transition-all duration-200";

// Moldura comum das telas de acesso, a mesma do login.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__frame">
        <main className="auth__main">
          <Link to="/" aria-label="IABill" className="auth__logo">
            <Logo />
          </Link>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-[#4a4640] tracking-wide mb-1.5">{label}</span>
      {children}
    </label>
  );
}
