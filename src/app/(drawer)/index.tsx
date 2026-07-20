import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TreinoCard } from '@/components/treino-card';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { atualizarConclusao, fimDaSemana, inicioDaSemana, paraISO, Treino } from '@/lib/treinos';

export default function PlanoDaSemanaScreen() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [instrucoes, setInstrucoes] = useState('');
  const [gerando, setGerando] = useState(false);

  const carregarTreinos = useCallback(async () => {
    const segunda = inicioDaSemana();
    const domingo = fimDaSemana(segunda);

    const { data, error } = await supabase
      .from('workouts')
      .select('id, data, tipo, descricao, distancia_km, emoji, concluido')
      .gte('data', paraISO(segunda))
      .lte('data', paraISO(domingo))
      .order('data', { ascending: true });

    if (error) {
      setErro(error.message);
    } else {
      setTreinos((data as Treino[]) ?? []);
    }
  }, []);

  useEffect(() => {
    carregarTreinos().finally(() => setCarregando(false));
  }, [carregarTreinos]);

  // Chama a função servidor que conversa com o Gemini e gera o plano da semana.
  async function gerarPlano() {
    setGerando(true);
    setErro(null);

    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { instrucoes: instrucoes.trim() },
    });

    if (error) {
      setErro('Não consegui falar com o servidor: ' + error.message);
    } else if (data?.error) {
      setErro(data.error);
    } else {
      await carregarTreinos();
      setInstrucoes('');
    }
    setGerando(false);
  }

  // Marca/desmarca um treino como concluído (atualiza a tela na hora e salva no banco).
  async function alternarConcluido(treino: Treino) {
    const novoValor = !treino.concluido;
    setTreinos((prev) => prev.map((t) => (t.id === treino.id ? { ...t, concluido: novoValor } : t)));

    const error = await atualizarConclusao(treino.id, novoValor);
    if (error) {
      setTreinos((prev) => prev.map((t) => (t.id === treino.id ? { ...t, concluido: !novoValor } : t)));
      setErro(error.message);
    }
  }

  const theme = useTheme();
  const corridas = treinos.filter((t) => t.distancia_km != null);
  const totalKm = corridas.reduce((soma, t) => soma + (t.distancia_km ?? 0), 0);
  const concluidas = corridas.filter((t) => t.concluido).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Plano da semana</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Corrida · {corridas.length} treinos · {totalKm} km no total
            </ThemedText>
            {corridas.length > 0 && (
              <ThemedText type="smallBold" style={{ color: Accent.verde }}>
                ✓ {concluidas} de {corridas.length} concluídos
              </ThemedText>
            )}
          </View>

          <ThemedView type="backgroundElement" style={styles.geradorCard}>
            <ThemedText type="smallBold">🤖 Agente de treinos</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Gere o plano da semana com IA. Se quiser, conte algo antes (ex: &quot;essa
              semana tô cansado, deixa mais leve&quot;).
            </ThemedText>
            <TextInput
              value={instrucoes}
              onChangeText={setInstrucoes}
              placeholder="Algum pedido para esta semana? (opcional)"
              placeholderTextColor={theme.textSecondary}
              editable={!gerando}
              multiline
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable
              onPress={gerarPlano}
              disabled={gerando}
              style={({ pressed }) => [
                styles.botaoGerar,
                pressed && styles.pressionado,
                gerando && styles.botaoDesabilitado,
              ]}>
              {gerando ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.botaoGerarTexto}>
                  {treinos.length > 0 ? 'Gerar novo plano da semana' : 'Gerar plano da semana'}
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>

          {carregando && (
            <View style={styles.aviso}>
              <ActivityIndicator />
            </View>
          )}

          {!!erro && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Ops, algo deu errado</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {erro}
              </ThemedText>
            </ThemedView>
          )}

          {!carregando && !erro && treinos.length === 0 && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Nenhum treino nesta semana ainda</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Quando o plano for criado, ele aparece aqui.
              </ThemedText>
            </ThemedView>
          )}

          <View style={styles.lista}>
            {treinos.map((treino) => (
              <TreinoCard key={treino.id} treino={treino} onToggle={() => alternarConcluido(treino)} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  aviso: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  geradorCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    minHeight: 44,
    fontSize: 14,
  },
  botaoGerar: {
    backgroundColor: Accent.azul,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoGerarTexto: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 14,
  },
  pressionado: {
    opacity: 0.7,
  },
  lista: {
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});
