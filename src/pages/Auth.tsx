import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  loginSchema,
  forgotPasswordSchema,
  newPasswordSchema,
} from "@/lib/schemas/auth";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";

type AuthMode = "login" | "forgot" | "reset";

const NODES: Array<[number, number]> = [
  [80, 90], [200, 60], [310, 130], [150, 200],
  [260, 240], [90, 300], [340, 320], [190, 360],
];
const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [1, 3], [2, 4], [3, 4],
  [4, 6], [5, 3], [5, 7], [6, 7], [3, 0],
];

const FEATURES = [
  { label: "Dashboard operacional" },
  { label: "Controle de estoque em tempo real" },
  { label: "Análise financeira completa" },
  { label: "Assistente IA integrado" },
];

function AuthLeftPanel() {
  return (
    <aside className="auth-left">
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <svg className="auth-network" viewBox="0 0 420 440" fill="none" aria-hidden="true">
        {EDGES.map(([a, b], i) => (
          <line
            key={`e-${i}`}
            x1={NODES[a][0]} y1={NODES[a][1]}
            x2={NODES[b][0]} y2={NODES[b][1]}
            stroke="rgba(167,139,250,0.25)"
            strokeWidth="1"
          />
        ))}
        {NODES.map(([x, y], i) => (
          <circle
            key={`n-${i}`}
            cx={x} cy={y} r="3.5"
            fill="rgba(167,139,250,0.7)"
          />
        ))}
      </svg>

      <div className="auth-left-body">
        <img
          src="/logo-printmycase.png"
          alt="Print My Case"
          className="auth-logo-left"
        />

        <div className="auth-tagline">
          <h2 className="auth-tagline-title">
            Gestão completa<br />dos seus PDVs
          </h2>
          <p className="auth-tagline-sub">
            Estoque, vendas e finanças em um só lugar — em tempo real.
          </p>
        </div>

        <div className="auth-features">
          {FEATURES.map((f) => (
            <div key={f.label} className="auth-feature">
              <span className="auth-feature-dot" />
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <AuthLeftPanel />
      <main className="auth-right">
        <div className="auth-form-wrap">
          <img
            src="/logo-printmycase.png"
            alt="Print My Case"
            className="auth-logo-mobile"
          />
          <header className="auth-header">
            <h1 className="auth-title">{title}</h1>
            <p className="auth-sub">{subtitle}</p>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, signIn, resetPassword, updatePassword, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [waitingForSession, setWaitingForSession] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPasswordData, setNewPasswordData] = useState({ password: "", confirmPassword: "" });

  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [newPasswordErrors, setNewPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "reset") {
      setMode("reset");
      if (!session) {
        setWaitingForSession(true);
      }
    }
  }, [searchParams, session]);

  useEffect(() => {
    if (session && waitingForSession) {
      setWaitingForSession(false);
    }
  }, [session, waitingForSession]);

  useEffect(() => {
    if (user && mode !== "reset") {
      navigate("/");
    }
  }, [user, navigate, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setLoginErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      toast.error("Erro ao entrar", {
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos"
          : error.message,
      });
    } else {
      toast.success("Bem-vindo!", {
        description: "Login realizado com sucesso",
      });
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrors({});

    const result = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setForgotErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(forgotEmail);
    setIsLoading(false);

    if (error) {
      toast.error("Erro ao enviar email", { description: error.message });
    } else {
      setResetEmailSent(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordErrors({});

    const result = newPasswordSchema.safeParse(newPasswordData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setNewPasswordErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPasswordData.password);
    setIsLoading(false);

    if (error) {
      toast.error("Erro ao atualizar senha", { description: error.message });
    } else {
      setPasswordUpdated(true);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mode === "forgot") {
    const title = resetEmailSent ? "Link enviado!" : "Recuperar senha";
    const subtitle = resetEmailSent
      ? `Confira sua caixa em ${forgotEmail}`
      : "Enviaremos um link para redefinir sua senha";

    return (
      <AuthShell title={title} subtitle={subtitle}>
        {resetEmailSent ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-[hsl(var(--success))]" />
            </div>
            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                setMode("login");
                setResetEmailSent(false);
                setForgotEmail("");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="auth-label">Email</label>
              <div className={`auth-input-row ${forgotErrors.email ? "error" : ""}`}>
                <span className="auth-input-prefix"><Mail className="h-4 w-4" /></span>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="auth-input"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotErrors.email) setForgotErrors({});
                  }}
                />
              </div>
              {forgotErrors.email && <p className="auth-err-msg">{forgotErrors.email}</p>}
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>) : "Enviar link de recuperação"}
            </button>

            <button
              type="button"
              className="auth-forgot"
              onClick={() => setMode("login")}
              style={{ display: "flex", alignItems: "center", gap: 6, margin: "12px auto 0" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para login
            </button>
          </form>
        )}
      </AuthShell>
    );
  }

  if (mode === "reset") {
    if (waitingForSession || (searchParams.get("mode") === "reset" && !session)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Validando link de recuperação...</p>
        </div>
      );
    }

    const title = passwordUpdated ? "Senha atualizada!" : "Nova senha";
    const subtitle = passwordUpdated
      ? "Sua senha foi alterada com sucesso"
      : "Crie sua nova senha";

    return (
      <AuthShell title={title} subtitle={subtitle}>
        {passwordUpdated ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-[hsl(var(--success))]" />
            </div>
            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                setMode("login");
                setPasswordUpdated(false);
                setNewPasswordData({ password: "", confirmPassword: "" });
                navigate("/auth");
              }}
            >
              Ir para login
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="auth-label">Nova senha</label>
              <div className={`auth-input-row ${newPasswordErrors.password ? "error" : ""}`}>
                <span className="auth-input-prefix"><Lock className="h-4 w-4" /></span>
                <input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  className="auth-input"
                  value={newPasswordData.password}
                  onChange={(e) => {
                    setNewPasswordData({ ...newPasswordData, password: e.target.value });
                    if (newPasswordErrors.password) setNewPasswordErrors({});
                  }}
                />
              </div>
              {newPasswordErrors.password && <p className="auth-err-msg">{newPasswordErrors.password}</p>}
              {newPasswordData.password && (
                <div className="mt-2">
                  <PasswordStrengthIndicator password={newPasswordData.password} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="auth-label">Confirmar nova senha</label>
              <div className={`auth-input-row ${newPasswordErrors.confirmPassword ? "error" : ""}`}>
                <span className="auth-input-prefix"><Lock className="h-4 w-4" /></span>
                <input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  className="auth-input"
                  value={newPasswordData.confirmPassword}
                  onChange={(e) => {
                    setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value });
                    if (newPasswordErrors.confirmPassword) setNewPasswordErrors({});
                  }}
                />
              </div>
              {newPasswordErrors.confirmPassword && <p className="auth-err-msg">{newPasswordErrors.confirmPassword}</p>}
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Atualizando...</>) : "Atualizar senha"}
            </button>
          </form>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Bem-vindo"
      subtitle="Entre com suas credenciais para continuar"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="auth-label">Email</label>
          <div className={`auth-input-row ${loginErrors.email ? "error" : ""}`}>
            <span className="auth-input-prefix"><Mail className="h-4 w-4" /></span>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="auth-input"
              value={loginData.email}
              onChange={(e) => {
                setLoginData({ ...loginData, email: e.target.value });
                if (loginErrors.email) setLoginErrors({});
              }}
            />
          </div>
          {loginErrors.email && <p className="auth-err-msg">{loginErrors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="auth-label" style={{ marginBottom: 0 }}>Senha</label>
            <button
              type="button"
              className="auth-forgot"
              onClick={() => setMode("forgot")}
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className={`auth-input-row ${loginErrors.password ? "error" : ""}`}>
            <span className="auth-input-prefix"><Lock className="h-4 w-4" /></span>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="auth-input"
              value={loginData.password}
              onChange={(e) => {
                setLoginData({ ...loginData, password: e.target.value });
                if (loginErrors.password) setLoginErrors({});
              }}
            />
          </div>
          {loginErrors.password && <p className="auth-err-msg">{loginErrors.password}</p>}
        </div>

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>) : "Entrar"}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Para criar uma conta, entre em contato com o administrador.
        </p>
      </form>
    </AuthShell>
  );
}