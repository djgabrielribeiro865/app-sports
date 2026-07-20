// Função servidor (Supabase Edge Function): gera o plano de corrida da semana
// usando o Google Gemini e grava os treinos no banco.
//
// Roda no servidor, nunca no celular — por isso a chave do Gemini fica segura
// (guardada como "secret" do Supabase, nunca aparece no código do app).
//
// O app chama assim: supabase.functions.invoke('generate-plan', { body: { instrucoes } })

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TreinoGerado = {
  data: string;
  tipo: string;
  descricao: string;
  distancia_km: number | null;
  emoji: string;
};

type PerfilAtleta = {
  nivel: string | null;
  objetivo: string | null;
  dias_disponiveis: string[] | null;
  meta_prova: string | null;
  meta_data: string | null;
  restricoes: string | null;
};

const NOMES_DIAS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Não autenticado.' }, 200);
    }

    // Cliente do Supabase agindo COMO o usuário que chamou (respeita as regras
    // de segurança: só mexe nos treinos da própria pessoa).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Sessão inválida.' }, 200);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const instrucoes: string = typeof body?.instrucoes === 'string' ? body.instrucoes.slice(0, 500) : '';

    const { data: perfil } = await supabase
      .from('profiles')
      .select('nivel, objetivo, dias_disponiveis, meta_prova, meta_data, restricoes')
      .eq('id', userId)
      .single();

    const { inicioISO, fimISO } = semanaAtual();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return jsonResponse({ error: 'Chave do Gemini não configurada no servidor.' }, 200);
    }

    const resultadoGemini = await gerarTreinosComGemini(
      geminiApiKey,
      inicioISO,
      fimISO,
      instrucoes,
      perfil as PerfilAtleta | null,
    );
    if (resultadoGemini.treinos.length === 0) {
      // O detalhe técnico (resultadoGemini.debug) fica só no log do servidor,
      // não é exposto pro app — evita mostrar erros crus pro usuário.
      console.log('Gemini não gerou treinos válidos:', resultadoGemini.debug);
      return jsonResponse({ error: 'Não consegui gerar o plano agora. Tente novamente em instantes.' }, 200);
    }
    const treinosValidos = resultadoGemini.treinos;

    // Substitui o plano da semana: apaga o que já existia e insere o novo.
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('profile_id', userId)
      .gte('data', inicioISO)
      .lte('data', fimISO);
    if (deleteError) {
      return jsonResponse({ error: 'Erro ao limpar treinos antigos: ' + deleteError.message }, 200);
    }

    const paraInserir = treinosValidos.map((t) => ({
      profile_id: userId,
      esporte: 'corrida',
      data: t.data,
      tipo: t.tipo,
      descricao: t.descricao ?? null,
      distancia_km: t.distancia_km === 0 ? null : (t.distancia_km ?? null),
      emoji: t.emoji ?? '🏃',
    }));

    const { data: inseridos, error: insertError } = await supabase
      .from('workouts')
      .insert(paraInserir)
      .select();

    if (insertError) {
      return jsonResponse({ error: 'Erro ao salvar o plano: ' + insertError.message }, 200);
    }

    return jsonResponse({ treinos: inseridos }, 200);
  } catch (e) {
    console.log('Erro inesperado:', e);
    return jsonResponse({ error: 'Erro inesperado no servidor.' }, 200);
  }
});

// Segunda-feira e domingo da semana atual, em UTC (formato 'YYYY-MM-DD').
function semanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getUTCDay(); // 0 = domingo
  const voltaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() + voltaSegunda));
  const domingo = new Date(segunda);
  domingo.setUTCDate(domingo.getUTCDate() + 6);
  const paraISO = (d: Date) => d.toISOString().slice(0, 10);
  return { inicioISO: paraISO(segunda), fimISO: paraISO(domingo) };
}

async function gerarTreinosComGemini(
  apiKey: string,
  inicioISO: string,
  fimISO: string,
  instrucoes: string,
  perfil: PerfilAtleta | null,
): Promise<{ treinos: TreinoGerado[]; debug?: string }> {
  const prompt = montarPrompt(inicioISO, fimISO, instrucoes, perfil);

  let resposta: Response;
  try {
    resposta = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                treinos: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      data: { type: 'STRING' },
                      tipo: { type: 'STRING' },
                      descricao: { type: 'STRING' },
                      distancia_km: { type: 'NUMBER', nullable: true },
                      emoji: { type: 'STRING' },
                    },
                    required: ['data', 'tipo', 'descricao', 'emoji'],
                  },
                },
              },
              required: ['treinos'],
            },
          },
        }),
      },
    );
  } catch (e) {
    return { treinos: [], debug: 'fetch falhou: ' + String(e) };
  }

  if (!resposta.ok) {
    const texto = await resposta.text();
    return { treinos: [], debug: `HTTP ${resposta.status}: ${texto.slice(0, 500)}` };
  }

  const dadosGemini = await resposta.json();
  const textoJson = dadosGemini?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoJson) {
    return { treinos: [], debug: 'sem texto na resposta: ' + JSON.stringify(dadosGemini).slice(0, 500) };
  }

  try {
    const plano = JSON.parse(textoJson);
    const treinos = Array.isArray(plano?.treinos) ? plano.treinos : [];
    const validos = treinos.filter((t: TreinoGerado) => t?.data && t?.tipo);
    if (validos.length === 0) {
      return { treinos: [], debug: 'json sem treinos válidos: ' + textoJson.slice(0, 500) };
    }
    return { treinos: validos };
  } catch (e) {
    return { treinos: [], debug: 'JSON.parse falhou: ' + String(e) + ' | texto: ' + textoJson.slice(0, 300) };
  }
}

