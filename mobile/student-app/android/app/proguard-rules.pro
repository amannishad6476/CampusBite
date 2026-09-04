# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated & turbo modules
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Cashfree Payment Gateway SDK (Drop Checkout, UPI Intent, Dynamic QR)
-keep class com.cashfree.** { *; }
-keep interface com.cashfree.** { *; }
-keep class com.reactnativecashfreepgsdk.** { *; }
-dontwarn com.cashfree.**

# React Native Screens, Gesture Handler, Safe Area Context
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# Expo modules & SecureStore
-keep class expo.modules.** { *; }
