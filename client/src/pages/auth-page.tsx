import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      await login(values.username, values.password);
      setLocation("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      await register(values.username, values.email, values.password);
      setLocation("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-semibold">API Gateway</CardTitle>
            <CardDescription>
              Secure authentication and authorization for your services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username"
                              data-testid="input-login-username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              data-testid="input-login-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              data-testid="input-register-username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              data-testid="input-register-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create a password"
                              data-testid="input-register-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              data-testid="input-register-confirm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-register"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Enterprise-Grade API Management
          </h2>
          <p className="text-muted-foreground text-lg">
            Secure, monitor, and control access to your backend services with powerful authentication, 
            rate limiting, and real-time analytics.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm text-foreground">JWT-based authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm text-foreground">Service registry & routing</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm text-foreground">API key management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm text-foreground">Rate limiting & monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
