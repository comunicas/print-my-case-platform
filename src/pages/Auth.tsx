import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { 
  loginSchema, 
  forgotPasswordSchema, 
  newPasswordSchema 
} from "@/lib/schemas/auth";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";

type AuthMode = "login" | "forgot" | "reset";

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
      toast.error("Erro ao enviar email", {
        description: error.message,
      });
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
      toast.error("Erro ao atualizar senha", {
        description: error.message,
      });
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

  // Forgot Password Mode
  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/logo-printmycase.png" 
              alt="Print My Case" 
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground">Print My Case</h1>
            <p className="text-muted-foreground">Sistema de Gestão de PDVs</p>
          </div>

          <Card>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">Recuperar senha</CardTitle>
              <CardDescription className="text-center">
                {resetEmailSent 
                  ? "Verifique seu email" 
                  : "Informe seu email para receber o link de recuperação"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  </div>
                  <p className="text-muted-foreground">
                    Enviamos um link de recuperação para <strong>{forgotEmail}</strong>. 
                    Verifique sua caixa de entrada e spam.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setMode("login");
                      setResetEmailSent(false);
                      setForgotEmail("");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        className={`pl-10 ${forgotErrors.email ? "border-destructive" : ""}`}
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotErrors.email) setForgotErrors({});
                        }}
                      />
                    </div>
                    {forgotErrors.email && (
                      <p className="text-sm text-destructive">{forgotErrors.email}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar link de recuperação"
                    )}
                  </Button>

                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setMode("login")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset Password Mode
  if (mode === "reset") {
    if (waitingForSession || (searchParams.get("mode") === "reset" && !session)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Validando link de recuperação...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/logo-printmycase.png" 
              alt="Print My Case" 
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-foreground">Print My Case</h1>
            <p className="text-muted-foreground">Sistema de Gestão de PDVs</p>
          </div>

          <Card>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">
                {passwordUpdated ? "Senha atualizada!" : "Definir nova senha"}
              </CardTitle>
              <CardDescription className="text-center">
                {passwordUpdated 
                  ? "Sua senha foi alterada com sucesso" 
                  : "Digite sua nova senha abaixo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordUpdated ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  </div>
                  <p className="text-muted-foreground">
                    Você já pode fazer login com sua nova senha.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setMode("login");
                      setPasswordUpdated(false);
                      setNewPasswordData({ password: "", confirmPassword: "" });
                      navigate("/auth");
                    }}
                  >
                    Ir para login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${newPasswordErrors.password ? "border-destructive" : ""}`}
                        value={newPasswordData.password}
                        onChange={(e) => {
                          setNewPasswordData({ ...newPasswordData, password: e.target.value });
                          if (newPasswordErrors.password) setNewPasswordErrors({});
                        }}
                      />
                    </div>
                    {newPasswordErrors.password && (
                      <p className="text-sm text-destructive">{newPasswordErrors.password}</p>
                    )}
                    {newPasswordData.password && (
                      <PasswordStrengthIndicator password={newPasswordData.password} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${newPasswordErrors.confirmPassword ? "border-destructive" : ""}`}
                        value={newPasswordData.confirmPassword}
                        onChange={(e) => {
                          setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value });
                          if (newPasswordErrors.confirmPassword) setNewPasswordErrors({});
                        }}
                      />
                    </div>
                    {newPasswordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{newPasswordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      "Atualizar senha"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Login Mode (only login, no signup)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo-printmycase.png" 
            alt="Print My Case" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">Print My Case</h1>
          <p className="text-muted-foreground">Sistema de Gestão de PDVs</p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Acesse sua conta</CardTitle>
            <CardDescription className="text-center">
              Entre com seu email e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className={`pl-10 ${loginErrors.email ? "border-destructive" : ""}`}
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({ ...loginData, email: e.target.value });
                      if (loginErrors.email) setLoginErrors({});
                    }}
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-sm text-destructive">{loginErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Button 
                    type="button"
                    variant="link" 
                    className="px-0 h-auto font-normal text-sm"
                    onClick={() => setMode("forgot")}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-10 ${loginErrors.password ? "border-destructive" : ""}`}
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData({ ...loginData, password: e.target.value });
                      if (loginErrors.password) setLoginErrors({});
                    }}
                  />
                </div>
                {loginErrors.password && (
                  <p className="text-sm text-destructive">{loginErrors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Para criar uma conta, entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
