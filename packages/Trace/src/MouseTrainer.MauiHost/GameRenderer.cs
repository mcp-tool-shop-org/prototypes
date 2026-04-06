using MouseTrainer.Domain.Motion;

namespace MouseTrainer.MauiHost;

// ═══════════════════════════════════════════════════════════════
//  Sandbox phase (replaces SessionState for host-only use)
// ═══════════════════════════════════════════════════════════════

public enum SandboxPhase { Idle, Running }

// ═══════════════════════════════════════════════════════════════
//  RendererState — mutable snapshot consumed by the renderer
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Mutable state snapshot consumed by the renderer. Updated by the host each frame.
/// Gate-specific fields removed — this is a clean sandbox canvas.
/// </summary>
public sealed class RendererState
{
    // ── Pointer ──────────────────────────────────────────
    public float CursorX;
    public float CursorY;
    public bool PrimaryDown;

    // ── Mapping (virtual → device) ───────────────────────
    public float OffsetX;
    public float OffsetY;
    public float Scale;

    // ── Sim time ─────────────────────────────────────────
    public long Tick;
    public float SimTime;
    public float Alpha;

    // ── Sandbox phase ────────────────────────────────────
    public SandboxPhase SessionPhase;

    // ── Cursor trail ─────────────────────────────────────
    public TrailBuffer? Trail;

    // ── Particles ────────────────────────────────────────
    public ParticleSystem? Particles;

    // ── Screen shake ─────────────────────────────────────
    public float ShakeOffsetX;
    public float ShakeOffsetY;

    // ── Motion state (Trace identity) ──────────────────
    public MotionState MotionState;

    // ── Force vector (from Drift Field, zero in sandbox) ──
    public float ForceX;
    public float ForceY;

    // ── Stability scalar (from MotionAnalyzer, 1.0 = calm) ──
    public float Stability = 1f;

    // ── Recovery desaturation (0 = none, 1 = peak desat) ──
    public float RecoveryDesaturation;
}

// ═══════════════════════════════════════════════════════════════
//  GameRenderer : IDrawable
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Neon-minimal sandbox renderer. Draws background, grid, cursor trail, and cursor.
/// Ready to layer any future game mode rendering on top.
/// </summary>
public sealed class GameRenderer : IDrawable
{
    private const float VW = 1920f;
    private const float VH = 1080f;

    private readonly RendererState _s;

    public GameRenderer(RendererState state) => _s = state;

    public void Draw(ICanvas canvas, RectF dirtyRect)
    {
        ComputeTransform(dirtyRect, out float scale, out float ox, out float oy,
                         out float cw, out float ch);

        if (_s.SessionPhase == SandboxPhase.Idle)
        {
            DrawIdleScreen(canvas, dirtyRect, ox, oy, cw, ch);
            return;
        }

        // ── Running state ────────────────────────────────
        float shakeOx = ox + _s.ShakeOffsetX;
        float shakeOy = oy + _s.ShakeOffsetY;

        DrawBackground(canvas, shakeOx, shakeOy, cw, ch);
        DrawScanlines(canvas, shakeOx, shakeOy, cw, ch);
        DrawCorridorBounds(canvas, shakeOx, shakeOy, cw, ch);
        DrawParallaxLayers(canvas, shakeOx, shakeOy, cw, ch, scale);
        _s.Particles?.Draw(canvas, shakeOx, shakeOy, scale);
        DrawCursorTrail(canvas, shakeOx, shakeOy, scale);
        DrawCursor(canvas, shakeOx, shakeOy, scale);
        DrawHud(canvas, ox, oy, cw, ch);
    }

    // ══════════════════════════════════════════════════════
    //  Transform
    // ══════════════════════════════════════════════════════

    private void ComputeTransform(RectF rect, out float scale,
        out float ox, out float oy, out float cw, out float ch)
    {
        scale = _s.Scale;
        if (scale <= 0.0001f)
            scale = MathF.Min(rect.Width / VW, rect.Height / VH);

        cw = VW * scale;
        ch = VH * scale;
        ox = _s.OffsetX;
        oy = _s.OffsetY;

        if (ox == 0f && oy == 0f && scale > 0f)
        {
            ox = (rect.Width - cw) * 0.5f;
            oy = (rect.Height - ch) * 0.5f;
        }
    }

