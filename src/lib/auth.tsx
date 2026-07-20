import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

// Guarda quem está logado (a "sessão") e deixa isso disponível pro app inteiro.
type AuthContextType = {
  session: Session | null;
  carregando: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, carregando: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Ao abrir o app, verifica se já existe alguém logado.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    // Reage a login/logout em tempo real.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      setCarregando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Quando alguém entra, garante que existe um "perfil" dela no banco
  // (com o nome vindo da conta Google). Roda uma vez por usuário logado.
  useEffect(() => {
    const usuario = session?.user;
    if (!usuario) return;
    const nome =
      usuario.user_metadata?.full_name ||
      usuario.user_metadata?.name ||
      usuario.email ||
      'Atleta';
    supabase
      .from('profiles')
      .upsert({ id: usuario.id, nome })
      .then(({ error }) => {
        if (error) console.log('Erro ao salvar perfil:', error.message);
      });
  }, [session?.user?.id]);

  return <AuthContext.Provider value={{ session, carregando }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
