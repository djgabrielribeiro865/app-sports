import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export function LoginScreen() {
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrarComGoogle() {
    setErro(null);
    setEntrando(true);
    // Na web, ao voltar do Google o app precisa saber pra onde retornar.
    const redirectTo =
      Platform.OS === 'web' ? window.location.origin + window.location.pathname : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      setErro(error.message);
      setEntrando(false);
    }
    // Se der certo, o navegador é redirecionado pro Google (não volta aqui).
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ThemedText style={styles.logo}>🏃</ThemedText>
          <ThemedText type="title" style={styles.titulo}>
            app-sports
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            A gestão dos treinos de vocês, num lugar só.
          </ThemedText>
        </View>

        <View style={styles.rodape}>
          {!!erro && (
            <ThemedText type="small" style={styles.erro}>
              {erro}
            </ThemedText>
          )}
          <Pressable
            onPress={entrarComGoogle}
            disabled={entrando}
            style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}>
            {entrando ? (
              <ActivityIndicator color="#3c4043" />
            ) : (
              <>
                <ThemedText style={styles.googleG}>G</ThemedText>
                <ThemedText style={styles.botaoTexto}>Entrar com Google</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  logo: {
    fontSize: 72,
  },
  titulo: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
  },
  rodape: {
    gap: Spacing.two,
  },
  erro: {
    color: '#ef4444',
    textAlign: 'center',
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#ffffff',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  botaoPressionado: {
    opacity: 0.85,
  },
  googleG: {
    color: '#4285F4',
    fontWeight: 700,
    fontSize: 18,
  },
  botaoTexto: {
    color: '#3c4043',
    fontWeight: 600,
    fontSize: 16,
  },
});
