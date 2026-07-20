import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from 'react-native';

import { DrawerContent } from '@/components/drawer-content';
import { Colors } from '@/constants/theme';

export default function DrawerLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        drawerType: 'front', // a gaveta desliza por cima do conteúdo e fecha ao escolher
        drawerStyle: { backgroundColor: colors.background, width: 260 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
