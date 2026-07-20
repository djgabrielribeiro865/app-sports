import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TreinoCard } from '@/components/treino-card';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { atualizarConclusao, fimDaSemana, inicioDaSemana, paraISO, Treino } from '@/lib/treinos';
import { supabase } from '@/lib/supabase';

export default function PlanoDaSemanaScreen() {
  const router = useRouter();
  const { perfilCompleto } = useAuth();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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

          {!perfilCompleto && (
            <Pressable onPress={() => router.push('/perfil' as any)}>
              <ThemedView type="backgroundElement" style={styles.avisoPerfilCard}>
                <ThemedText type="small">
                  💡 Complete seu <ThemedText type="smallBold">Perfil</ThemedText> (nível,
                  objetivo, dias disponíveis) pra planos mais certeiros. Toque aqui →
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}

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
                Toque no botão abaixo pra criar um plano automaticamente.
              </ThemedText>
              <Pressable
                // `as any`: o arquivo de rotas tipadas (.expo/types, gerado e gitignored)
                // só é atualizado pelo servidor dev interativo, que não rodamos aqui.
                // A rota "/agente" existe de verdade (src/app/(drawer)/agente.tsx).
                onPress={() => router.push('/agente' as any)}
                style={({ pressed }) => [styles.botaoAgente, pressed && styles.pressionado]}>
                <ThemedText style={styles.botaoAgenteTexto}>🤖 Ir pro Agente de treinos</ThemedText>
              </Pressable>
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
  avisoPerfilCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  botaoAgente: {
    backgroundColor: Accent.azul,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  botaoAgenteTexto: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 14,
  },
});
