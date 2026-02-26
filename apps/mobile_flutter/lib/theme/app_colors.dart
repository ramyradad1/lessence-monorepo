import 'package:flutter/material.dart';

/// LESSENCE Stitch design tokens — dark mode palette matching web globals.css
class AppColors {
  AppColors._();

  // ── Backgrounds ──────────────────────────────────────────────────
  static const Color background       = Color(0xFF221E10);
  static const Color backgroundSubtle = Color(0xFF2D291E);
  static const Color surface          = Color(0xFF2D291E);
  static const Color surfaceMuted     = Color(0xFF393528);
  static const Color surfaceLighter   = Color(0xFF4A4535);

  // ── Text ─────────────────────────────────────────────────────────
  static const Color foreground       = Color(0xFFFFFFFF);
  static const Color foregroundMuted  = Color(0xFFA8A29E);
  static const Color foregroundFaint  = Color(0xFF78716C);

  // ── Brand / Primary ──────────────────────────────────────────────
  static const Color primary          = Color(0xFFF4C025);
  static const Color primaryLight     = Color(0xFFFFD75E);
  static const Color primaryMuted     = Color(0x1AF4C025); // 10% opacity

  // ── Borders ──────────────────────────────────────────────────────
  static const Color border           = Color(0x14FFFFFF); // rgba(255,255,255,0.08)
  static const Color borderHover      = Color(0x26FFFFFF); // rgba(255,255,255,0.15)

  // ── Semantic ─────────────────────────────────────────────────────
  static const Color success   = Color(0xFF34D399);
  static const Color successBg = Color(0x1A34D399);
  static const Color warning   = Color(0xFFF97316);
  static const Color warningBg = Color(0x1AF97316);
  static const Color error     = Color(0xFFEF4444);
  static const Color errorBg   = Color(0x1AEF4444);
  static const Color info      = Color(0xFF60A5FA);
  static const Color infoBg    = Color(0x1A60A5FA);

  // ── Shadows (dark mode — more diffuse, pure black) ───────────────
  static const List<BoxShadow> shadowSm = [
    BoxShadow(
      color: Color(0x33000000),
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Color(0x40000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> shadowLg = [
    BoxShadow(
      color: Color(0x4D000000),
      blurRadius: 40,
      offset: Offset(0, 12),
    ),
  ];

  static const List<BoxShadow> shadowGlow = [
    BoxShadow(
      color: Color(0x33F4C025), // gold glow
      blurRadius: 40,
    ),
  ];

  // ── Gradients ────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryLight, primary],
  );

  static const LinearGradient pageGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [background, backgroundSubtle, background],
  );

  static const LinearGradient heroOverlay = LinearGradient(
    begin: Alignment.bottomCenter,
    end: Alignment.topCenter,
    colors: [Color(0xE612100C), Color(0x0012100C)],
  );

  // ── Helpers ──────────────────────────────────────────────────────

  /// Dark card decoration (Stitch style: surface bg + white/5 border)
  static BoxDecoration get surfaceCard => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
        boxShadow: shadowMd,
      );

  /// Glass effect for overlays (dark variant)
  static BoxDecoration get glassEffect => BoxDecoration(
        color: const Color(0xCC221E10), // 80% dark bg
        border: Border.all(color: border),
        boxShadow: shadowSm,
      );

  /// Heavy glass effect for floating navigation
  static BoxDecoration get glassDockEffect => BoxDecoration(
        color: surface.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: borderHover),
        boxShadow: shadowLg,
      );
      
  /// Glass effect for product cards info panel
  static BoxDecoration get glassPanelEffect => BoxDecoration(
        color: background.withValues(alpha: 0.75), 
        border: const Border(top: BorderSide(color: border)),
      );
}
