namespace MouseTrainer.MauiHost;

/// <summary>
/// Derives a continuous StabilityScalar from cursor kinematics.
/// Updated each simulation tick. Same lifecycle pattern as ScreenShake and TrailBuffer.
///
/// StabilityScalar ∈ [0,1]:
///   1.0 = calm, aligned, controlled
///   0.0 = panic, overcorrection, loss of control
///
/// Derived from acceleration magnitude, jerk (Δaccel), and direction reversals.
/// Smoothed with EMA (~50-100ms lag at 60Hz) per spec: "must lag slightly, must never spike instantly."
/// </summary>
public sealed class MotionAnalyzer
{
    // ── Previous-frame state for kinematic derivatives ──
    private float _prevX, _prevY;
    private float _prevVX, _prevVY;
    private float _prevAccelMag;
    private bool _hasPrev;

    // ── Smoothed output ──
    private float _stability = 1f;

    // ── EMA smoothing factor ──
    // 0.15 ≈ 4-5 tick lag at 60Hz (~67-83ms), matching the 50-100ms spec range.
    private const float SmoothingAlpha = 0.15f;

    // ── Instability contribution weights ──
    // These are tuning knobs. Start conservative (stability stays high),
    // increase sensitivity until overcorrection visibly dims the glow.
    private const float AccelWeight = 0.006f;      // acceleration magnitude → instability
    private const float JerkWeight = 0.008f;        // jerk (Δaccel/dt) → instability
    private const float ReversalWeight = 0.15f;     // direction reversal → instability

    /// <summary>
    /// Current stability value ∈ [0,1]. Read by the host and written to RendererState.
    /// </summary>
    public float Stability => _stability;

    /// <summary>
    /// Advance the analyzer by one tick. Call once per fixed update with cursor position and dt.
    /// </summary>
    /// <param name="x">Cursor X in virtual space (0-1920).</param>
    /// <param name="y">Cursor Y in virtual space (0-1080).</param>
    /// <param name="dt">Fixed timestep in seconds (1/60).</param>
    public void Update(float x, float y, float dt)
    {
        if (dt <= 0f) return;

        if (!_hasPrev)
        {
            // First tick: seed position, no derivatives yet
            _prevX = x;
            _prevY = y;
            _hasPrev = true;
            return;
        }

        // ── Velocity (px/s) ──
        float vx = (x - _prevX) / dt;
        float vy = (y - _prevY) / dt;

        // ── Acceleration (px/s²) ──
        float ax = (vx - _prevVX) / dt;
        float ay = (vy - _prevVY) / dt;
        float accelMag = MathF.Sqrt(ax * ax + ay * ay);

        // ── Jerk: rate of change of acceleration magnitude (px/s³) ──
        float jerk = MathF.Abs(accelMag - _prevAccelMag) / dt;

        // ── Direction reversal: dot product of consecutive velocity vectors ──
        // Negative dot = direction reversed
        float dot = vx * _prevVX + vy * _prevVY;
        float prevSpeed = MathF.Sqrt(_prevVX * _prevVX + _prevVY * _prevVY);
        float currSpeed = MathF.Sqrt(vx * vx + vy * vy);

        // Only count reversal if both frames had meaningful motion
        float reversal = (dot < 0f && prevSpeed > 10f && currSpeed > 10f) ? 1f : 0f;

        // ── Raw instability signal (0 = calm, higher = more chaotic) ──
        float rawInstability =
            accelMag * AccelWeight +
            jerk * JerkWeight +
            reversal * ReversalWeight;

        // Clamp to [0,1] then invert: stability = 1 - instability
        float rawStability = 1f - MathF.Min(rawInstability, 1f);

        // ── EMA smoothing ──
        _stability += SmoothingAlpha * (rawStability - _stability);
        _stability = MathF.Max(0f, MathF.Min(1f, _stability));

        // Store for next frame
        _prevX = x;
        _prevY = y;
        _prevVX = vx;
        _prevVY = vy;
        _prevAccelMag = accelMag;
    }

    /// <summary>
    /// Reset to initial state. Call on session start.
    /// </summary>
    public void Reset()
    {
        _prevX = _prevY = 0f;
        _prevVX = _prevVY = 0f;
        _prevAccelMag = 0f;
        _stability = 1f;
        _hasPrev = false;
    }
}
