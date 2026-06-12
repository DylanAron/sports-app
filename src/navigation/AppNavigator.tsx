import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { tabGuideApi } from '../services';
import TabGuideModal from '../components/TabGuideModal';
import HomeScreen from '../screens/HomeScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ScoreScreen from '../screens/ScoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomerServiceScreen from '../screens/CustomerServiceScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import UserAgreementScreen from '../screens/UserAgreementScreen';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyAgreementModal from '../components/PrivacyAgreementModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type TabIconProps = {
  label: string;
  icon: string;
  focused: boolean;
};

const TabIcon: React.FC<TabIconProps> = ({ icon, focused }) => (
  <View style={[tabStyles.iconWrapper, focused && tabStyles.iconWrapperActive]}>
    <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{icon}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.primary + '15',
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
});

function TabNavigator() {
  const navigation = useNavigation<any>();
  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [guideImageUrl, setGuideImageUrl] = useState('');
  const [tabGuideMap, setTabGuideMap] = useState<Record<string, { imageUrl: string; isGlobalEnabled: number }>>({});
  const shownTabsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    tabGuideApi.getList().then(list => {
      const map: Record<string, { imageUrl: string; isGlobalEnabled: number }> = {};
      list.forEach((item: any) => {
        map[item.tabKey] = { imageUrl: item.imageUrl, isGlobalEnabled: Number(item.isGlobalEnabled) };
      });
      setTabGuideMap(map);
      console.log('tab guide loaded:', list);
      // 首页首次加载检查
      const homeGuide = map['home'];
      if (homeGuide && homeGuide.isGlobalEnabled === 1 && !shownTabsRef.current.has('home')) {
        shownTabsRef.current.add('home');
        setGuideImageUrl(homeGuide.imageUrl);
        setGuideModalVisible(true);
      }
    }).catch(() => {});
  }, []);

  const checkTabGuide = (tabKey: string) => {
    const guide = tabGuideMap[tabKey];
    if (!guide || guide.isGlobalEnabled !== 1) return;
    if (shownTabsRef.current.has(tabKey)) return;
    shownTabsRef.current.add(tabKey);
    setGuideImageUrl(guide.imageUrl);
    setGuideModalVisible(true);
  };
  return (<View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1,
          textDecorationLine: 'none',
        },
      }}
      screenListeners={({ route }: any) => ({
        focus: () => {
          const tabMap: Record<string, string> = { Home: 'home', Analysis: 'analysis', Score: 'score' };
          const tabKey = tabMap[route.name];
          if (tabKey) checkTabGuide(tabKey);
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'AI',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="AI" icon="🤖" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: '分析',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="分析" icon="📊" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Score"
        component={ScoreScreen}
        options={{
          tabBarLabel: '比分',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="比分" icon="⚽" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="我的" icon="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
      <TabGuideModal visible={guideModalVisible} imageUrl={guideImageUrl} onClose={() => setGuideModalVisible(false)} onContact={() => navigation.navigate('CustomerService')} />
    </View>);
}

const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="CustomerService"
          component={CustomerServiceScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="UserAgreement"
          component={UserAgreementScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
      <PrivacyAgreementModal />
    </NavigationContainer>
  );
};

export default Navigation;
