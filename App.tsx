import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/AppNavigator';
import { ChatUnreadProvider } from './src/contexts/ChatUnreadContext';
import { colors } from './src/theme';

function App() {
  return (
    <SafeAreaProvider>
      <ChatUnreadProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
          translucent
        />
        <Navigation />
      </ChatUnreadProvider>
    </SafeAreaProvider>
  );
}

export default App;