function montarPrompt(inicio: string, fim: string, instrucoes: string, perfil: PerfilAtleta | null) {
  const NOMES_NIVEL: Record<string, string> = {
    iniciante: 'iniciante',
    intermediario: 'intermediário',
    avancado: 'avançado',
  };

  const linhasPerfil: string[] = [];

  if (perfil?.nivel) {
    linhasPerfil.push(`- Nível do atleta: ${NOMES_NIVEL[perfil.nivel] ?? perfil.nivel}.`);
  }
  if (perfil?.objetivo) {
    linhasPerfil.push(`- Objetivo do atleta: "${perfil.objetivo}".`);
  }
  if (perfil?.restricoes) {
    linhasPerfil.push(`- Restrições/lesões a respeitar: "${perfil.restricoes}". NÃO prescreva nada que agrave isso.`);
  }
  if (perfil?.meta_prova) {
    let detalheData = '';
    if (perfil.meta_data) {
      const hoje = new Date(inicio + 'T00:00:00Z');
      const meta = new Date(perfil.meta_data + 'T00:00:00Z');
      const semanasRestantes = Math.max(0, Math.round((meta.getTime() - hoje.getTime()) / (7 * 24 * 3600 * 1000)));
      detalheData = ` em ${perfil.meta_data}, faltam aproximadamente ${semanasRestantes} semana(s)`;
    }
    linhasPerfil.push(
      `- Meta de prova: "${perfil.meta_prova}"${detalheData}. Periodize o treino pensando nessa meta (evolua o volume gradualmente rumo a ela, sem overtraining).`,
    );
  }

  const diasDisponiveis = perfil?.dias_disponiveis?.filter((d) => NOMES_DIAS.includes(d)) ?? [];
  let linhaDias = '';
  if (diasDisponiveis.length > 0) {
    const diasIndisponiveis = NOMES_DIAS.filter((d) => !diasDisponiveis.includes(d));
    linhaDias = `
- Dias da semana em que o atleta PODE treinar: ${diasDisponiveis.join(', ')}.
- Dias em que o atleta NÃO PODE treinar: ${diasIndisponiveis.length > 0 ? diasIndisponiveis.join(', ') : 'nenhum'}. Nesses dias, "tipo" deve ser obrigatoriamente "Descanso" com distancia_km = null.
- Os dias da semana, em ordem, são: 1=${NOMES_DIAS[0]} (${inicio}), 2=${NOMES_DIAS[1]}, 3=${NOMES_DIAS[2]}, 4=${NOMES_DIAS[3]}, 5=${NOMES_DIAS[4]}, 6=${NOMES_DIAS[5]}, 7=${NOMES_DIAS[6]} (${fim}).`;
  }

  return `Você é um treinador de corrida experiente, no estilo do app Runna.
Crie um plano de treinos de corrida para UMA semana, de segunda-feira (${inicio}) a domingo (${fim}), em português do Brasil.
${linhasPerfil.length > 0 ? `\nSobre este atleta específico:\n${linhasPerfil.join('\n')}\n` : ''}
Regras:
- Gere exatamente 7 itens, um para cada dia da semana (${inicio} até ${fim}), em ordem, um por dia.
- Alterne treinos leves, um treino intervalado/tiros, um treino longo no fim de semana, e pelo menos 1 a 2 dias de descanso.
- Para dias de descanso ou só alongamento, use distancia_km = null.
- "tipo" deve ser curto (ex: "Corrida leve", "Intervalado", "Longão", "Descanso").
- "descricao" deve ser uma frase curta e prática (ex: "6x 400m forte + 200m trote").
- "emoji" deve ser um único emoji relacionado (🏃 corrida leve, ⚡ intervalado, 🔥 longão, 😴 descanso).
- Seja realista pro nível informado do atleta (ou amador/intermediário, se o nível não foi informado).${linhaDias}
${instrucoes ? `- Pedido específico da pessoa para esta semana: "${instrucoes}". Leve isso em conta ao ajustar intensidade e volume.` : ''}

Responda apenas com o JSON no formato pedido.`;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
