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

// Campos que consideramos essenciais pro agente gerar planos assertivos.
// Se algum deles estiver vazio (inclusive um campo novo, adicionado no futuro,
// que ninguém preencheu ainda), o perfil é considerado incompleto.
const CAMPOS_OBRIGATORIOS: (keyof PerfilAtleta)[] = ['nivel', 'objetivo', 'dias_disponiveis'];

export function perfilEstaCompleto(perfil: PerfilAtleta | null): boolean {
  if (!perfil) return false;
  return CAMPOS_OBRIGATORIOS.every((campo) => {
    const valor = perfil[campo];
    return Array.isArray(valor) ? valor.length > 0 : valor != null && valor !== '';
  });
}

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
