'use client';

import React, { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const result = await signIn('credentials', {
          email: email.toLowerCase().trim(),
          password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error.includes('locked') || result.error.includes('Failed')) {
            setError('Compte verrouillé. Contactez l\'administrateur.');
          } else {
            setError('Email ou mot de passe incorrect.');
          }
        }
        // On success, NextAuth will update the session and the parent component
        // will re-render showing the cockpit
      } catch (err) {
        setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    },
    [email, password]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-80 rounded-full bg-fun-blue/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-tango/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
            <img src="/logo-ansut.png" alt="ANSUT" className="size-14 object-cover rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ANSUT Cockpit DG</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tableau de Bord de Direction Générale
          </p>
        </div>

        {/* Login card */}
        <Card className="shadow-xl ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder au cockpit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@ansut.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    autoFocus
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-fun-blue hover:bg-fun-blue/90 text-white font-medium"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 size-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            {/* Help text */}
            <div className="mt-6 rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-xs text-center text-muted-foreground">
                <span className="font-medium">Comptes de démonstration :</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span className="font-medium text-fun-blue">Administrateur</span>
                  <span>admin@ansut.ci</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-tango">Directeur Général</span>
                  <span>dg@ansut.ci</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-cyan-600">PMO</span>
                  <span>pmo@ansut.ci</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-violet-600">Conseiller Technique</span>
                  <span>ct@ansut.ci</span>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
                Mot de passe par défaut : <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">ansut2025</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} ANSUT — Agence Nationale des Services Universels des Télécommunications
        </p>
      </div>
    </div>
  );
}