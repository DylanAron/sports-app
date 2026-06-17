import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Image,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChatUnread } from '../contexts/ChatUnreadContext';

const ICON_SIZE = 64;
const PULSE_SIZE = 72;
const MARGIN = 8;
const TOP_MARGIN = 12;
const TAB_BAR_H = 65;

export default function FloatingCustomerService() {
  const { unreadCount, latestAgentId, latestAgentName } = useChatUnread();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { width: screenW, height: screenH } = useWindowDimensions();

  // 初始位置（右下角），以 PULSE_SIZE 容器左上角为基准，右侧留 MARGIN
  const initX = screenW - PULSE_SIZE - MARGIN;
  const initY = screenH - PULSE_SIZE - TAB_BAR_H - MARGIN - 4;

  // 雷达脉冲动画（始终运行）
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.25)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // 拖拽位置（用 translateX/Y 驱动）
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // 记录最后停靠坐标
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.25, duration: 0, useNativeDriver: true }),
      ]),
    );
    pulseRef.current.start();
    return () => pulseRef.current?.stop();
  }, [scaleAnim, opacityAnim]);

  // 新消息抖动 3 秒
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shakeRef = useRef<Animated.CompositeAnimation | null>(null);
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    // 未读数增加时触发抖动
    if (unreadCount > prevCountRef.current) {
      shakeRef.current?.stop();
      shakeAnim.setValue(0);
      shakeRef.current = Animated.sequence([
        // 3 秒抖动序列
        Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.3, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -0.3, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        // 暂停 1.6s 再重复
        Animated.delay(600),
        Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]);
      shakeRef.current.start();
    }
    prevCountRef.current = unreadCount;

    return () => {
      shakeRef.current?.stop();
    };
  }, [unreadCount, shakeAnim]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
        onPanResponderGrant: () => {
          // 记录当前值作为偏移基准
          lastPos.current = {
            x: (translateX as any)._value,
            y: (translateY as any)._value,
          };
        },
        onPanResponderMove: (_, g) => {
          translateX.setValue(lastPos.current.x + g.dx);
          translateY.setValue(lastPos.current.y + g.dy);
        },
        onPanResponderRelease: (_, g) => {
          // 轻触（几乎没移动）
          if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
            navigation.navigate('CustomerService', {
              filterAgentId: unreadCount > 0 ? (latestAgentId || undefined) : undefined,
              filterAgentName: unreadCount > 0 ? (latestAgentName || undefined) : undefined,
            });
            return;
          }
          // 吸附边界
          let finalX = lastPos.current.x + g.dx;
          let finalY = lastPos.current.y + g.dy;

          const minX = -(initX - MARGIN);
          const maxX = screenW - initX - PULSE_SIZE / 2 - MARGIN;
          const minY = -(initY - TOP_MARGIN);
          const maxY = screenH - initY - PULSE_SIZE / 2 - TAB_BAR_H - MARGIN;

          finalX = Math.max(minX, Math.min(maxX, finalX));
          finalY = Math.max(minY, Math.min(maxY, finalY));

          Animated.spring(translateX, { toValue: finalX, useNativeDriver: true }).start();
          Animated.spring(translateY, { toValue: finalY, useNativeDriver: true }).start();

          lastPos.current = { x: finalX, y: finalY };
        },
      }),
    [translateX, translateY, navigation, latestAgentId, latestAgentName, initX, initY, screenW, screenH],
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.floatWrapper,
          {
            left: initX,
            top: initY,
            transform: [{ translateX }, { translateY }],
          },
        ]}
        {...panResponder.panHandlers}>
        {/* 雷达脉冲圈 */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
        {/* 客服图标 */}
        <Animated.View style={[styles.iconCircle, {
          transform: [
            { translateY: Animated.multiply(shakeAnim, 6) },
          ],
        }]}>
          <Image
            source={require('../assets/float_customer_1.png')}
            style={styles.iconImage}
          />
        </Animated.View>
        {/* 未读角标 */}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  floatWrapper: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: '#3b82f6',
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconImage: {
    width: ICON_SIZE - 8,
    height: ICON_SIZE - 8,
    borderRadius: (ICON_SIZE - 8) / 2,
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
});
