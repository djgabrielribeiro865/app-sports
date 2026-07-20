import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeDoDia, Treino } from '@/lib/treinos';

// Círculo de "concluído" que aparece na direita dos treinos de corrida.
function CheckCircle({ ativo }: { ativo: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.check,
        { borderColor: theme.textSecondary },
        ativo && { backgroundColor: Accent.verde, borderColor: Accent.verde },
      ]}>
      {ativo && <ThemedText style={styles.checkMark}>✓</ThemedText>}
    </View>
  );
}

export function TreinoCard({ treino, onToggle }: { treino: Treino; onToggle: () => void }) {
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

const styles = StyleSheet.create({
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
