import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TreinoCard } from '@/components/treino-card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import {
  atualizarConclusao,
  domingoDaSemana,
  formatarDataCurta,
  inicioDaSemana,
  paraISO,
  segundaDaData,
  Treino,
} from '@/lib/treinos';

type Semana = {
  segundaISO: string;
  treinos: Treino[];
};

function WeekCard({
  semana,
  aberta,
  onToggleAberta,
  onToggleTreino,
}: {
  semana: Semana;
  aberta: boolean;
  onToggleAberta: () => void;
  onToggleTreino: (treino: Treino) => void;
}) {
  const corridas = semana.treinos.filter((t) => t.distancia_km != null);
  const totalKm = corridas.reduce((soma, t) => soma + (t.distancia_km ?? 0), 0);
  const concluidas = corridas.filter((t) => t.concluido).length;

  return (
    <ThemedView type="backgroundElement" style={styles.semanaCard}>
      <Pressable onPress={onToggleAberta} style={({ pressed }) => pressed && styles.pressionado}>
        <View style={styles.semanaHeader}>
          <View style={styles.semanaHeaderTexto}>
            <ThemedText type="smallBold">
              {formatarDataCurta(semana.segundaISO)} – {formatarDataCurta(domingoDaSemana(semana.segundaISO))}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {corridas.length} treinos · {totalKm} km
              {corridas.length > 0 ? ` · ${concluidas}/${corridas.length} concluídos` : ''}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {aberta ? '▲' : '▼'}
          </ThemedText>
        </View>
      </Pressable>

      {aberta && (
        <View style={styles.semanaTreinos}>
          {semana.treinos.map((treino) => (
            <TreinoCard key={treino.id} treino={treino} onToggle={() => onToggleTreino(treino)} />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

export default function HistoricoScreen() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semanaAberta, setSemanaAberta] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const segundaAtual = paraISO(inicioDaSemana());
      const { data, error } = await supabase
        .from('workouts')
        .select('id, data, tipo, descricao, distancia_km, emoji, concluido')
        .lt('data', segundaAtual)
        .order('data', { ascending: false });

      if (error) {
        setErro(error.message);
      } else {
        setTreinos((data as Treino[]) ?? []);
      }
      setCarregando(false);
    }
    carregar();
  }, []);

  const semanas = useMemo<Semana[]>(() => {
    const grupos = new Map<string, Treino[]>();
    for (const t of treinos) {
      const seg = segundaDaData(t.data);
      if (!grupos.has(seg)) grupos.set(seg, []);
      grupos.get(seg)!.push(t);
    }
    return Array.from(grupos.entries())
      .map(([segundaISO, lista]) => ({
        segundaISO,
        treinos: lista.slice().sort((a, b) => a.data.localeCompare(b.data)),
      }))
      .sort((a, b) => b.segundaISO.localeCompare(a.segundaISO));
  }, [treinos]);

  async function alternarConcluido(treino: Treino) {
    const novoValor = !treino.concluido;
    setTreinos((prev) => prev.map((t) => (t.id === treino.id ? { ...t, concluido: novoValor } : t)));

    const error = await atualizarConclusao(treino.id, novoValor);
    if (error) {
      setTreinos((prev) => prev.map((t) => (t.id === treino.id ? { ...t, concluido: !novoValor } : t)));
      setErro(error.message);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Histórico</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Suas semanas passadas de corrida
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

          {!carregando && !erro && semanas.length === 0 && (
            <ThemedView type="backgroundElement" style={styles.avisoCard}>
              <ThemedText type="smallBold">Ainda não há histórico</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Assim que uma semana de treinos passar, ela aparece aqui.
              </ThemedText>
            </ThemedView>
          )}

          <View style={styles.lista}>
            {semanas.map((semana) => (
              <WeekCard
                key={semana.segundaISO}
                semana={semana}
                aberta={semanaAberta === semana.segundaISO}
                onToggleAberta={() =>
                  setSemanaAberta((atual) => (atual === semana.segundaISO ? null : semana.segundaISO))
                }
                onToggleTreino={alternarConcluido}
              />
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
  avisoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  lista: {
    gap: Spacing.two,
  },
  semanaCard: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  pressionado: {
    opacity: 0.7,
  },
  semanaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  semanaHeaderTexto: {
    gap: Spacing.half,
  },
  semanaTreinos: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
});