    // ══════════════════════════════════════════════════════
    //  Idle screen
    // ══════════════════════════════════════════════════════

    private static void DrawIdleScreen(ICanvas canvas, RectF rect,
        float ox, float oy, float cw, float ch)
    {
        // Background
        var gradient = new LinearGradientPaint(
            new PaintGradientStop[]
            {
                new(0f, NeonPalette.BgDeep),
                new(1f, NeonPalette.BgMid)
            },
            new Point(0, 0), new Point(0, 1));
        canvas.SetFillPaint(gradient, new RectF(ox, oy, cw, ch));
        canvas.FillRectangle(ox, oy, cw, ch);

        // Title
        canvas.FontSize = 22;
        canvas.FontColor = NeonPalette.Cyan;
        canvas.DrawString("TRACE",
            rect.Width * 0.5f, rect.Height * 0.38f, HorizontalAlignment.Center);

        // Subtitle
        canvas.FontSize = 12;
        canvas.FontColor = NeonPalette.TextDim;
        canvas.DrawString("SANDBOX",
            rect.Width * 0.5f, rect.Height * 0.45f, HorizontalAlignment.Center);

        // Pulsing start prompt (click anywhere to begin)
        float pulse = 0.4f + 0.6f * MathF.Abs(MathF.Sin((float)Environment.TickCount64 * 0.003f));
        canvas.FontSize = 20;
        canvas.FontColor = NeonPalette.Lime.WithAlpha(pulse);
        canvas.DrawString("START",
            rect.Width * 0.5f, rect.Height * 0.56f, HorizontalAlignment.Center);

        canvas.FontSize = 10;
        canvas.FontColor = NeonPalette.TextMuted;
        canvas.DrawString("click anywhere",
            rect.Width * 0.5f, rect.Height * 0.62f, HorizontalAlignment.Center);
    }

    // ══════════════════════════════════════════════════════
    //  Background
    // ══════════════════════════════════════════════════════

    private static void DrawBackground(ICanvas canvas, float ox, float oy, float cw, float ch)
    {
        var gradient = new LinearGradientPaint(
            new PaintGradientStop[]
            {
                new(0f, NeonPalette.BgDeep),
                new(1f, NeonPalette.BgMid)
            },
            new Point(0, 0), new Point(0, 1));
        canvas.SetFillPaint(gradient, new RectF(ox, oy, cw, ch));
        canvas.FillRectangle(ox, oy, cw, ch);
    }

    // ══════════════════════════════════════════════════════
    //  Scanlines
    // ══════════════════════════════════════════════════════

    private static void DrawScanlines(ICanvas canvas, float ox, float oy, float cw, float ch)
    {
        canvas.StrokeSize = 1;
        canvas.StrokeColor = Colors.Black.WithAlpha(0.06f);

        for (float y = oy; y < oy + ch; y += 4f)
            canvas.DrawLine(ox, y, ox + cw, y);
    }

    // ══════════════════════════════════════════════════════
    //  Corridor bounds
    // ══════════════════════════════════════════════════════

    private void DrawCorridorBounds(ICanvas canvas, float ox, float oy, float cw, float ch)
    {
        float pulse = 0.15f + 0.15f * MathF.Sin(_s.SimTime * 1.5f);

        // Sharp edge
        canvas.StrokeSize = 2;
        canvas.StrokeColor = NeonPalette.Cyan.WithAlpha(pulse);
        canvas.DrawLine(ox, oy, ox + cw, oy);
        canvas.DrawLine(ox, oy + ch, ox + cw, oy + ch);

        // Outer glow
        canvas.StrokeSize = 6;
        canvas.StrokeColor = NeonPalette.CyanGlow.WithAlpha(pulse * 0.4f);
        canvas.DrawLine(ox, oy, ox + cw, oy);
        canvas.DrawLine(ox, oy + ch, ox + cw, oy + ch);
    }

    // ══════════════════════════════════════════════════════
    //  Parallax grids
    // ══════════════════════════════════════════════════════

