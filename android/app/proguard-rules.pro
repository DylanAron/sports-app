# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# 百度 oCPX 转化追踪 SDK - AppTrack 归因
-dontwarn com.baidu.mobads.action.**
-keep class com.baidu.mobads.action.** {*;}
-keep, includedescriptorclasses class com.asus.msa.SupplementaryDID.** { *; }
-keepclasseswithmembernames class com.asus.msa.SupplementaryDID.** { *; }
-keep, includedescriptorclasses class com.asus.msa.sdid.** { *; }
-keepclasseswithmembernames class com.asus.msa.sdid.** { *; }
-keep public class com.netease.nis.sdkwrapper.Utils {public <methods>;}
-keep class com.bun.miitmdid.**{*;}
-keep class com.bun.lib.**{*;}
-keep class com.samsung.android.deviceidservice.**{*;}
-keep class a.**{*;}

# Android_CN_OAID 设备标识库
-keep class com.github.gzuliyujiang.oaid.** { *; }
-keep interface com.github.gzuliyujiang.oaid.** { *; }
