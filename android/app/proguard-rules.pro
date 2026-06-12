# 百度 oCPX 转化追踪 SDK - AppTrack 归因 v2.7.3
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-dontoptimize
-renamesourcefileattribute SourceFile
-keepattributes InnerClasses

-keep class com.baidu.mobads.action.ActionType { public protected *; }
-keep class com.baidu.mobads.action.ActionParam { public protected *; }
-keep class com.baidu.mobads.action.ActionParam$* { public protected *; }
-keep class com.baidu.mobads.action.BaiduAction { public protected *; }
-keep class com.baidu.mobads.action.PrivacyStatus { public *; }

# react-native-screens JNI
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.facebook.jni.** { *; }
-keep, includedescriptorclasses class com.asus.msa.SupplementaryDID.** { *; }
-keepclasseswithmembernames class com.asus.msa.SupplementaryDID.** { *; }
-keep, includedescriptorclasses class com.asus.msa.sdid.** { *; }
-keepclasseswithmembernames class com.asus.msa.sdid.** { *; }
-keep public class com.netease.nis.sdkwrapper.Utils {public <methods>;}
-keep class com.bun.miitmdid.**{*;}
-keep class com.bun.lib.**{*;}
-keep class com.bun.miitmdid.core.MdidSdkHelper { *; }
-dontwarn com.bun.miitmdid.core.MdidSdkHelper
-dontwarn com.bun.miitmdid.interfaces.IIdentifierListener
-dontwarn com.bun.miitmdid.interfaces.IdSupplier
-dontwarn com.bun.miitmdid.pojo.IdSupplierImpl
-keep class com.samsung.android.deviceidservice.**{*;}
-keep class a.**{*;}
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}
