import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Formato de um treino vindo do banco.
type Treino = {
  id: string;
  data: string; // 'YYYY-MM-DD'
  tipo: string;
  descricao: string | null;
  distancia_km: number | null;
  emoji: string | null;
  concluido: boolean;
};

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Segunda-feira da semana atual (formato 'YYYY-MM-DD').
function inicioDaSemana(hoje = new Date()) {
  const d = new Date(hoje);
  const diaDaSemana = d.getDay(); // 0 = domingo
  const voltaParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  d.setDate(d.getDate() + voltaParaSegunda);
  return d;
}

function paraISO(d: Date) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function nomeDoDia(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return DIAS[new Date(ano, mes - 1, dia).getDay()];
}

function TreinoCard({ treino }: { treino: Treino }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.dia}>
        {nomeDoDia(treino.data).toUpperCase()}
      </ThemedText>
      <View style={styles.cardRow}>
        <ThemedText style={styles.emoji}>{treino.emoji ?? '🏃'}</ThemedText>
        <View style={styles.cardInfo}>
          <ThemedText type="smallBold">{treino.tipo}</ThemedText>
          {!!treino.descricao && (
            <ThemedText type="small" themeColor="textSecondary">
              {treino.descricao}
            </ThemedText>
          )}
        </View>
        <ThemedText type="smallBold" style={styles.distancia}>
          {treino.distancia_km != null ? `${treino.distancia_km} km` : '—'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export default function HomeScreen() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const segunda = inicioDaSemana();
      const domingo = new Date(segunda);
      domingo.setDate(domingo.getDate() + 6);

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
      setCarregando(false);
    }
    carregar();
  }, []);

  const totalKm = treinos.reduce((soma, t) => soma + (t.distancia_km ?? 0), 0);
  const qtdCorridas = treinos.filter((t) => t.distancia_km != null).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="small" themeColor="textSecondary">
              Olá, Gabriel 👋
            </ThemedText>
            <ThemedText type="subtitle">Plano da semana</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Corrida · {qtdCorridas} treinos · {totalKm} km no total
            </ThemedText>
          </View>

          {carregando && (
            <View style={styles.aviso}>
              <ActivityIndicator />
            </View>
          )}

          {!!erro && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Não consegui carregar os treinos</ThemedText>
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
              <TreinoCard key={treino.id} treino={treino} />
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  aviso: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  lista: {
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  dia: {
    letterSpacing: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  distancia: {
    fontSize: 16,
  },
});
