import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const resetEmailSchema = z.object({
  email: z.string().email("Email inválido"),
});

const newPasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type AuthMode = "login" | "forgot" | "reset";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, signIn, signUp, resetPassword, updatePassword, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [waitingForSession, setWaitingForSession] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPasswordData, setNewPasswordData] = useState({ password: "", confirmPassword: "" });
  
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [forgotErrors, setForgotErrors] = useState<Record<string, string>>({});
  const [newPasswordErrors, setNewPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user came from password reset email
    const modeParam = searchParams.get("mode");
    if (modeParam === "reset") {
      setMode("reset");
      // If no session yet, wait for Supabase to process URL tokens
      if (!session) {
        setWaitingForSession(true);
      }
    }
  }, [searchParams, session]);

  useEffect(() => {
    // When session is established and we were waiting, stop waiting
    if (session && waitingForSession) {
      setWaitingForSession(false);
    }
  }, [session, waitingForSession]);

  useEffect(() => {
    // Only redirect if user is logged in AND not in reset mode
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
      toast({
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso",
      });
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setSignupErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.name);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está em uso. Tente fazer login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Conta criada!",
        description: "Você foi conectado automaticamente.",
      });
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrors({});
    
    const result = resetEmailSchema.safeParse({ email: forgotEmail });
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
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
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
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
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

  // Reset Password Mode (after clicking email link)
  if (mode === "reset") {
    // Show loading while waiting for Supabase to establish session from URL tokens
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

  // Login/Signup Mode
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
              Entre com seu email e senha ou crie uma conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className={`pl-10 ${loginErrors.email ? "border-destructive" : ""}`}
                        value={loginData.email}
                        onChange={(e) => {
                          setLoginData({ ...loginData, email: e.target.value });
                          if (loginErrors.email) setLoginErrors({ ...loginErrors, email: "" });
                        }}
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="text-sm text-destructive">{loginErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${loginErrors.password ? "border-destructive" : ""}`}
                        value={loginData.password}
                        onChange={(e) => {
                          setLoginData({ ...loginData, password: e.target.value });
                          if (loginErrors.password) setLoginErrors({ ...loginErrors, password: "" });
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

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        className={`pl-10 ${signupErrors.name ? "border-destructive" : ""}`}
                        value={signupData.name}
                        onChange={(e) => {
                          setSignupData({ ...signupData, name: e.target.value });
                          if (signupErrors.name) setSignupErrors({ ...signupErrors, name: "" });
                        }}
                      />
                    </div>
                    {signupErrors.name && (
                      <p className="text-sm text-destructive">{signupErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        className={`pl-10 ${signupErrors.email ? "border-destructive" : ""}`}
                        value={signupData.email}
                        onChange={(e) => {
                          setSignupData({ ...signupData, email: e.target.value });
                          if (signupErrors.email) setSignupErrors({ ...signupErrors, email: "" });
                        }}
                      />
                    </div>
                    {signupErrors.email && (
                      <p className="text-sm text-destructive">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${signupErrors.password ? "border-destructive" : ""}`}
                        value={signupData.password}
                        onChange={(e) => {
                          setSignupData({ ...signupData, password: e.target.value });
                          if (signupErrors.password) setSignupErrors({ ...signupErrors, password: "" });
                        }}
                      />
                    </div>
                    {signupErrors.password && (
                      <p className="text-sm text-destructive">{signupErrors.password}</p>
                    )}
                    {signupData.password && (
                      <PasswordStrengthIndicator password={signupData.password} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        className={`pl-10 ${signupErrors.confirmPassword ? "border-destructive" : ""}`}
                        value={signupData.confirmPassword}
                        onChange={(e) => {
                          setSignupData({ ...signupData, confirmPassword: e.target.value });
                          if (signupErrors.confirmPassword) setSignupErrors({ ...signupErrors, confirmPassword: "" });
                        }}
                      />
                    </div>
                    {signupErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{signupErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}