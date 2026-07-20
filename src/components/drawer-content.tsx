import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ITENS = [
  { rota: 'index', label: 'Plano da semana', emoji: '🏃' },
  { rota: 'agente', label: 'Agente de treinos', emoji: '🤖' },
  { rota: 'historico', label: 'Histórico', emoji: '📜' },
  { rota: 'estatisticas', label: 'Estatísticas', emoji: '📊' },
] as const;

export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const theme = useTheme();
  const { session, perfilCompleto } = useAuth();

  const nome =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    'Atleta';
  const primeiraLetra = nome.charAt(0).toUpperCase();
  const rotaAtiva = state.routeNames[state.index];
  const perfilAtivo = rotaAtiva === 'perfil';

  function irPara(rota: string) {
    navigation.navigate(rota);
    navigation.closeDrawer();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.perfilTopo}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarLetra}>{primeiraLetra}</ThemedText>
            </View>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.nome}>
              {nome}
            </ThemedText>
          </View>

          <View style={styles.itens}>
            {ITENS.map((item) => {
              const ativo = item.rota === rotaAtiva;
              return (
                <Pressable
                  key={item.rota}
                  onPress={() => irPara(item.rota)}
                  style={({ pressed }) => pressed && styles.pressionado}>
                  <ThemedView type={ativo ? 'backgroundSelected' : undefined} style={styles.item}>
                    <ThemedText style={styles.itemEmoji}>{item.emoji}</ThemedText>
                    <ThemedText type={ativo ? 'smallBold' : 'default'}>{item.label}</ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Seção de conta: Perfil e Sair, separada dos itens de navegação acima. */}
        <View style={[styles.rodape, { borderTopColor: theme.backgroundSelected }]}>
          <Pressable
            onPress={() => irPara('perfil')}
            style={({ pressed }) => pressed && styles.pressionado}>
            <ThemedView type={perfilAtivo ? 'backgroundSelected' : undefined} style={styles.item}>
              <ThemedText style={styles.itemEmoji}>👤</ThemedText>
              <ThemedText type={perfilAtivo ? 'smallBold' : 'default'} style={styles.itemTexto}>
                Perfil
              </ThemedText>
              {!perfilCompleto && <View style={styles.badge} />}
            </ThemedView>
          </Pressable>

          <Pressable
            onPress={() => supabase.auth.signOut()}
            style={({ pressed }) => [styles.item, pressed && styles.pressionado]}>
            <ThemedText style={styles.itemEmoji}>🚪</ThemedText>
            <ThemedText themeColor="textSecondary">Sair</ThemedText>
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
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  perfilTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Accent.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetra: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
  },
  nome: {
    flexShrink: 1,
  },
  itens: {
    gap: Spacing.one,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  itemEmoji: {
    fontSize: 18,
  },
  itemTexto: {
    flex: 1,
  },
  badge: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  pressionado: {
    opacity: 0.7,
  },
  rodape: {
    padding: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    gap: Spacing.one,
  },
});
