# ==============================================================================
# SIGES - ProGuard/R8 Rules
# ==============================================================================

# --- Capacitor ---
-keep class com.getcapacitor.** { *; }
-keep class com.capacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keepattributes *Annotation*
-keepattributes JavascriptInterface

# Capacitor WebView JS bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Capacitor Plugins ---
-keep class com.capacitorjs.** { *; }
-keep class com.capacitor.plugins.** { *; }
-keep class com.capacitorcommunity.** { *; }

# --- Custom Location Service (preserve from R8) ---
-keep class com.ag.siges.LocationForegroundService { *; }
-keep class com.ag.siges.LocationServicePlugin { *; }
-keep class com.ag.siges.TaskRemovedService { *; }
-keep class com.ag.siges.MainActivity { *; }

# --- Google Play Services / ML Kit ---
-keep class com.google.android.gms.** { *; }
-keep class com.google.mlkit.** { *; }
-keep class com.google.firebase.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.mlkit.**

# --- Supabase (OkHttp + Kotlin) ---
-keep class io.github.jan-tennert.supabase.** { *; }
-keep class io.ktor.** { *; }
-keep class kotlinx.** { *; }
-keep class kotlin.** { *; }
-dontwarn io.ktor.**
-dontwarn kotlinx.**

# --- AWS SDK (used for R2 uploads) ---
-keep class software.amazon.awssdk.** { *; }
-keep class com.amazonaws.** { *; }
-dontwarn software.amazon.awssdk.**
-dontwarn com.amazonaws.**

# --- React Native / Vite web assets (Capacitor WebView) ---
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep source maps for crash reporting
-keepattributes SourceFile
-renamesourcefileattribute SourceFile

# --- General ---
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses,EnclosingMethod

# Keep enum values
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Keep Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
