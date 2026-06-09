import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, fonts } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const ScoreScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* WebView - 禁用所有交互 */}
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://m.leisu.com/live/' }}
        style={styles.webview}
        scrollEnabled={false}
        pointerEvents="none"
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={`
          (function() {
            var style = document.createElement('style');
            style.textContent = 'html, body, body * { pointer-events: none !important; -webkit-touch-callout: none !important; user-select: none !important; }';
            document.head.appendChild(style);

            // ===== 第1轮：2秒后尝试 =====
            function tryAutoSlide(round) {
              if (round > 20) return; // 最多试20轮
              var slider = document.querySelector('.slider-btn, .slide-btn, .verify-slider, [role="slider"], .nc_wrapper, .nc_scale, .nc-lang-cnt, #nc_1_wrapper, #nc_1__scale_text, .slidetounlock');
              if (!slider) {
                // 搜索所有 class 中包含 slide/captcha/verify 的元素
                var all = document.querySelectorAll('[class*="slide"], [class*="captcha"], [class*="verify"], [class*="nc_"], [id*="nc_"]');
                for (var i = 0; i < all.length; i++) {
                  if (all[i].offsetParent !== null) { slider = all[i]; break; }
                }
              }
              if (!slider) {
                // 搜索所有可能是滑块按钮的元素
                var btns = document.querySelectorAll('span, div, button');
                for (var i = 0; i < btns.length; i++) {
                  var b = btns[i];
                  if (b.innerText && (b.innerText.indexOf('滑块')>=0 || b.innerText.indexOf('验证')>=0 || b.innerText.indexOf('拖动')>=0 || b.innerText.indexOf('请按住')>=0)) {
                    slider = b.parentElement || b;
                    break;
                  }
                }
              }
              if (slider) {
                // 找到了滑块，执行滑动
                var sr = slider.getBoundingClientRect();
                var pr = slider.parentElement ? slider.parentElement.getBoundingClientRect() : {width:300, height:40};
                var t = pr.width - sr.width - 5;
                if (t < 10) t = pr.width * 0.7; // 如果计算不准确，滑70%
                var sx = sr.left + sr.width/2, sy = sr.top + sr.height/2;
                function ev(n,x,y){ return new MouseEvent(n,{clientX:x,clientY:y,bubbles:true,cancelable:true,view:window}); }
                var touchEv = function(n,x,y) { return new TouchEvent(n, {touches:[{clientX:x,clientY:y}], bubbles:true, cancelable:true}); };
                try {
                  slider.dispatchEvent(new MouseEvent('mousedown', {clientX:sx, clientY:sy, bubbles:true, cancelable:true, view:window}));
                  slider.dispatchEvent(new TouchEvent('touchstart', {touches:[{clientX:sx, clientY:sy}], bubbles:true, cancelable:true}));
                } catch(ex) {}
                var d=t/30, c=0;
                function go(){
                  if (c < t) {
                    c += d;
                    var nx = sx + c;
                    try {
                      slider.dispatchEvent(new MouseEvent('mousemove', {clientX:nx, clientY:sy, bubbles:true, cancelable:true, view:window}));
                      slider.dispatchEvent(new TouchEvent('touchmove', {touches:[{clientX:nx, clientY:sy}], bubbles:true, cancelable:true}));
                    } catch(ex) {}
                    requestAnimationFrame(go);
                  } else {
                    try {
                      slider.dispatchEvent(new MouseEvent('mouseup', {clientX:sx+t, clientY:sy, bubbles:true, cancelable:true, view:window}));
                      slider.dispatchEvent(new TouchEvent('touchend', {touches:[], bubbles:true, cancelable:true}));
                    } catch(ex) {}
                  }
                }
                setTimeout(go, 100);
                console.log('SPORTSAPP: auto slide triggered, round=' + round);
              } else {
                // 没找到，延迟重试
                setTimeout(function(){ tryAutoSlide(round+1); }, 1000);
              }
            }
            setTimeout(function(){ tryAutoSlide(1); }, 3000);

            // ★ 通过 ReactNativeWebView 发消息给 RN 层做调试
            setTimeout(function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type:'log', msg:'autoSlide script loaded'}));
              }
            }, 1000);
          })();
          true;
        `}
      />

      {/* ★ 透明遮罩 - 覆盖整个页面，点击任意位置 → 客服页面 */}
      <Pressable
        style={styles.overlay}
        onPress={() => navigation.navigate('CustomerService')}>
        <View style={{ flex: 1 }} />
      </Pressable>

      {/* 底部广告位 - 纯视觉，不拦截点击 */}
      <View style={styles.adContainer} pointerEvents="none">
        <View style={styles.adBox}>
          <Text style={styles.adText}>{'📢  广告 · 赞助商  广告位招租'}</Text>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', zIndex: 10 } as const,
  webview: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 99, backgroundColor: 'transparent' },
  adContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  adBox: {
    borderWidth: 1, borderColor: colors.cardBorder, borderStyle: 'dashed',
    borderRadius: 8, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#2563eb10',
  },
  adText: { fontSize: fonts.regular, color: colors.textSecondary },
});

export default ScoreScreen;
