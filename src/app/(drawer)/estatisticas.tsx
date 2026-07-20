import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DonutChart } from '@/components/donut-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { domingoDaSemana, formatarDataCurta, paraISO, segundaDaData, Treino } from '@/lib/treinos';

const ALTURA_BARRAS = 120;

function GraficoSemanal({ semanas }: { semanas: { label: string; km: number }[] }) {
  const maxKm = Math.max(1, ...semanas.map((s) => s.km));
  return (
    <View style={styles.barrasContainer}>
      {semanas.map((s, i) => (
        <View key={`${s.label}-${i}`} style={styles.barraColuna}>
          <ThemedText type="small" style={styles.barraValor}>
            {s.km > 0 ? s.km : ''}
          </ThemedText>
          <View style={styles.barraTrilho}>
            {s.km > 0 && (
              <View
                style={[
                  styles.barraPreenchida,
                  { height: `${Math.max((s.km / maxKm) * 100, 6)}%` },
                ]}
              />
            )}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.barraLabel}>
            {s.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function EstatisticasScreen() {
  const theme = useTheme();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, data, tipo, descricao, distancia_km, emoji, concluido')
        .order('data', { ascending: true });

      if (error) {
        setErro(error.message);
      } else {
        setTreinos((data as Treino[]) ?? []);
      }
      setCarregando(false);
    }
    carregar();
  }, []);

  const stats = useMemo(() => {
    const hojeISO = paraISO(new Date());
    const corridas = treinos.filter((t) => t.distancia_km != null);
    const corridasPassadas = corridas.filter((t) => t.data <= hojeISO);

    const kmRealizados = corridas
      .filter((t) => t.concluido)
      .reduce((soma, t) => soma + (t.distancia_km ?? 0), 0);

    const taxaConclusao =
      corridasPassadas.length > 0
        ? (corridasPassadas.filter((t) => t.concluido).length / corridasPassadas.length) * 100
        : 0;

    // Agrupa por semana (segunda-feira) pra gráfico e pro streak.
    const grupos = new Map<string, Treino[]>();
    for (const t of treinos) {
      const seg = segundaDaData(t.data);
      if (!grupos.has(seg)) grupos.set(seg, []);
      grupos.get(seg)!.push(t);
    }
    const semanasOrdenadas = Array.from(grupos.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    // Gráfico: km realizados nas últimas 8 semanas (mais antiga -> mais recente).
    const ultimasSemanas = semanasOrdenadas.slice(-8).map(([segundaISO, lista]) => ({
      label: formatarDataCurta(segundaISO),
      km: lista
        .filter((t) => t.distancia_km != null && t.concluido)
        .reduce((soma, t) => soma + (t.distancia_km ?? 0), 0),
    }));

    // Streak: semanas consecutivas (mais recente pra trás) com o plano 100% cumprido.
    // Só considera semanas já encerradas (domingo antes de hoje) e ignora semanas sem corrida planejada.
    let streak = 0;
    for (let i = semanasOrdenadas.length - 1; i >= 0; i--) {
      const [segundaISO, lista] = semanasOrdenadas[i];
      if (domingoDaSemana(segundaISO) >= hojeISO) continue; // semana ainda não terminou, ignora

      const corridasDaSemana = lista.filter((t) => t.distancia_km != null);
      if (corridasDaSemana.length === 0) continue; // sem treino planejado, não conta nem quebra

      if (corridasDaSemana.every((t) => t.concluido)) {
        streak += 1;
      } else {
        break;
      }
    }

    return { kmRealizados, taxaConclusao, streak, ultimasSemanas, temCorridasPassadas: corridasPassadas.length > 0 };
  }, [treinos]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Estatísticas</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Seu progresso na corrida
            </ThemedText>
          </View>

          {carregando && (
            <View style={styles.aviso}>
              <ActivityIndicator />
            </View>
          )}

          {!!erro && (
            <ThemedView type="backgroundElement" style={styles.avisoCard}>
              <ThemedText type="smallBold">Ops, algo deu errado</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {erro}
              </ThemedText>
            </ThemedView>
          )}

          {!carregando && !erro && treinos.length === 0 && (
            <ThemedView type="backgroundElement" style={styles.avisoCard}>
              <ThemedText type="smallBold">Ainda não há dados</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Assim que você tiver treinos, suas estatísticas aparecem aqui.
              </ThemedText>
            </ThemedView>
          )}

          {!carregando && !erro && treinos.length > 0 && (
            <>
              <View style={styles.kpis}>
                <ThemedView type="backgroundElement" style={styles.kpiCard}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Km percorridos
                  </ThemedText>
                  <ThemedText type="title" style={styles.kpiValor}>
                    {stats.kmRealizados}
                  </ThemedText>
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.kpiCard}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Sequência
                  </ThemedText>
                  <ThemedText type="title" style={styles.kpiValor}>
                    {stats.streak}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {stats.streak === 1 ? 'semana 100%' : 'semanas 100%'}
                  </ThemedText>
                </ThemedView>
              </View>

              {stats.temCorridasPassadas && (
                <ThemedView type="backgroundElement" style={styles.donutCard}>
                  <ThemedText type="smallBold">Taxa de conclusão</ThemedText>
                  <DonutChart
                    percentual={stats.taxaConclusao}
                    corPrincipal={Accent.verde}
                    corFundo={theme.backgroundSelected}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    dos treinos planejados foram concluídos
                  </ThemedText>
                </ThemedView>
              )}

              {stats.ultimasSemanas.some((s) => s.km > 0) && (
                <ThemedView type="backgroundElement" style={styles.graficoCard}>
                  <ThemedText type="smallBold">Km por semana</ThemedText>
                  <GraficoSemanal semanas={stats.ultimasSemanas} />
                </ThemedView>
              )}
            </>
          )}
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
  avisoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  kpis: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  kpiValor: {
    fontSize: 32,
  },
  donutCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    alignItems: 'center',
  },
  graficoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  barrasContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  barraColuna: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  barraValor: {
    fontSize: 11,
  },
  barraTrilho: {
    width: '100%',
    height: ALTURA_BARRAS,
    justifyContent: 'flex-end',
  },
  barraPreenchida: {
    width: '100%',
    backgroundColor: Accent.azul,
    borderTopLeftRadius: Spacing.one,
    borderTopRightRadius: Spacing.one,
    minHeight: 4,
  },
  barraLabel: {
    fontSize: 10,
  },
});
