import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { buscarPerfil, DIAS_SEMANA, Nivel, salvarPerfil } from '@/lib/perfil';

const NIVEIS: { chave: Nivel; label: string }[] = [
  { chave: 'iniciante', label: 'Iniciante' },
  { chave: 'intermediario', label: 'Intermediário' },
  { chave: 'avancado', label: 'Avançado' },
];

// 'YYYY-MM-DD' -> 'DD/MM/AAAA'
function isoParaBr(iso: string | null) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// 'DD/MM/AAAA' -> 'YYYY-MM-DD' (ou null se vazio/incompleto)
function brParaIso(br: string): string | null {
  const match = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return `${ano}-${mes}-${dia}`;
}

export default function PerfilScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const [nivel, setNivel] = useState<Nivel | null>(null);
  const [objetivo, setObjetivo] = useState('');
  const [diasDisponiveis, setDiasDisponiveis] = useState<string[]>([]);
  const [metaProva, setMetaProva] = useState('');
  const [metaDataBr, setMetaDataBr] = useState('');
  const [restricoes, setRestricoes] = useState('');

  useEffect(() => {
    if (!userId) return;
    buscarPerfil(userId).then(({ data, error }) => {
      if (error) {
        setErro(error.message);
      } else if (data) {
        setNivel(data.nivel);
        setObjetivo(data.objetivo ?? '');
        setDiasDisponiveis(data.dias_disponiveis ?? []);
        setMetaProva(data.meta_prova ?? '');
        setMetaDataBr(isoParaBr(data.meta_data));
        setRestricoes(data.restricoes ?? '');
      }
      setCarregando(false);
    });
  }, [userId]);

  function alterar<T>(setter: (v: T) => void) {
    return (valor: T) => {
      setSalvo(false);
      setter(valor);
    };
  }

  function alternarDia(chave: string) {
    setSalvo(false);
    setDiasDisponiveis((prev) =>
      prev.includes(chave) ? prev.filter((d) => d !== chave) : [...prev, chave],
    );
  }

  async function salvar() {
    if (!userId) return;

    const metaDataIso = metaDataBr.trim() ? brParaIso(metaDataBr) : null;
    if (metaDataBr.trim() && !metaDataIso) {
      setErro('Data da meta inválida. Use o formato DD/MM/AAAA.');
      return;
    }

    setSalvando(true);
    setErro(null);
    const error = await salvarPerfil(userId, {
      nivel,
      objetivo: objetivo.trim() || null,
      dias_disponiveis: diasDisponiveis.length > 0 ? diasDisponiveis : null,
      meta_prova: metaProva.trim() || null,
      meta_data: metaDataIso,
      restricoes: restricoes.trim() || null,
    });

    if (error) {
      setErro(error.message);
    } else {
      setSalvo(true);
    }
    setSalvando(false);
  }

  if (carregando) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <View style={styles.aviso}>
            <ActivityIndicator />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Perfil</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ajuda o agente a gerar planos mais certeiros pra você
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Nível</ThemedText>
            <View style={styles.linhaChips}>
              {NIVEIS.map((n) => {
                const ativo = nivel === n.chave;
                return (
                  <Pressable key={n.chave} onPress={() => alterar(setNivel)(n.chave)}>
                    <ThemedView
                      type={ativo ? 'backgroundSelected' : 'background'}
                      style={[styles.chip, { borderColor: theme.backgroundSelected }]}>
                      <ThemedText type={ativo ? 'smallBold' : 'small'}>{n.label}</ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Objetivo</ThemedText>
            <TextInput
              value={objetivo}
              onChangeText={alterar(setObjetivo)}
              placeholder="Ex: correr uma 5km sem parar"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Dias disponíveis pra treinar</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              O agente só coloca corrida nesses dias; os outros viram descanso.
            </ThemedText>
            <View style={styles.linhaChips}>
              {DIAS_SEMANA.map((d) => {
                const ativo = diasDisponiveis.includes(d.chave);
                return (
                  <Pressable key={d.chave} onPress={() => alternarDia(d.chave)}>
                    <ThemedView
                      type={ativo ? 'backgroundSelected' : 'background'}
                      style={[styles.chip, { borderColor: theme.backgroundSelected }]}>
                      <ThemedText type={ativo ? 'smallBold' : 'small'}>{d.label}</ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Meta de prova (opcional)</ThemedText>
            <TextInput
              value={metaProva}
              onChangeText={alterar(setMetaProva)}
              placeholder="Ex: Meia maratona (21km)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <TextInput
              value={metaDataBr}
              onChangeText={alterar(setMetaDataBr)}
              placeholder="Data da prova (DD/MM/AAAA)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Restrições ou lesões (opcional)</ThemedText>
            <TextInput
              value={restricoes}
              onChangeText={alterar(setRestricoes)}
              placeholder="Ex: dor no joelho direito"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
          </ThemedView>

          {!!erro && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Ops, algo deu errado</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {erro}
              </ThemedText>
            </ThemedView>
          )}

          <Pressable
            onPress={salvar}
            disabled={salvando}
            style={({ pressed }) => [
              styles.botaoSalvar,
              pressed && styles.pressionado,
              salvando && styles.botaoDesabilitado,
            ]}>
            {salvando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.botaoSalvarTexto}>Salvar perfil</ThemedText>
            )}
          </Pressable>

          {salvo && (
            <ThemedText type="smallBold" style={{ color: Accent.verde, textAlign: 'center' }}>
              ✓ Perfil salvo
            </ThemedText>
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
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  aviso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  linhaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    minHeight: 44,
    fontSize: 14,
  },
  botaoSalvar: {
    backgroundColor: Accent.azul,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  botaoSalvarTexto: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 14,
  },
  pressionado: {
    opacity: 0.7,
  },
});
