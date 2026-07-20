import { supabase } from '@/lib/supabase';

// Formato de um treino vindo do banco.
export type Treino = {
  id: string;
  data: string; // 'YYYY-MM-DD'
  tipo: string;
  descricao: string | null;
  distancia_km: number | null;
  emoji: string | null;
  concluido: boolean;
};

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Segunda-feira da semana de uma data (por padrão, hoje).
export function inicioDaSemana(data = new Date()) {
  const d = new Date(data);
  const diaDaSemana = d.getDay(); // 0 = domingo
  const voltaParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  d.setDate(d.getDate() + voltaParaSegunda);
  return d;
}

// Domingo da semana, a partir da segunda-feira dela.
export function fimDaSemana(segunda: Date) {
  const d = new Date(segunda);
  d.setDate(d.getDate() + 6);
  return d;
}

export function paraISO(d: Date) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function dataLocal(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function nomeDoDia(dataISO: string) {
  return DIAS[dataLocal(dataISO).getDay()];
}

// Segunda-feira (formato ISO) da semana à qual uma data pertence.
// Usado para agrupar treinos por semana no Histórico e nas Estatísticas.
export function segundaDaData(dataISO: string) {
  return paraISO(inicioDaSemana(dataLocal(dataISO)));
}

// Domingo (ISO) da semana que começa numa segunda-feira (ISO) dada.
export function domingoDaSemana(segundaISO: string) {
  return paraISO(fimDaSemana(dataLocal(segundaISO)));
}

// "2026-07-13" -> "13/07" (com ano se for diferente do atual).
export function formatarDataCurta(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  const anoAtual = String(new Date().getFullYear());
  return ano === anoAtual ? `${dia}/${mes}` : `${dia}/${mes}/${ano}`;
}

// Marca/desmarca um treino como concluído no banco. Retorna o erro (se houver).
export async function atualizarConclusao(treinoId: string, concluido: boolean) {
  const { error } = await supabase
    .from('workouts')
    .update({
      concluido,
      concluido_em: concluido ? new Date().toISOString() : null,
    })
    .eq('id', treinoId);
  return error;
}
