'use client';

import React, { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      } catch (err) {
        setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    },
    [email, password]
  );

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#1a3a6e] via-[#1e4a8a] to-[#1a3a6e]">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-white/[0.03]" />
        <div className="pointer-events-none absolute -left-20 bottom-20 size-72 rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 size-48 rounded-full bg-white/[0.02]" />

        {/* Top: Logo */}
        <div className="relative z-10 p-10">
          <div className="flex size-14 items-center justify-center rounded-lg bg-white shadow-lg">
            <img src="/logo-ansut.png" alt="ANSUT" className="size-12 object-cover rounded-md" />
          </div>
        </div>

        {/* Center: Title + description */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
          <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
            Cockpit de Pilotage
            <br />
            Stratégique
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100/70 xl:text-lg">
            Transformez les données en décisions exécutives en temps réel.
            Consolidez vos indicateurs stratégiques, financiers et opérationnels
            en un tableau de bord unifié.
          </p>
        </div>

        {/* Bottom: Footer text */}
        <div className="relative z-10 p-10">
          <p className="text-sm text-blue-200/40">
            ANSUT — Agence Nationale du Service Universel des Télécommunications
            <span className="mx-2">·</span>
            Côte d&apos;Ivoire
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 dark:bg-gray-950 lg:p-12">
        <div className="w-full max-w-sm xl:max-w-[360px]">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#1a3a6e] shadow-md">
              <img src="/logo-ansut.png" alt="ANSUT" className="size-8 object-cover rounded-md" />
            </div>
            <span className="text-lg font-bold text-[#1a3a6e]">ANSUT</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connexion</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Accédez au tableau de bord de pilotage
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <Alert
              variant="destructive"
              className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <AlertCircle className="size-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                placeholder="nom@ansut.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#205eb3] focus:outline-none focus:ring-2 focus:ring-[#205eb3]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#4a8ad4] dark:focus:ring-[#4a8ad4]/20"
                required
                autoFocus
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-amber-200 bg-amber-50/60 px-3.5 py-2.5 pr-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#205eb3] focus:outline-none focus:ring-2 focus:ring-[#205eb3]/20 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#4a8ad4] dark:focus:ring-[#4a8ad4]/20"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                className="text-xs text-[#205eb3] hover:text-[#1a4a8a] dark:text-[#4a8ad4] dark:hover:text-[#6aa0e0] transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full py-2.5 bg-[#205eb3] hover:bg-[#1a4a8a] text-white font-medium rounded-md shadow-sm transition-colors h-auto text-sm"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          {/* Confidential notice */}
          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            Confidentiel — Usage interne ANSUT
          </p>

          {/* Mobile footer */}
          <p className="mt-4 text-center text-[11px] text-gray-300 dark:text-gray-600 lg:hidden">
            © {new Date().getFullYear()} ANSUT — Agence Nationale du Service Universel des Télécommunications
          </p>
        </div>
      </div>
    </div>
  );
}