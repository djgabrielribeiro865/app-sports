import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { buscarPerfil, perfilEstaCompleto, PerfilAtleta } from '@/lib/perfil';
import { supabase } from '@/lib/supabase';

// Guarda quem está logado (a "sessão") e o Perfil dele, disponível pro app inteiro.
type AuthContextType = {
  session: Session | null;
  carregando: boolean;
  perfil: PerfilAtleta | null;
  perfilCompleto: boolean;
  recarregarPerfil: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  carregando: true,
  perfil: null,
  perfilCompleto: false,
  recarregarPerfil: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [perfil, setPerfil] = useState<PerfilAtleta | null>(null);

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

  const carregarPerfil = useCallback(async (userId: string) => {
    const { data } = await buscarPerfil(userId);
    setPerfil(data);
  }, []);

  // Quando alguém entra, garante que existe um "perfil" dela no banco
  // (com o nome vindo da conta Google) e carrega os dados do perfil.
  useEffect(() => {
    const usuario = session?.user;
    if (!usuario) {
      setPerfil(null);
      return;
    }
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
        carregarPerfil(usuario.id);
      });
  }, [session?.user?.id, carregarPerfil]);

  // Chamado pela tela de Perfil depois de salvar, pra atualizar o app inteiro na hora.
  const recarregarPerfil = useCallback(() => {
    if (session?.user?.id) carregarPerfil(session.user.id);
  }, [session?.user?.id, carregarPerfil]);

  return (
    <AuthContext.Provider
      value={{ session, carregando, perfil, perfilCompleto: perfilEstaCompleto(perfil), recarregarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
