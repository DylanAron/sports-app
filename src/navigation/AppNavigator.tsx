import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ScoreScreen from '../screens/ScoreScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

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

const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
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
        }}>
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
    </NavigationContainer>
  );
};

export default Navigation;
