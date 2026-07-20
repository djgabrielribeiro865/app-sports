import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function AgenteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { perfilCompleto } = useAuth();
  const [instrucoes, setInstrucoes] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Chama a função servidor que conversa com o Gemini e gera o plano da semana.
  async function gerarPlano() {
    setGerando(true);
    setErro(null);

    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { instrucoes: instrucoes.trim() },
    });

    if (error) {
      setErro('Não consegui falar com o servidor: ' + error.message);
      setGerando(false);
    } else if (data?.error) {
      setErro(data.error);
      setGerando(false);
    } else {
      setInstrucoes('');
      setGerando(false);
      router.push('/'); // volta pro Plano da semana pra ver o resultado
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">🤖 Agente de treinos</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Gere o plano de corrida da semana com IA
            </ThemedText>
          </View>

          {!perfilCompleto && (
            <Pressable onPress={() => router.push('/perfil' as any)}>
              <ThemedView type="backgroundElement" style={styles.dicaCard}>
                <ThemedText type="small">
                  💡 Preencha seu <ThemedText type="smallBold">Perfil</ThemedText> (nível,
                  objetivo, dias disponíveis) pra planos mais certeiros. Toque aqui →
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}

          <ThemedView type="backgroundElement" style={styles.geradorCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Se quiser, conte algo antes de gerar (ex: &quot;essa semana tô cansado,
              deixa mais leve&quot; ou &quot;estou treinando pra minha primeira 10km&quot;).
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
                <ThemedText style={styles.botaoGerarTexto}>Gerar plano da semana</ThemedText>
              )}
            </Pressable>
          </ThemedView>

          {!!erro && (
            <ThemedView type="backgroundElement" style={styles.avisoCard}>
              <ThemedText type="smallBold">Ops, algo deu errado</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {erro}
              </ThemedText>
            </ThemedView>
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
  dicaCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
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
  avisoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});