    private static void DrawParallaxLayers(ICanvas canvas, float ox, float oy,
        float cw, float ch, float scale)
    {
        DrawGridLayer(canvas, ox, oy, cw, ch, scale,
            spacing: 120f, color: NeonPalette.TextMuted.WithAlpha(0.06f), strokeWidth: 0.5f);

        DrawGridLayer(canvas, ox, oy, cw, ch, scale,
            spacing: 80f, color: NeonPalette.TextMuted.WithAlpha(0.04f), strokeWidth: 0.5f);
    }

    private static void DrawGridLayer(ICanvas canvas, float ox, float oy,
        float cw, float ch, float scale,
        float spacing, Color color, float strokeWidth)
    {
        canvas.StrokeSize = strokeWidth;
        canvas.StrokeColor = color;

        float spacingScaled = spacing * scale;
        if (spacingScaled < 2f) return;

        // Vertical lines
        for (float x = ox; x <= ox + cw; x += spacingScaled)
            canvas.DrawLine(x, oy, x, oy + ch);

        // Horizontal lines
        for (float y = oy; y <= oy + ch; y += spacingScaled)
            canvas.DrawLine(ox, y, ox + cw, y);
    }

    // ══════════════════════════════════════════════════════
    //  Cursor trail
    // ══════════════════════════════════════════════════════

    private void DrawCursorTrail(ICanvas canvas, float ox, float oy, float scale)
    {
        var trail = _s.Trail;
        if (trail == null || trail.Count < 2) return;

        float currentTime = _s.SimTime;
        const float maxAge = 0.3f;

        for (int i = 1; i < trail.Count; i++)
        {
            var prev = trail.GetByAge(i - 1);
            var curr = trail.GetByAge(i);

            float age = currentTime - curr.Time;
            if (age > maxAge || age < 0f) continue;

            float ageFactor = 1f - (age / maxAge);

            float thickness = 0.5f + ageFactor * 2.5f;

            float dx = curr.X - prev.X;
            float dy = curr.Y - prev.Y;
            float speed = MathF.Sqrt(dx * dx + dy * dy);
            float speedBoost = MathF.Min(speed * 0.002f, 0.3f);

            float alpha = ageFactor * 0.6f + speedBoost;

            canvas.StrokeSize = thickness;
            canvas.StrokeColor = NeonPalette.Cyan.WithAlpha(alpha);
            canvas.DrawLine(
                ox + prev.X * scale, oy + prev.Y * scale,
                ox + curr.X * scale, oy + curr.Y * scale);
        }
    }

    // ══════════════════════════════════════════════════════
    //  Cursor + click indicator
    // ══════════════════════════════════════════════════════

    private void DrawCursor(ICanvas canvas, float ox, float oy, float scale)
    {
        float cx = ox + _s.CursorX * scale;
        float cy = oy + _s.CursorY * scale;

        // Color-by-state: each motion state shifts Trace's visual identity
        var (coreColor, glowColor, edgeAlpha, glowMult) = GetMotionStateColors(_s.MotionState);

        // ── Glow × Stability ──────────────────────────────
        // Calm play glows. Panic dims. Canon: glowStrength = StabilityScalar × GlowMultiplier
        float stability = _s.Stability;
        float glowAlpha = glowColor.Alpha * (0.3f + 0.7f * stability) * (1f + glowMult);
        float edgeEffective = edgeAlpha * (0.5f + 0.5f * stability);

        // ── Recovery desaturation ─────────────────────────
        // Brief desat when stability dips then recovers. "I corrected."
        if (_s.RecoveryDesaturation > 0f)
        {
            float d = _s.RecoveryDesaturation;
            coreColor = NeonPalette.Lerp(coreColor, NeonPalette.TextDim, d * 0.3f);
            glowAlpha *= (1f - d * 0.5f);
        }

        // Override core to Lime when clicking (PrimaryDown)
        if (_s.PrimaryDown)
            coreColor = NeonPalette.Lime;

        // ── Directional bias (force opposition) ───────────
        // When ForceVector is nonzero, glow layers shift opposite the force.
        // Core dot stays centered — Trace's anchor point.
        float biasX = 0f, biasY = 0f;
        float forceMagSq = _s.ForceX * _s.ForceX + _s.ForceY * _s.ForceY;
        if (forceMagSq > 0.001f)
        {
            float forceMag = MathF.Sqrt(forceMagSq);
            float invMag = 1f / forceMag;

            // Bias opposes force, scaled by magnitude, dampened by stability
            float biasFactor = forceMag * 3f * (1f - stability * 0.5f);
            biasX = -_s.ForceX * invMag * biasFactor * scale;
            biasY = -_s.ForceY * invMag * biasFactor * scale;
        }

        // ── Draw layers ───────────────────────────────────
        // Outer glow (soft halo, biased by force)
        canvas.FillColor = glowColor.WithAlpha(MathF.Max(0f, MathF.Min(1f, glowAlpha)));
        canvas.FillCircle(cx + biasX, cy + biasY, 14);

        // Mid glow (edge, half bias)
        canvas.FillColor = coreColor.WithAlpha(MathF.Max(0f, MathF.Min(1f, edgeEffective)));
        canvas.FillCircle(cx + biasX * 0.5f, cy + biasY * 0.5f, 8);

        // Core dot (always centered, always visible)
        canvas.FillColor = coreColor;
        canvas.FillCircle(cx, cy, 4);
    }

