import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../theme';
import { tabGuideApi } from '../services';
import TabGuideModal from '../components/TabGuideModal';
import FloatingCustomerService from '../components/FloatingCustomerService';
import HomeScreen from '../screens/HomeScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ScoreScreen from '../screens/ScoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import UserAgreementScreen from '../screens/UserAgreementScreen';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyAgreementModal from '../components/PrivacyAgreementModal';
import CustomerServiceScreen from '../screens/CustomerServiceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab 图标资源
const TabIcons = {
  ai: {
    selected: require('../assets/tab/ai_selected.png'),
    unselected: require('../assets/tab/ai_unselected.png'),
  },
  analysis: {
    selected: require('../assets/tab/analysis_selected.png'),
    unselected: require('../assets/tab/analysis_unselected.png'),
  },
  score: {
    selected: require('../assets/tab/score_selected.png'),
    unselected: require('../assets/tab/score_unselected.png'),
  },
  me: {
    selected: require('../assets/tab/me_selected.png'),
    unselected: require('../assets/tab/me_unselected.png'),
  },
};

type TabIconProps = {
  source: ReturnType<typeof require>;
  focused: boolean;
};

const TabIcon: React.FC<TabIconProps> = ({ source, focused }) => (
  <View style={[tabStyles.iconWrapper, focused && tabStyles.iconWrapperActive]}>
    <Image
      source={source}
      style={[tabStyles.icon, focused && tabStyles.iconActive]}
      resizeMode="contain"
    />
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
    backgroundColor: 'transparent',
  },
  icon: {
    width: 24,
    height: 24,
    opacity: 0.55,
  },
  iconActive: {
    width: 32,
    height: 32,
    opacity: 1,
  },
});

function TabNavigator() {
  const navigation = useNavigation<any>();
  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [guideImageUrl, setGuideImageUrl] = useState('');
  const [tabGuideMap, setTabGuideMap] = useState<Record<string, { imageUrl: string; isGlobalEnabled: number }>>({});
  const shownTabsRef = useRef<Set<string>>(new Set());
  const pendingTabRef = useRef<string | null>(null);
  const pendingImageUrlRef = useRef<string>('');

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
        pendingImageUrlRef.current = homeGuide.imageUrl;
        pendingTabRef.current = 'home';
      }
    }).catch(() => {});
  }, []);

  const onPageReady = (tabKey: string) => {
    if (pendingTabRef.current === tabKey) {
      pendingTabRef.current = null;
      setGuideImageUrl(pendingImageUrlRef.current);
      setGuideModalVisible(true);
    }
  };

  const checkTabGuide = (tabKey: string) => {
    const guide = tabGuideMap[tabKey];
    if (!guide || guide.isGlobalEnabled !== 1) return;
    if (shownTabsRef.current.has(tabKey)) return;
    shownTabsRef.current.add(tabKey);
    pendingImageUrlRef.current = guide.imageUrl;
    pendingTabRef.current = tabKey;
  };
  return (<View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={{
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
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: fonts.caption,
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
        initialParams={{ onPageReady: () => onPageReady('home') }}
        options={{
          tabBarLabel: 'AI',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={focused ? TabIcons.ai.selected : TabIcons.ai.unselected} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        initialParams={{ onPageReady: () => onPageReady('analysis') }}
        options={{
          tabBarLabel: '分析',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={focused ? TabIcons.analysis.selected : TabIcons.analysis.unselected} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Score"
        component={ScoreScreen}
        initialParams={{ onPageReady: () => onPageReady('score') }}
        options={{
          tabBarLabel: '比分',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={focused ? TabIcons.score.selected : TabIcons.score.unselected} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={focused ? TabIcons.me.selected : TabIcons.me.unselected} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
      <FloatingCustomerService />
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
