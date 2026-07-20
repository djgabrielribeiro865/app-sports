import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const VERDE = '#22c55e';

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

// Círculo de "concluído" que aparece na direita dos treinos de corrida.
function CheckCircle({ ativo }: { ativo: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.check,
        { borderColor: theme.textSecondary },
        ativo && { backgroundColor: VERDE, borderColor: VERDE },
      ]}>
      {ativo && <ThemedText style={styles.checkMark}>✓</ThemedText>}
    </View>
  );
}

function TreinoCard({ treino, onToggle }: { treino: Treino; onToggle: () => void }) {
  const ehDescanso = treino.distancia_km == null;

  const conteudo = (
    <ThemedView type="backgroundElement" style={[styles.card, treino.concluido && styles.cardFeito]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.dia}>
        {nomeDoDia(treino.data).toUpperCase()}
      </ThemedText>
      <View style={styles.cardRow}>
        <ThemedText style={styles.emoji}>{treino.emoji ?? '🏃'}</ThemedText>
        <View style={styles.cardInfo}>
          <ThemedText type="smallBold" style={treino.concluido && styles.textoFeito}>
            {treino.tipo}
          </ThemedText>
          {!!treino.descricao && (
            <ThemedText type="small" themeColor="textSecondary">
              {treino.descricao}
            </ThemedText>
          )}
        </View>
        <ThemedText type="smallBold" style={styles.distancia}>
          {treino.distancia_km != null ? `${treino.distancia_km} km` : '—'}
        </ThemedText>
        {!ehDescanso && <CheckCircle ativo={treino.concluido} />}
      </View>
    </ThemedView>
  );

  // Dias de descanso não são "marcáveis"; treinos de corrida sim.
  if (ehDescanso) return conteudo;
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => pressed && styles.pressionado}>
      {conteudo}
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const primeiroNome = (
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    'Atleta'
  ).split(' ')[0];

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

  // Marca/desmarca um treino como concluído (atualiza a tela na hora e salva no banco).
  async function alternarConcluido(treino: Treino) {
    const novoValor = !treino.concluido;

    // Atualização otimista: muda a tela imediatamente.
    setTreinos((prev) =>
      prev.map((t) => (t.id === treino.id ? { ...t, concluido: novoValor } : t)),
    );

    const { error } = await supabase
      .from('workouts')
      .update({
        concluido: novoValor,
        concluido_em: novoValor ? new Date().toISOString() : null,
      })
      .eq('id', treino.id);

    // Se falhar ao salvar, desfaz a mudança na tela e avisa.
    if (error) {
      setTreinos((prev) =>
        prev.map((t) => (t.id === treino.id ? { ...t, concluido: !novoValor } : t)),
      );
      setErro(error.message);
    }
  }

  const corridas = treinos.filter((t) => t.distancia_km != null);
  const totalKm = corridas.reduce((soma, t) => soma + (t.distancia_km ?? 0), 0);
  const concluidas = corridas.filter((t) => t.concluido).length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTopo}>
              <ThemedText type="small" themeColor="textSecondary">
                Olá, {primeiroNome} 👋
              </ThemedText>
              <Pressable onPress={() => supabase.auth.signOut()} hitSlop={8}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Sair
                </ThemedText>
              </Pressable>
            </View>
            <ThemedText type="subtitle">Plano da semana</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Corrida · {corridas.length} treinos · {totalKm} km no total
            </ThemedText>
            {corridas.length > 0 && (
              <ThemedText type="smallBold" style={{ color: VERDE }}>
                ✓ {concluidas} de {corridas.length} concluídos
              </ThemedText>
            )}
          </View>

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
              <TreinoCard
                key={treino.id}
                treino={treino}
                onToggle={() => alternarConcluido(treino)}
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  headerTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  cardFeito: {
    opacity: 0.6,
  },
  pressionado: {
    opacity: 0.7,
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
  textoFeito: {
    textDecorationLine: 'line-through',
  },
  distancia: {
    fontSize: 16,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 18,
  },
});