    /// <summary>
    /// Maps MotionState to Trace's visual language.
    /// Returns (coreColor, outerGlowColor, edgeMidAlpha, glowMultiplier).
    /// GlowMultiplier from spec: Alignment=0.1, Commitment=0.15, Resistance=0.2, Correction=0.25, Recovery=0.
    /// </summary>
    private static (Color core, Color glow, float edgeAlpha, float glowMult) GetMotionStateColors(MotionState state)
    {
        return state switch
        {
            // Alignment: baseline cyan — stable, calm, no variation
            MotionState.Alignment => (
                NeonPalette.Cyan,
                NeonPalette.CyanGlow,
                0.3f,
                0.1f),

            // Correction: edge brightens — Trace is "thinking"
            MotionState.Correction => (
                NeonPalette.Cyan,
                NeonPalette.CyanGlow,
                0.55f,
                0.25f),

            // Commitment: forward bias tint — slight warmth toward intent
            MotionState.Commitment => (
                NeonPalette.Lerp(NeonPalette.Cyan, Colors.White, 0.15f),
                NeonPalette.Cyan.WithAlpha(0.20f),
                0.35f,
                0.15f),

            // Resistance: counterforce gradient — dim on force side, bright on counter
            MotionState.Resistance => (
                NeonPalette.Lerp(NeonPalette.Cyan, NeonPalette.Amber, 0.12f),
                NeonPalette.Amber.WithAlpha(0.10f),
                0.4f,
                0.2f),

            // Recovery: brief desaturation — humility, not drama
            MotionState.Recovery => (
                NeonPalette.Lerp(NeonPalette.Cyan, NeonPalette.TextDim, 0.3f),
                NeonPalette.CyanGlow.WithAlpha(0.08f),
                0.2f,
                0f),

            _ => (NeonPalette.Cyan, NeonPalette.CyanGlow, 0.3f, 0.1f),
        };
    }

    // ══════════════════════════════════════════════════════
    //  HUD (minimal sandbox info)
    // ══════════════════════════════════════════════════════

    private void DrawHud(ICanvas canvas, float ox, float oy, float cw, float ch)
    {
        float hudY = oy + ch - 28;

        // Position readout (left)
        canvas.FontSize = 12;
        canvas.FontColor = NeonPalette.TextDim;
        canvas.DrawString($"({_s.CursorX:0}, {_s.CursorY:0})",
            ox + 16, hudY, HorizontalAlignment.Left);

        // Stability readout (center)
        canvas.FontSize = 12;
        canvas.FontColor = NeonPalette.Lerp(NeonPalette.TextMuted, NeonPalette.Cyan, _s.Stability);
        canvas.DrawString($"stability {_s.Stability:F2}",
            ox + cw * 0.5f, hudY, HorizontalAlignment.Center);

        // Tick counter (right)
        canvas.FontSize = 12;
        canvas.FontColor = NeonPalette.TextDim;
        canvas.DrawString($"tick {_s.Tick}",
            ox + cw - 16, hudY, HorizontalAlignment.Right);
    }
}
