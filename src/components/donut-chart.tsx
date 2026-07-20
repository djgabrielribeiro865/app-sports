import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';

// Anel de progresso (uma variação de gráfico de pizza) mostrando uma porcentagem.
export function DonutChart({
  percentual,
  corPrincipal,
  corFundo,
  tamanho = 120,
  espessura = 14,
}: {
  percentual: number;
  corPrincipal: string;
  corFundo: string;
  tamanho?: number;
  espessura?: number;
}) {
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const percentualSeguro = Math.max(0, Math.min(100, percentual));
  const offset = circunferencia * (1 - percentualSeguro / 100);

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={raio} stroke={corFundo} strokeWidth={espessura} fill="none" />
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          stroke={corPrincipal}
          strokeWidth={espessura}
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.centro]}>
        <ThemedText type="title" style={styles.percentual}>
          {Math.round(percentualSeguro)}%
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentual: {
    fontSize: 24,
  },
});
