using System.Text;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Documents;
using Avalonia.Input;
using Avalonia.Media;
using Avalonia.Threading;
using LinuxDevTyper.App.ViewModels;

namespace LinuxDevTyper.App;

public partial class MainWindow : Window
{
    /// <summary>
    /// Five visual states for each character position in the prompt.
    /// Drives both the batching algorithm and Run styling.
    /// </summary>
    private enum CharState { Correct, Error, Extra, Caret, Pending }

    public MainWindow()
    {
        InitializeComponent();

        Loaded += (_, _) =>
        {
            if (DataContext is MainViewModel vm)
            {
                vm.FocusRequested += OnFocusRequested;
                vm.PromptChanged += OnPromptChanged;
                OnPromptChanged();
            }
            OnFocusRequested();

            // Pump MiniAudioEx engine on a 10ms timer (100Hz)
            var audioTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(10) };
            audioTimer.Tick += (_, _) =>
            {
                try { MiniAudioEx.Core.StandardAPI.AudioContext.Update(); }
                catch { /* swallow if audio not initialized */ }
            };
            audioTimer.Start();
        };

        Closing += (_, _) =>
        {
            if (DataContext is MainViewModel vm)
                vm.Shutdown();
        };
    }

    private void OnFocusRequested()
    {
        Dispatcher.UIThread.Post(() => TypingBox.Focus(), DispatcherPriority.Input);
    }

    /// <summary>
    /// Batched prompt renderer. Groups consecutive same-state characters into
    /// single Run elements to minimize Inlines count. Includes skip-render
    /// optimization and whitespace visualization at error boundaries.
    /// </summary>
    private void OnPromptChanged()
    {
        // Always marshal to UI thread and defer to allow binding cascades to settle.
        // This fixes the blank code display race: NewTest() fires PromptChanged
        // synchronously, but property change cascades (TargetText, TypedText, ShowCompletion)
        // may re-layout the visual tree and invalidate Inlines added synchronously.
        Dispatcher.UIThread.Post(RenderPrompt, DispatcherPriority.Render);
    }

    private void RenderPrompt()
    {
        if (DataContext is not MainViewModel vm) return;

        var target = vm.TargetText ?? "";
        var typed = vm.TypedText ?? "";

        PromptBlock.Inlines?.Clear();
        if (PromptBlock.Inlines is null) return;

        if (target.Length == 0) return;

        // Resolve theme brushes
        var correctBrush = FindBrushResource("Accent1") ?? Brushes.LimeGreen;
        var errorBrush = FindBrushResource("Error") ?? Brushes.Red;
        var mutedBrush = FindBrushResource("Muted") ?? Brushes.Gray;
        var caretBg = FindBrushResource("Accent2") ?? Brushes.CornflowerBlue;
        var caretFg = new SolidColorBrush(Color.FromRgb(10, 12, 18));

        // Build state map and emit batched Runs
        var map = BuildStateMap(typed, target);

        int i = 0;
        while (i < map.Length)
        {
            var state = map[i];

            // Caret is always exactly 1 character — never batch
            if (state == CharState.Caret)
            {
                var caretRun = new Run(target[i].ToString())
                {
                    Foreground = caretFg,
                    Background = caretBg,
                };
                PromptBlock.Inlines.Add(caretRun);
                i++;
                continue;
            }

            // Accumulate consecutive characters with the same state
            int start = i;
            while (i < map.Length && map[i] == state)
                i++;

            // Build display text and style the Run
            string text = BuildBatchText(state, start, i, typed, target);
            var run = new Run(text);
            ApplyRunStyle(run, state, correctBrush, errorBrush, mutedBrush);
            PromptBlock.Inlines.Add(run);
        }

        // Auto-scroll: keep caret visible in the viewport
        ScrollToCaretImproved(typed.Length, target.Length);
    }

    /// <summary>
    /// Classify every character position into a visual state.
    /// </summary>
    private static CharState[] BuildStateMap(string typed, string target)
    {
        int mapLen = Math.Max(typed.Length, target.Length);
        if (mapLen == 0) return Array.Empty<CharState>();

        var map = new CharState[mapLen];

        for (int i = 0; i < mapLen; i++)
        {
            if (i < typed.Length && i < target.Length)
                map[i] = typed[i] == target[i] ? CharState.Correct : CharState.Error;
            else if (i >= target.Length)
                map[i] = CharState.Extra;
            else if (i == typed.Length)
                map[i] = CharState.Caret;
            else
                map[i] = CharState.Pending;
        }

        return map;
    }

    /// <summary>
    /// Build the display text for a batch of same-state characters.
    /// Error and Extra states get whitespace visualization.
    /// </summary>
    private static string BuildBatchText(CharState state, int start, int end,
                                          string typed, string target)
    {
        return state switch
        {
            CharState.Extra => VisualizeWhitespace(typed[start..end]),
            CharState.Error => VisualizeWhitespace(target[start..end]),
            _ => target[start..end] // Correct, Pending — natural whitespace
        };
    }

    /// <summary>
    /// Replace whitespace with visible glyphs so errors on spaces/tabs/newlines
    /// are unmistakable. Only called for Error and Extra states.
    /// </summary>
    private static string VisualizeWhitespace(string text)
    {
        // Fast path: if no whitespace, return as-is
        bool hasWhitespace = false;
        foreach (char c in text)
        {
            if (c is ' ' or '\t' or '\n' or '\r')
            {
                hasWhitespace = true;
                break;
            }
        }
        if (!hasWhitespace) return text;

        var sb = new StringBuilder(text.Length);
        foreach (char c in text)
        {
            sb.Append(c switch
            {
                ' ' => '\u00B7',   // middle dot ·
                '\t' => '\u2192',  // right arrow →
                '\n' => '\u21B5',  // return symbol ↵
                '\r' => '\u21B5',  // also map CR
                _ => c
            });
        }
        return sb.ToString();
    }

    /// <summary>
    /// Apply foreground, background, and text decorations based on CharState.
    /// </summary>
    private static void ApplyRunStyle(Run run, CharState state,
        IBrush correctBrush, IBrush errorBrush, IBrush mutedBrush)
    {
        switch (state)
        {
            case CharState.Correct:
                run.Foreground = correctBrush;
                break;

            case CharState.Error:
                run.Foreground = errorBrush;
                run.TextDecorations = TextDecorations.Underline;
                break;

            case CharState.Extra:
                run.Foreground = errorBrush;
                run.TextDecorations = TextDecorations.Strikethrough;
                break;

            case CharState.Pending:
                run.Foreground = mutedBrush;
                break;
        }
    }

    /// <summary>
    /// Line-height aware auto-scroll. Estimates caret position using actual
    /// extent height and font metrics, then centers it in the upper third
    /// of the viewport.
    /// </summary>
    private void ScrollToCaretImproved(int typedLength, int targetLength)
    {
        if (targetLength == 0) return;

        Dispatcher.UIThread.Post(() =>
        {
            var extent = PromptScroller.Extent;
            var viewport = PromptScroller.Viewport;

            if (extent.Height <= viewport.Height)
                return; // Everything fits — no scrolling needed

            // Estimate line geometry from font size
            double lineHeight = PromptBlock.FontSize * 1.4;
            double totalLines = extent.Height / lineHeight;
            if (totalLines <= 0) totalLines = 1;

            // Estimate which line the caret occupies
            double charRatio = (double)typedLength / targetLength;
            double caretY = charRatio * totalLines * lineHeight;

            // Center caret in the upper third of the viewport
            double scrollTarget = caretY - viewport.Height / 3.0;
            scrollTarget = Math.Clamp(scrollTarget, 0, extent.Height - viewport.Height);

            PromptScroller.Offset = new Vector(0, scrollTarget);
        }, DispatcherPriority.Loaded);
    }

    private IBrush? FindBrushResource(string key)
    {
        if (this.TryGetResource(key, ActualThemeVariant, out var colorObj) && colorObj is Color color)
            return new SolidColorBrush(color);
        if (this.TryGetResource(key + "Brush", ActualThemeVariant, out var brushObj) && brushObj is IBrush brush)
            return brush;
        return null;
    }

    private void TypingBox_KeyDown(object? sender, KeyEventArgs e)
    {
        if (DataContext is MainViewModel vm)
            vm.OnKeyDown();
    }
}
