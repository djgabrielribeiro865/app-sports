import { supabase } from '@/lib/supabase';

export type Nivel = 'iniciante' | 'intermediario' | 'avancado';

export type PerfilAtleta = {
  nivel: Nivel | null;
  objetivo: string | null;
  dias_disponiveis: string[] | null;
  meta_prova: string | null;
  meta_data: string | null; // 'YYYY-MM-DD'
  restricoes: string | null;
};

export const DIAS_SEMANA = [
  { chave: 'segunda', label: 'Seg' },
  { chave: 'terca', label: 'Ter' },
  { chave: 'quarta', label: 'Qua' },
  { chave: 'quinta', label: 'Qui' },
  { chave: 'sexta', label: 'Sex' },
  { chave: 'sabado', label: 'Sáb' },
  { chave: 'domingo', label: 'Dom' },
] as const;

export async function buscarPerfil(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('nivel, objetivo, dias_disponiveis, meta_prova, meta_data, restricoes')
    .eq('id', userId)
    .single();
  return { data: data as PerfilAtleta | null, error };
}

export async function salvarPerfil(userId: string, perfil: Partial<PerfilAtleta>) {
  const { error } = await supabase.from('profiles').update(perfil).eq('id', userId);
  return error;
}
