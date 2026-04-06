using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LinuxDevTyper.Core.Abstractions;
using LinuxDevTyper.Core.Mistakes;
using LinuxDevTyper.Core.Models;
using LinuxDevTyper.Core.Snippets;
using LinuxDevTyper.Core.Typing;
using LinuxDevTyper.App.Services;

namespace LinuxDevTyper.App.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IStorage _storage;
    private readonly IAudioService _audio;
    private readonly ContentIntegrationService _contentService;
    private readonly ContentPipeline _pipeline;
    private PersistedState _state;
    private readonly TypingSession _session = new();
    private Snippet _currentSnippet = new();
    private int _repeatCounter;
    private SymbolCategoryKind? _focusCategory;
    private string _currentGroupId;
    private int? _lastDifficulty;
    private string? _lastOrientationCue;

    [ObservableProperty] private string currentTitle = "—";
    [ObservableProperty] private string targetText = "";
    [ObservableProperty] private string typedText = "";

    [ObservableProperty] private string selectedLanguage = "python";
    [ObservableProperty] private List<string> languages = new();


    [ObservableProperty] private bool hardcoreMode;
    [ObservableProperty] private bool reducedSensory;
    [ObservableProperty] private double codeFontSize = 16;

    [ObservableProperty] private double sidebarWidth = 0;

    // Audio state (bound to UI controls)
    [ObservableProperty] private string selectedKeyboardTheme = "Mechanical";
    [ObservableProperty] private List<string> keyboardThemes = new();
    [ObservableProperty] private string selectedSoundscape = "Zen";
    [ObservableProperty] private List<string> soundscapes = new();
    [ObservableProperty] private double ambientVolume = 0.5;
    [ObservableProperty] private double keyVolume = 0.7;
    [ObservableProperty] private double uiVolume = 0.6;
    [ObservableProperty] private bool ambientMuted;

    // Completion state
    [ObservableProperty] private bool showCompletion;
    [ObservableProperty] private bool showCompletionDetails;
    [ObservableProperty] private string completionWpm = "";
    [ObservableProperty] private string completionAccuracy = "";
    [ObservableProperty] private string completionXp = "";
    [ObservableProperty] private string completionErrors = "";
    [ObservableProperty] private List<string> explainBullets = new();
    [ObservableProperty] private List<string> recentHistory = new();

    // Weakness display
    [ObservableProperty] private List<string> sessionWeakSpots = new();
    [ObservableProperty] private List<string> overallWeaknesses = new();

    // Focus practice
    [ObservableProperty] private bool isFocusMode;
    [ObservableProperty] private string focusCategoryLabel = "";

    // Micro-drill mode — 5 quick items targeting top weakness
    private int _drillTotal;
    private int _drillCompleted;
    [ObservableProperty] private bool isDrillMode;
    [ObservableProperty] private string drillProgressText = "";

    // Trend display
    [ObservableProperty] private string trendWpmText = "";
    [ObservableProperty] private string trendAccuracyText = "";
    [ObservableProperty] private string completionTrendSummary = "";
    [ObservableProperty] private bool hasTrendData;

    // Difficulty display
    [ObservableProperty] private string difficultyInfoText = "";
    [ObservableProperty] private string comfortZoneText = "";
    [ObservableProperty] private int? manualDifficultyLock;
    [ObservableProperty] private bool isDifficultyLocked;

    // Yo-yo override
    [ObservableProperty] private bool showYoYoOverride;

    // Session plan (display-only metadata from SessionPlanner)
    [ObservableProperty] private string planCategoryText = "";
    [ObservableProperty] private string planReasonText = "";
    private SessionPlan? _currentPlan;

    // Skill signals (rolling window weakness display)
    [ObservableProperty] private string skillSummaryText = "";
    [ObservableProperty] private List<string> rollingWeaknesses = new();
    public bool HasRollingWeaknesses => RollingWeaknesses.Count > 0;

    // Per-character weakness tracking (heatmap-based)
    [ObservableProperty] private List<string> charWeaknesses = new();
    public bool HasCharWeaknesses => CharWeaknesses.Count > 0;

    // Weakness trajectory (improving/worsening/steady from WeaknessTracker)
    [ObservableProperty] private string weaknessTrajectorySummary = "";
    [ObservableProperty] private List<string> weaknessTrajectoryItems = new();
    public bool HasWeaknessTrajectory => WeaknessTrajectoryItems.Count > 0;

    // Selection explanation (why this snippet was chosen)
    [ObservableProperty] private string selectionReasonText = "";
    [ObservableProperty] private List<string> selectionFactors = new();
    public bool HasSelectionFactors => SelectionFactors.Count > 0;

    // Debug inspector (v0.9.0) — toggled by Ctrl+Shift+D
    [ObservableProperty] private bool debugInspectorVisible;
    [ObservableProperty] private string debugPlanInfo = "";
    [ObservableProperty] private string debugDifficultyInfo = "";
    [ObservableProperty] private string debugWeaknessInfo = "";
    [ObservableProperty] private string debugHeatmapInfo = "";

    // Default suggestions
    [ObservableProperty] private string defaultSuggestions = "";
    [ObservableProperty] private bool showDefaultSuggestions;

    // Insights + fatigue
    [ObservableProperty] private List<InsightItem> insightItems = new();
    [ObservableProperty] private string fatigueText = "";
    [ObservableProperty] private bool showFatigue;
    [ObservableProperty] private bool showPerformanceCues = true;

    // Personalization controls
    [ObservableProperty] private bool freezePersonalization;

    // Community features
    [ObservableProperty] private bool showCommunityNotes = true;
    [ObservableProperty] private bool showCommunitySignals = true;
    [ObservableProperty] private List<string> notesBullets = new();
    [ObservableProperty] private string communityDifficultyText = "";
    [ObservableProperty] private bool showCommunityDifficulty;
    public bool HasNotes => NotesBullets.Count > 0 && ShowCommunityNotes;

    // Guided Mode — signals influence practice behavior
    [ObservableProperty] private bool guidedMode;

    // Pedagogy features
    [ObservableProperty] private bool showScaffolds = true;
    [ObservableProperty] private bool showVariants = true;
    [ObservableProperty] private List<string> scaffoldBullets = new();
    [ObservableProperty] private bool scaffoldExpanded;
    [ObservableProperty] private List<string> variantBullets = new();
    public bool HasScaffold => ScaffoldBullets.Count > 0 && ShowScaffolds;
    public bool HasScaffoldDepth => ScaffoldBullets.Count > 1 && ShowScaffolds;
    public string ScaffoldHint => ScaffoldBullets.Count > 0 ? ScaffoldBullets[0] : "";
    public List<string> ScaffoldDepth => ScaffoldBullets.Count > 1 ? ScaffoldBullets.Skip(1).ToList() : new();
    public bool HasVariants => VariantBullets.Count > 0 && ShowVariants;

    // Content library
    [ObservableProperty] private string pasteCodeText = "";
    [ObservableProperty] private string pasteCodeTitle = "";
    [ObservableProperty] private string pasteCodeLanguage = "";
    [ObservableProperty] private string contentStatusText = "";
    [ObservableProperty] private string importFolderPath = "";
    [ObservableProperty] private string importFilePath = "";
    public int ContentItemCount => _pipeline.ItemCount;

    // Library health diagnostics
    [ObservableProperty] private string libraryHealthText = "";

    /// <summary>
    /// Refreshes library health diagnostics: total items, languages,
    /// heatmap size, snapshot count.
    /// </summary>
    private void RefreshLibraryHealth()
    {
        var languages = _pipeline.Languages();
        int totalItems = _pipeline.ItemCount;
        var sources = _pipeline.CountBySource();
        int heatmapChars = _state.MistakeHeatmap?.Records.Count ?? 0;
        int snapshots = _state.WeaknessSnapshots?.Count ?? 0;

        var parts = new List<string>();
        parts.Add($"{totalItems} snippets");
        parts.Add($"{languages.Count} language{(languages.Count != 1 ? "s" : "")}");
        if (sources.Count > 0)
        {
            var sourceList = string.Join(", ", sources.Select(s => $"{s.Key}: {s.Value}"));
            parts.Add(sourceList);
        }
        parts.Add($"Heatmap: {heatmapChars} chars");
        parts.Add($"Snapshots: {snapshots}");

        LibraryHealthText = string.Join(" | ", parts);
    }

    // Pack management
    [ObservableProperty] private List<PackItemViewModel> packItems = new();
    [ObservableProperty] private string packStatusText = "";

    // Import/export
    [ObservableProperty] private string importExportStatus = "";

    // Practice profiles
    [ObservableProperty] private List<string> profileNames = new();
    [ObservableProperty] private string selectedProfileName = "Default";
    [ObservableProperty] private string newProfileName = "";
    [ObservableProperty] private bool isEditableProfile;
    [ObservableProperty] private string profileDiffSummary = "";
    [ObservableProperty] private string activeProfileBadge = "";
    // Profile editor fields (bound to sliders/inputs when non-Default)
    [ObservableProperty] private double profileXpMultiplier = 0.8;
    [ObservableProperty] private double profileSloppyThreshold = 70.0;
    [ObservableProperty] private int profileRatingKFactor = 32;
    [ObservableProperty] private double profileComfortAccuracy = 85.0;
    [ObservableProperty] private int profileComfortMinSessions = 3;
    [ObservableProperty] private double profileTrendWpmThreshold = 2.0;
    [ObservableProperty] private int profileFatigueBreakSessions = 5;

    // Session note
    [ObservableProperty] private string sessionNote = "";

    // Welcome back
    [ObservableProperty] private string welcomeBackText = "";
    [ObservableProperty] private bool showWelcomeBack;

    // Orientation cue
    [ObservableProperty] private string orientationCue = "";
    [ObservableProperty] private bool showOrientationCue;

    // Session browser
    [ObservableProperty] private bool showSessionBrowser;
    [ObservableProperty] private string sessionFilterText = "";
    [ObservableProperty] private List<string> browsableResults = new();
    [ObservableProperty] private string browserStatusText = "";
    [ObservableProperty] private string summaryStatsText = "";

    // Group stats
    [ObservableProperty] private string groupStatsText = "";
    [ObservableProperty] private bool showGroupStats;

    public string LevelBadge => $"Lv {_state.Profile.Level} • {_state.Profile.Xp}xp";
    public string SessionStatus
    {
        get
        {
            string prefix = IsFocusMode ? $"Focus: {FocusCategoryLabel} | " : "";
            if (_session.Running)
                return prefix + (_repeatCounter > 0 ? $"Repeat #{_repeatCounter}" : "Session running");
            return prefix + (ShowCompletion ? "Complete" : "Ready");
        }
    }
    public string LiveWpmText => $"WPM: {_session.Wpm:0}";
    public string LiveAccuracyText => $"Accuracy: {_session.Accuracy:0.0}%";
    public string ErrorsText => $"Errors: {_session.Errors}";
    public string XpText => $"XP this run: {_session.XpEarned}";

    public event Action? FocusRequested;
    public event Action? PromptChanged;

    public IRelayCommand NewTestCommand { get; }
    public IRelayCommand ResetCommand { get; }
    public IRelayCommand ToggleSidebarCommand { get; }
    public IRelayCommand SaveCommand { get; }
    public IRelayCommand NextCommand { get; }
    public IRelayCommand RepeatCommand { get; }
    public IRelayCommand FocusPracticeCommand { get; }
    public IRelayCommand ClearFocusCommand { get; }
    public IRelayCommand StartMicroDrillCommand { get; }
    public IRelayCommand StartNewGroupCommand { get; }
    public IRelayCommand ShuffleAmbientCommand { get; }
    public IRelayCommand ToggleMuteCommand { get; }
    public IRelayCommand DismissWelcomeBackCommand { get; }
    public IRelayCommand ToggleSessionBrowserCommand { get; }
    public IRelayCommand DismissYoYoLockCommand { get; }
    public IRelayCommand DismissDefaultSuggestionsCommand { get; }
    public IRelayCommand ApplyDefaultSuggestionsCommand { get; }
    public IRelayCommand<string> DismissInsightCommand { get; }
    public IRelayCommand DismissFatigueCommand { get; }
    public IRelayCommand ToggleCompletionDetailsCommand { get; }
    public IRelayCommand ToggleScaffoldDepthCommand { get; }
    public IRelayCommand ResetPersonalizationCommand { get; }
    public IRelayCommand RefreshPacksCommand { get; }
    public IRelayCommand<string> CreateProfileCommand { get; }
    public IRelayCommand DeleteProfileCommand { get; }
    public IRelayCommand ExportCommand { get; }
    public IRelayCommand ImportCommand { get; }
    public IRelayCommand PasteCodeCommand { get; }
    public IRelayCommand ImportFileCommand { get; }
    public IRelayCommand ImportFolderCommand { get; }
    public IRelayCommand ToggleDebugInspectorCommand { get; }

    public string MuteButtonText => AmbientMuted ? "Unmute" : "Mute";
    public bool HasNoWeaknesses => OverallWeaknesses.Count == 0;

    // Flag to suppress OnChanged handlers during ApplySettings
    private bool _applyingSettings;

    public MainViewModel()
    {
        _storage = new JsonFileStorage();
        _state = _storage.Load();
        // Load content library and build unified pipeline
        _contentService = new ContentIntegrationService();
        try { _contentService.LoadIndex(); } catch { /* empty library on failure */ }
        _pipeline = new ContentPipeline(_contentService);

        // Ingest built-in snippets into the canonical pipeline
        var builtInProvider = new LocalAssetProvider();
        _pipeline.IngestBuiltIns(builtInProvider.ListLanguages(), builtInProvider.LoadSnippets);

        // Ingest calibration packs (engine ground truth with known difficulty bands)
        var calibrationProvider = new CalibrationAssetProvider();
        var calibrationLangs = calibrationProvider.ListLanguages();
        if (calibrationLangs.Count > 0)
            _pipeline.IngestCalibration(calibrationLangs, calibrationProvider.LoadSnippets);

        // Ingest user pack snippets (respecting enabled/disabled state from PackRegistry)
        var enabledUserLangs = _state.PackRegistry
            .Where(p => p.Enabled)
            .Select(p => p.Language)
            .ToList();
        if (enabledUserLangs.Count > 0)
        {
            var userPacks = new UserPackProvider();
            _pipeline.IngestUserPacks(enabledUserLangs, userPacks.LoadSnippets);
        }

        // Try real audio; fallback to stub if native lib is missing
        var soundsPath = Path.Combine(AppContext.BaseDirectory, "Assets", "sounds");
        IAudioService audio;
        try
        {
            audio = new MiniAudioService(soundsPath);
        }
        catch (Exception)
        {
            audio = new StubAudioService();
        }
        _audio = audio;

        _currentGroupId = GenerateGroupId();
        Languages = _pipeline.Languages()
            .Select(l => l.ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(l => l)
            .ToList();
        if (Languages.Count == 0) Languages = new List<string> { "python" };

        // Discover available themes and soundscapes
        KeyboardThemes = _audio.ListKeyboardThemes().ToList();
        Soundscapes = _audio.ListSoundscapes().ToList();

        ApplySettings(_state.Settings);

        NewTestCommand = new RelayCommand(NewTest);
        ResetCommand = new RelayCommand(Reset);
        ToggleSidebarCommand = new RelayCommand(ToggleSidebar);
        SaveCommand = new RelayCommand(Save);
        NextCommand = new RelayCommand(OnNext);
        RepeatCommand = new RelayCommand(RepeatTest);
        FocusPracticeCommand = new RelayCommand(StartFocusPractice);
        ClearFocusCommand = new RelayCommand(ClearFocus);
        StartMicroDrillCommand = new RelayCommand(StartMicroDrill);
        StartNewGroupCommand = new RelayCommand(StartNewGroup);
        ShuffleAmbientCommand = new RelayCommand(ShuffleAmbient);
        ToggleMuteCommand = new RelayCommand(ToggleMute);
        DismissWelcomeBackCommand = new RelayCommand(() => ShowWelcomeBack = false);
        ToggleSessionBrowserCommand = new RelayCommand(ToggleSessionBrowser);
        DismissYoYoLockCommand = new RelayCommand(DismissYoYoLock);
        DismissDefaultSuggestionsCommand = new RelayCommand(DismissDefaultSuggestions);
        ApplyDefaultSuggestionsCommand = new RelayCommand(ApplyDefaultSuggestions);
        DismissInsightCommand = new RelayCommand<string>(DismissInsight);
        DismissFatigueCommand = new RelayCommand(() => ShowFatigue = false);
        ToggleCompletionDetailsCommand = new RelayCommand(() => ShowCompletionDetails = !ShowCompletionDetails);
        ToggleScaffoldDepthCommand = new RelayCommand(() => ScaffoldExpanded = !ScaffoldExpanded);
        ResetPersonalizationCommand = new RelayCommand(ResetPersonalization);
        RefreshPacksCommand = new RelayCommand(RefreshPacks);
        CreateProfileCommand = new RelayCommand<string>(CreateProfile);
        DeleteProfileCommand = new RelayCommand(DeleteProfile);
        ExportCommand = new RelayCommand(ExportBundle);
        ImportCommand = new RelayCommand(ImportBundle);
        PasteCodeCommand = new RelayCommand(PasteCode);
        ImportFileCommand = new RelayCommand(ImportFile);
        ImportFolderCommand = new RelayCommand(ImportFolder);
        ToggleDebugInspectorCommand = new RelayCommand(ToggleDebugInspector);

        RefreshPackItems();
        RefreshProfileNames();

        // Check for returning user
        var now = DateTimeOffset.UtcNow;
        var welcomeBack = WelcomeBackDetector.Analyze(_state.RecentResults, now);
        if (welcomeBack.IsReturning && welcomeBack.Message != null)
        {
            WelcomeBackText = welcomeBack.Message;
            ShowWelcomeBack = true;

            if (welcomeBack.TimeSinceLastSession?.TotalDays >= 30)
            {
                // 30+ day absence: preserve records (may be only data), just soften zones
                foreach (var lang in Languages)
                    _state.DifficultyMemory.SoftenComfortZone(lang);
            }
            else
            {
                // Shorter absence: age old records
                _state.DifficultyMemory.AgeRecords(now);

                // After 7+ days, also soften comfort zones
                if (welcomeBack.TimeSinceLastSession?.TotalDays >= 7)
                {
                    foreach (var lang in Languages)
                        _state.DifficultyMemory.SoftenComfortZone(lang);
                }
            }

            _storage.Save(_state);
        }

        RefreshHistory();
        RefreshOverallWeaknesses();
        RefreshCharWeaknesses();
        RefreshWeaknessTrajectory();
        RefreshSkillSignals();
        RefreshTrends();
        NewTest();
    }

    partial void OnSelectedLanguageChanged(string value)
    {
        if (_applyingSettings) return;
        Save();
        NewTest();
    }

    partial void OnSelectedKeyboardThemeChanged(string value)
    {
        if (_applyingSettings) return;
        _audio.SetKeyboardTheme(value);
        Save();
    }

    partial void OnSelectedSoundscapeChanged(string value)
    {
        if (_applyingSettings) return;
        _audio.SetSoundscape(value);
        _audio.StartAmbient();
        Save();
    }

    partial void OnAmbientVolumeChanged(double value)
    {
        if (_applyingSettings) return;
        double maxVol = ReducedSensory ? 0.3 : 1.0;
        _audio.SetAmbientVolume(Math.Min(value, maxVol));
        Save();
    }

    partial void OnKeyVolumeChanged(double value)
    {
        if (_applyingSettings) return;
        double maxVol = ReducedSensory ? 0.3 : 1.0;
        _audio.SetKeyVolume(Math.Min(value, maxVol));
        Save();
    }

    partial void OnUiVolumeChanged(double value)
    {
        if (_applyingSettings) return;
        double maxVol = ReducedSensory ? 0.3 : 1.0;
        _audio.SetUiVolume(Math.Min(value, maxVol));
        Save();
    }

    partial void OnAmbientMutedChanged(bool value)
    {
        OnPropertyChanged(nameof(MuteButtonText));
        if (_applyingSettings) return;
        _audio.AmbientMuted = value;
        if (value)
            _audio.StopAmbient();
        else
            _audio.StartAmbient();
        Save();
    }

    partial void OnManualDifficultyLockChanged(int? value)
    {
        if (_applyingSettings) return;
        IsDifficultyLocked = value.HasValue;
        Save();
        RefreshDifficultyDisplay();
    }

    private void ApplySettings(AppSettings s)
    {
        _applyingSettings = true;
        try
        {
            SelectedLanguage = s.SelectedLanguage;
            SidebarWidth = s.SidebarOpen ? 320 : 0;
            HardcoreMode = s.HardcoreMode;
            ReducedSensory = s.ReducedSensory;
            CodeFontSize = s.FontSize;
            ManualDifficultyLock = s.ManualDifficultyLock;
            IsDifficultyLocked = s.ManualDifficultyLock.HasValue;
            ShowPerformanceCues = s.ShowPerformanceCues;
            FreezePersonalization = s.FreezePersonalization;
            ShowCommunityNotes = s.ShowCommunityNotes;
            ShowCommunitySignals = s.ShowCommunitySignals;
            ShowScaffolds = s.ShowScaffolds;
            ShowVariants = s.ShowVariants;

            // Guided Mode
            GuidedMode = s.SignalPolicy.GuidedMode;

            // Audio settings — sync observable properties
            AmbientVolume = s.AmbientVolume;
            KeyVolume = s.KeyVolume;
            UiVolume = s.UiVolume;
            AmbientMuted = false; // Always start unmuted
            SelectedKeyboardTheme = s.KeyboardSoundTheme;
            SelectedSoundscape = s.SelectedSoundscape;

            // Apply to audio service
            _audio.SetKeyboardTheme(s.KeyboardSoundTheme);
            _audio.SetSoundscape(s.SelectedSoundscape);
            _audio.AmbientMuted = false;

            double maxVol = s.ReducedSensory ? 0.3 : 1.0;
            _audio.SetAmbientVolume(Math.Min(s.AmbientVolume, maxVol));
            _audio.SetKeyVolume(Math.Min(s.KeyVolume, maxVol));
            _audio.SetUiVolume(Math.Min(s.UiVolume, maxVol));

            _audio.StartAmbient();
        }
        finally
        {
            _applyingSettings = false;
        }
    }

    private AppSettings CaptureSettings() => new()
    {
        SelectedLanguage = SelectedLanguage,
        SidebarOpen = SidebarWidth > 0,
        HardcoreMode = HardcoreMode,
        ReducedSensory = ReducedSensory,
        FontSize = CodeFontSize,
        // Audio
        AmbientMuted = AmbientMuted,
        AmbientVolume = AmbientVolume,
        KeyVolume = KeyVolume,
        UiVolume = UiVolume,
        KeyboardSoundTheme = SelectedKeyboardTheme,
        SelectedSoundscape = SelectedSoundscape,
        // Difficulty
        ManualDifficultyLock = ManualDifficultyLock,
        // Performance
        ShowPerformanceCues = ShowPerformanceCues,
        // Personalization
        FreezePersonalization = FreezePersonalization,
        // Pass through settings not yet exposed in UI
        HighContrast = _state.Settings.HighContrast,
        NormalizeLineEndings = _state.Settings.NormalizeLineEndings,
        IgnoreTrailingSpaces = _state.Settings.IgnoreTrailingSpaces,
        StrictWhitespace = _state.Settings.StrictWhitespace,
        DismissedInsightTypes = _state.Settings.DismissedInsightTypes,
        // Community
        ShowCommunityNotes = ShowCommunityNotes,
        ShowCommunitySignals = ShowCommunitySignals,

        // Pedagogy
        ShowScaffolds = ShowScaffolds,
        ShowVariants = ShowVariants,

        // Guided Mode — rebuild SignalPolicy from toggle state
        SignalPolicy = GuidedMode
            ? new SignalPolicy { GuidedMode = true, SignalsAffectSelection = true }
            : new SignalPolicy(),
    };

    private TypingSessionOptions BuildSessionOptions() => new()
    {
        NormalizeLineEndings = _state.Settings.NormalizeLineEndings,
        IgnoreTrailingSpaces = _state.Settings.IgnoreTrailingSpaces,
        StrictWhitespace = _state.Settings.StrictWhitespace,
        HardcoreMode = HardcoreMode
    };

    private void NewTest()
    {
        ShowCompletion = false;
        _repeatCounter = 0;
        SessionNote = "";

        var lang = string.IsNullOrWhiteSpace(SelectedLanguage) ? "python" : SelectedLanguage;
        _state.Profile.EnsureLanguage(lang);

        // Single pipeline: all content enters as CodeItem, sidecar preserves rich metadata
        var snippets = _pipeline.GetSnippets(lang);
        int rating = _state.Profile.RatingByLanguage.TryGetValue(lang, out var r) ? r : 1200;

        // Session planner: handles manual lock, yo-yo stabilization, and mix categories
        var comfortZone = _state.DifficultyMemory.ComfortZone(lang, ActiveProfile);
        bool isYoYoing = _state.DifficultyMemory.IsYoYoing(lang, ActiveProfile);

        var (snip, plan) = SessionPlanner.PlanNext(
            snippets, rating, _state.Profile.Level,
            comfortZone, _state.MistakeProfile, _focusCategory,
            _lastDifficulty, ManualDifficultyLock, isYoYoing,
            _state.WeaknessWindow,
            heatmap: _state.MistakeHeatmap,
            signalPolicy: _state.Settings.SignalPolicy);

        _currentSnippet = snip;
        _currentPlan = plan;

        // Update plan display (v0.9.0) — human-readable with category icon
        PlanCategoryText = ReasonFormatter.CategoryLabel(plan.Category);
        PlanReasonText = ReasonFormatter.Format(plan);

        // Build selection explanation for transparency
        var weakCategories = WeaknessDetector.GetWeakCategories(
            _state.WeaknessWindow, _state.MistakeProfile);
        var explanation = ExplanationBuilder.Build(plan, snip, weakCategories, _focusCategory);
        SelectionReasonText = ReasonFormatter.Format(plan);
        SelectionFactors = explanation.Factors;
        OnPropertyChanged(nameof(HasSelectionFactors));

        CurrentTitle = snip.Title;
        TargetText = snip.Code;
        TypedText = "";

        int recentPlays = XpEngine.CountRecentPlays(_state.RecentResults, snip.Id);
        _session.Start(TargetText, lang, snip.Id, BuildSessionOptions(), snip.Difficulty, recentPlays);
        RefreshDifficultyDisplay();

        // Generate orientation cue (sticky: only update when a new non-null cue appears)
        var trend = TrendEngine.ComputeForLanguage(_state.RecentResults, lang, profile: ActiveProfile);
        var cue = OrientationEngine.GenerateCue(_state.RecentResults, snippets, lang, trend);
        if (cue != null)
            _lastOrientationCue = cue;
        OrientationCue = _lastOrientationCue ?? "";
        ShowOrientationCue = _lastOrientationCue != null;

        OnPropertyChanged(nameof(SessionStatus));
        OnPropertyChanged(nameof(LevelBadge));
        PromptChanged?.Invoke();
        FocusRequested?.Invoke();
    }

    private void Reset()
    {
        ShowCompletion = false;
        TypedText = "";
        _session.Start(TargetText, SelectedLanguage, options: BuildSessionOptions());
        OnPropertyChanged(nameof(SessionStatus));
        PromptChanged?.Invoke();
        FocusRequested?.Invoke();
    }

    private void OnNext()
    {
        _audio.PlayUiClick();

        // Micro-drill: advance counter, auto-exit after 5 items
        if (IsDrillMode)
        {
            AdvanceDrill();
            if (!IsDrillMode)
            {
                // Drill complete — exit focus mode and return to normal
                _focusCategory = null;
                IsFocusMode = false;
                FocusCategoryLabel = "";
                OnPropertyChanged(nameof(SessionStatus));
            }
        }

        NewTest();
    }

    private void RepeatTest()
    {
        _audio.PlayUiClick();
        ShowCompletion = false;
        _repeatCounter++;
        SessionNote = "";

        var lang = string.IsNullOrWhiteSpace(SelectedLanguage) ? "python" : SelectedLanguage;
        CurrentTitle = _currentSnippet.Title;
        TargetText = _currentSnippet.Code;
        TypedText = "";

        int recentPlays = XpEngine.CountRecentPlays(_state.RecentResults, _currentSnippet.Id);
        _session.Start(TargetText, lang, _currentSnippet.Id, BuildSessionOptions(),
                       _currentSnippet.Difficulty, recentPlays);
        OnPropertyChanged(nameof(SessionStatus));
        PromptChanged?.Invoke();
        FocusRequested?.Invoke();
    }

    private void StartFocusPractice()
    {
        var weaknesses = _state.MistakeProfile.GetWeaknesses(1);
        if (weaknesses.Count == 0) return;

        var topWeakness = weaknesses[0];
        if (Enum.TryParse<SymbolCategoryKind>(topWeakness.Category, out var kind))
        {
            _focusCategory = kind;
            IsFocusMode = true;
            FocusCategoryLabel = FormatCategory(kind, topWeakness.ErrorCount);
            OnPropertyChanged(nameof(SessionStatus));
            NewTest();
        }
    }

    private void ClearFocus()
    {
        _focusCategory = null;
        IsFocusMode = false;
        FocusCategoryLabel = "";
        EndDrill();
        OnPropertyChanged(nameof(SessionStatus));
        NewTest();
    }

    /// <summary>
    /// Start a micro-drill: 5 quick items focused on the top weakness category.
    /// Reuses the existing focus practice + session planner machinery.
    /// Prefers heatmap-based weakness (per-character) when available,
    /// falls back to MistakeProfile (per-category).
    /// </summary>
    private void StartMicroDrill()
    {
        // Determine top weakness from heatmap (preferred) or profile (fallback)
        SymbolCategoryKind? drillCategory = null;

        var heatmapCategories = _state.MistakeHeatmap?.GetWeakestCategories(minAttempts: 10);
        if (heatmapCategories != null && heatmapCategories.Count > 0)
        {
            drillCategory = heatmapCategories[0].Category;
        }

        if (drillCategory == null)
        {
            var weaknesses = _state.MistakeProfile.GetWeaknesses(1);
            if (weaknesses.Count > 0 &&
                Enum.TryParse<SymbolCategoryKind>(weaknesses[0].Category, out var kind))
            {
                drillCategory = kind;
            }
        }

        if (drillCategory == null) return; // No weakness data yet

        // Set focus category (reuses existing FocusBoost in SnippetSelector)
        _focusCategory = drillCategory.Value;
        IsFocusMode = true;
        FocusCategoryLabel = FormatCategory(drillCategory.Value, 0);

        // Start drill counter
        _drillTotal = 5;
        _drillCompleted = 0;
        IsDrillMode = true;
        DrillProgressText = "Item 1 of 5";

        OnPropertyChanged(nameof(SessionStatus));
        NewTest();
    }

    private void AdvanceDrill()
    {
        _drillCompleted++;
        if (_drillCompleted >= _drillTotal)
        {
            EndDrill();
            return;
        }
        DrillProgressText = $"Item {_drillCompleted + 1} of {_drillTotal}";
    }

    private void EndDrill()
    {
        IsDrillMode = false;
        DrillProgressText = "";
        _drillTotal = 0;
        _drillCompleted = 0;
    }

    private void ShuffleAmbient()
    {
        var newSoundscape = _audio.ShuffleAmbient();
        if (newSoundscape != null && !string.Equals(SelectedSoundscape, newSoundscape, StringComparison.OrdinalIgnoreCase))
        {
            // Sync dropdown without triggering OnSelectedSoundscapeChanged
            _applyingSettings = true;
            try { SelectedSoundscape = newSoundscape; }
            finally { _applyingSettings = false; }
            Save();
        }
    }

    private void ToggleMute()
    {
        AmbientMuted = !AmbientMuted;
    }

    private void ToggleSidebar()
    {
        bool wasOpen = SidebarWidth > 0;
        SidebarWidth = wasOpen ? 0 : 320;
        Save();
        if (wasOpen) FocusRequested?.Invoke();
    }

    /// <summary>
    /// Toggles the debug inspector panel. Shows plan state, difficulty,
    /// weakness report, and heatmap data. Ctrl+Shift+D activation.
    /// </summary>
    private void ToggleDebugInspector()
    {
        DebugInspectorVisible = !DebugInspectorVisible;
        if (DebugInspectorVisible)
            RefreshDebugInspector();
    }

    private void RefreshDebugInspector()
    {
        // Plan info
        if (_currentPlan != null)
        {
            DebugPlanInfo =
                $"PLAN\n" +
                $"  Category: {_currentPlan.Category}\n" +
                $"  Target D: {_currentPlan.TargetDifficulty}\n" +
                $"  Actual D: {_currentPlan.ActualDifficulty}\n" +
                $"  Comfort:  {_currentPlan.ComfortZone?.ToString() ?? "none"}\n" +
                $"  Reason:   {_currentPlan.Reason}";
        }
        else
        {
            DebugPlanInfo = "PLAN: none";
        }

        // Difficulty info
        var lang = SelectedLanguage;
        int rating = _state.Profile.RatingByLanguage.GetValueOrDefault(lang, 1200);
        int comfortZone = _state.DifficultyMemory.ComfortZone(lang) ?? 4;
        DebugDifficultyInfo =
            $"DIFFICULTY\n" +
            $"  Rating:  {rating}\n" +
            $"  Comfort: D{comfortZone}\n" +
            $"  Level:   {_state.Profile.Level}";

        // Weakness report
        var tracker = new LinuxDevTyper.Core.Mistakes.WeaknessTracker();
        var report = tracker.GetReport(lang, _state.MistakeHeatmap, _state.WeaknessSnapshots);
        if (report.Items.Count > 0)
        {
            var top = report.Items.Take(5)
                .Select(w => $"  '{w.Character}' {w.CurrentErrorRate:P0} ({w.Trajectory})");
            DebugWeaknessInfo = $"WEAKNESSES ({report.Items.Count})\n" + string.Join("\n", top);
        }
        else
        {
            DebugWeaknessInfo = "WEAKNESSES: none";
        }

        // Heatmap top errors
        var topChars = _state.MistakeHeatmap.GetWeakest(5, 3);
        if (topChars.Count > 0)
        {
            var lines = topChars.Select(c =>
                $"  '{c.Character}' {c.ErrorRate:P0} ({c.TotalMisses}/{c.TotalAttempts})");
            DebugHeatmapInfo = $"HEATMAP TOP\n" + string.Join("\n", lines);
        }
        else
        {
            DebugHeatmapInfo = "HEATMAP: insufficient data";
        }
    }

    private void Save()
    {
        _state.Settings = CaptureSettings();
        _storage.Save(_state);

        OnPropertyChanged(nameof(LevelBadge));
    }

    private void RefreshHistory()
    {
        RecentHistory = _state.RecentResults
            .AsEnumerable()
            .Reverse()
            .Take(5)
            .Select(r => $"{r.Language}  {r.Wpm:0} WPM  {r.Accuracy:0}%  +{r.XpEarned}xp")
            .ToList();
    }

    public void OnKeyDown()
    {
        if (ShowCompletion) return;

        // Dismiss pre-session elements on first keystroke
        ShowOrientationCue = false;

        _audio.PlayKeyClick();
        _session.Update(TypedText);

        if (_session.Complete)
        {
            var metadata = new SessionMetadata(
                Intent: PracticeIntent.None,
                FocusCategory: _focusCategory?.ToString(),
                GroupId: _currentGroupId,
                RepeatNumber: _repeatCounter
            );
            var result = _session.ToResult(metadata);

            // Attach session note if provided
            if (!string.IsNullOrWhiteSpace(SessionNote))
                result = result with { Note = SessionNote.Trim() };

            // Attach plan metadata (v0.9.0) — display-only, never affects scoring
            if (_currentPlan != null)
                result = result with
                {
                    PlanCategory = _currentPlan.Category,
                    PlanReason = ReasonFormatter.Format(_currentPlan)
                };

            // Update XP and rating
            _state.Profile.AddXp(_session.XpEarned);
            var lang = result.Language;
            _state.Profile.EnsureLanguage(lang);
            int oldRating = _state.Profile.RatingByLanguage[lang];
            int newRating = RatingEngine.Adjust(oldRating, _currentSnippet.Difficulty, result, ActiveProfile);
            _state.Profile.RatingByLanguage[lang] = newRating;
            _state.AddResult(result);

            // Record mistakes into cross-session weakness profile and rolling decay window
            if (result.Mistakes != null && result.Mistakes.Count > 0)
            {
                _state.MistakeProfile.RecordSession(result.Mistakes, result.CharactersTyped);

                var mistakeEvents = result.Mistakes
                    .Select(m => new MistakeEvent(
                        LinuxDevTyper.Core.Mistakes.SymbolClassifier.Classify(m.Expected).ToString(),
                        result.Timestamp))
                    .ToList();
                _state.WeaknessWindow.RecordMistakes(mistakeEvents);
            }

            // Record per-character hits and misses into MistakeHeatmap
            RecordHeatmapData(result, _currentSnippet.Code);

            // Capture daily weakness snapshot for trajectory tracking
            LinuxDevTyper.Core.Mistakes.WeaknessTracker.MaybeSnapshot(
                lang, _state.MistakeHeatmap, _state.WeaknessSnapshots);

            // Record difficulty outcome for adaptive difficulty
            _state.DifficultyMemory.RecordSession(lang, _currentSnippet.Difficulty, result.Accuracy, result.Wpm);
            _lastDifficulty = _currentSnippet.Difficulty;

            Save();
            RefreshHistory();
            CompletionWpm = $"{result.Wpm:0} WPM";
            CompletionAccuracy = $"{result.Accuracy:0.0}%";
            CompletionXp = $"+{result.XpEarned} XP";
            CompletionErrors = $"{result.Errors} error{(result.Errors == 1 ? "" : "s")}";
            ExplainBullets = _currentSnippet.Explain?.ToList() ?? new();

            // Community notes: display only when toggled on and snippet has notes
            NotesBullets = (ShowCommunityNotes && _currentSnippet.Notes != null)
                ? _currentSnippet.Notes.Where(n => !string.IsNullOrWhiteSpace(n)).ToList()
                : new List<string>();
            OnPropertyChanged(nameof(HasNotes));

            // Community difficulty: display-only signal
            if (ShowCommunitySignals && _currentSnippet.CommunityDifficulty.HasValue)
            {
                CommunityDifficultyText = $"Community: {_currentSnippet.CommunityDifficulty.Value:0.#}";
                ShowCommunityDifficulty = true;
            }
            else
            {
                CommunityDifficultyText = "";
                ShowCommunityDifficulty = false;
            }

            // Pedagogy: scaffold and variants are display-only, never affect engines
            ScaffoldBullets = (ShowScaffolds && _currentSnippet.Scaffold != null)
                ? _currentSnippet.Scaffold.Where(s => !string.IsNullOrWhiteSpace(s)).ToList()
                : new List<string>();
            ScaffoldExpanded = false;
            OnPropertyChanged(nameof(HasScaffold));
            OnPropertyChanged(nameof(HasScaffoldDepth));
            OnPropertyChanged(nameof(ScaffoldHint));
            OnPropertyChanged(nameof(ScaffoldDepth));

            VariantBullets = (ShowVariants && _currentSnippet.Variants != null)
                ? _currentSnippet.Variants.Where(v => !string.IsNullOrWhiteSpace(v)).ToList()
                : new List<string>();
            OnPropertyChanged(nameof(HasVariants));

            // Per-session weak spots from this run's mistakes
            if (result.Mistakes != null && result.Mistakes.Count > 0)
            {
                var agg = MistakeAggregator.Aggregate(result.Mistakes);
                var top = MistakeAggregator.TopWeakCategories(agg, 3);
                SessionWeakSpots = top.Select(t => FormatCategory(t.Category, t.Count)).ToList();
            }
            else
            {
                SessionWeakSpots = new List<string>();
            }

            RefreshOverallWeaknesses();
            RefreshCharWeaknesses();
            RefreshWeaknessTrajectory();
            RefreshSkillSignals();
            RefreshTrends();

            // Generate post-session insights
            var trend = TrendEngine.ComputeForLanguage(_state.RecentResults, lang, profile: ActiveProfile);
            var insightTuples = InsightEngine.Generate(result, trend, _state.DifficultyMemory, lang,
                _state.RecentResults, _state.Settings.DismissedInsightTypes, ShowPerformanceCues);
            InsightItems = insightTuples.Select(i => new InsightItem(i.Type, i.Text)).ToList();

            // Check for fatigue (gated by ShowPerformanceCues)
            var fatigueReport = FatigueDetector.Analyze(_state.RecentResults, ActiveProfile);
            ShowFatigue = ShowPerformanceCues && fatigueReport.SuggestBreak;
            FatigueText = fatigueReport.Suggestion ?? "";

            // Group stats
            RefreshGroupStats();

            // Learn preferences periodically (every 5 sessions), unless frozen
            if (_state.RecentResults.Count % 5 == 0 && !FreezePersonalization)
            {
                _state.PersonalDefaults.LearnFromHistory(_state.RecentResults, _state.Settings);

                // Check for pending suggestions
                var suggestions = _state.PersonalDefaults.GetPendingSuggestions(_state.Settings);
                if (suggestions.Count > 0)
                {
                    DefaultSuggestions = string.Join(" ", suggestions);
                    ShowDefaultSuggestions = true;
                }
            }

            // Auto-dismiss welcome-back banner after first completion
            ShowWelcomeBack = false;

            ShowCompletion = true;
        }

        PromptChanged?.Invoke();
        OnPropertyChanged(nameof(LiveWpmText));
        OnPropertyChanged(nameof(LiveAccuracyText));
        OnPropertyChanged(nameof(ErrorsText));
        OnPropertyChanged(nameof(XpText));
        OnPropertyChanged(nameof(LevelBadge));
        OnPropertyChanged(nameof(SessionStatus));
    }

    private void RecordHeatmapData(Result result, string code)
    {
        var mistakePositions = new HashSet<int>();
        if (result.Mistakes != null)
        {
            foreach (var m in result.Mistakes)
                mistakePositions.Add(m.Position);
        }

        int charsTyped = Math.Min(result.CharactersTyped, code.Length);
        for (int i = 0; i < charsTyped; i++)
        {
            if (mistakePositions.Contains(i))
            {
                var mistake = result.Mistakes!.First(m => m.Position == i);
                _state.MistakeHeatmap.RecordMiss(mistake.Expected, mistake.Actual);
            }
            else
            {
                _state.MistakeHeatmap.RecordHit(code[i]);
            }
        }
    }

    private void RefreshOverallWeaknesses()
    {
        var weaknesses = _state.MistakeProfile.GetWeaknesses(5);
        OverallWeaknesses = weaknesses
            .Select(w => FormatCategoryName(w.Category, w.ErrorCount))
            .ToList();
        OnPropertyChanged(nameof(HasNoWeaknesses));
    }

    private void RefreshCharWeaknesses()
    {
        var weakest = _state.MistakeHeatmap.GetWeakest(count: 5, minAttempts: 5);
        CharWeaknesses = weakest.Select(w =>
        {
            var label = w.Character switch
            {
                ' ' => "space",
                '\n' => "newline",
                '\t' => "tab",
                _ => $"'{w.Character}'"
            };
            var confusion = w.TopConfusion != default ? $" (typed '{w.TopConfusion}')" : "";
            return $"  {label}: {w.ErrorRate:P0}{confusion}";
        }).ToList();
        OnPropertyChanged(nameof(HasCharWeaknesses));
    }

    private void RefreshWeaknessTrajectory()
    {
        var tracker = new LinuxDevTyper.Core.Mistakes.WeaknessTracker();
        var lang = SelectedLanguage;
        var report = tracker.GetReport(lang, _state.MistakeHeatmap, _state.WeaknessSnapshots);

        WeaknessTrajectorySummary = report.HasData ? report.Summary : "";

        if (!report.HasData)
        {
            WeaknessTrajectoryItems = new List<string>();
            OnPropertyChanged(nameof(HasWeaknessTrajectory));
            return;
        }

        WeaknessTrajectoryItems = report.Items.Take(5).Select(item =>
        {
            var arrow = item.Trajectory switch
            {
                LinuxDevTyper.Core.Mistakes.WeaknessTrajectory.Improving => "v",
                LinuxDevTyper.Core.Mistakes.WeaknessTrajectory.Worsening => "^",
                LinuxDevTyper.Core.Mistakes.WeaknessTrajectory.Steady => "-",
                _ => "*"
            };
            var charLabel = item.Character switch
            {
                ' ' => "space",
                '\n' => "newline",
                '\t' => "tab",
                _ => $"'{item.Character}'"
            };
            return $"  {arrow} {charLabel}: {item.CurrentErrorRate:P0}";
        }).ToList();
        OnPropertyChanged(nameof(HasWeaknessTrajectory));
    }

    private void RefreshSkillSignals()
    {
        var lang = SelectedLanguage;
        var comfortZone = _state.DifficultyMemory.ComfortZone(lang, ActiveProfile);
        bool isYoYoing = _state.DifficultyMemory.IsYoYoing(lang, ActiveProfile);

        var signal = SkillSignalBuilder.Build(
            plan: _currentPlan,
            comfortZone: comfortZone,
            window: _state.WeaknessWindow,
            isYoYoing: isYoYoing,
            isManualLock: ManualDifficultyLock.HasValue);

        SkillSummaryText = signal.Summary;
        RollingWeaknesses = signal.Weaknesses
            .Select(w => $"  {w.Label} ({w.Score:0.#})")
            .ToList();
        OnPropertyChanged(nameof(HasRollingWeaknesses));
    }

    private static string FormatCategory(SymbolCategoryKind kind, int count)
    {
        string name = kind switch
        {
            SymbolCategoryKind.CurlyBraces => "{ } Curly Braces",
            SymbolCategoryKind.Parentheses => "( ) Parentheses",
            SymbolCategoryKind.SquareBrackets => "[ ] Square Brackets",
            SymbolCategoryKind.AngleBrackets => "< > Angle Brackets",
            SymbolCategoryKind.Quotes => "\" ' Quotes",
            SymbolCategoryKind.Operators => "+ = Operators",
            SymbolCategoryKind.Punctuation => ". ; Punctuation",
            _ => kind.ToString()
        };
        return $"{name} ({count})";
    }

    private static string FormatCategoryName(string categoryName, int count)
    {
        if (Enum.TryParse<SymbolCategoryKind>(categoryName, out var kind))
            return FormatCategory(kind, count);
        return $"{categoryName} ({count})";
    }

    private void RefreshTrends()
    {
        var lang = string.IsNullOrWhiteSpace(SelectedLanguage) ? "python" : SelectedLanguage;
        var trend = TrendEngine.ComputeForLanguage(_state.RecentResults, lang, profile: ActiveProfile);

        if (trend.SessionCount < 5)
        {
            TrendWpmText = "";
            TrendAccuracyText = "";
            CompletionTrendSummary = "";
            HasTrendData = false;
            return;
        }

        HasTrendData = true;
        string wpmArrow = TrendArrow(trend.WpmTrend);
        string accArrow = TrendArrow(trend.AccuracyTrend);

        TrendWpmText = $"WPM: {trend.AvgWpm:0} {wpmArrow} ({trend.WpmDelta:+0.#;-0.#;0})";
        TrendAccuracyText = $"Acc: {trend.AvgAccuracy:0.#}% {accArrow} ({trend.AccuracyDelta:+0.#;-0.#;0})";

        CompletionTrendSummary = $"Trend: {trend.AvgWpm:0} WPM {wpmArrow}, {trend.AvgAccuracy:0.#}% {accArrow}";
    }

    private static string TrendArrow(MetricTrend trend) => trend switch
    {
        MetricTrend.Improving => "↑",
        MetricTrend.Declining => "↓",
        _ => "→"
    };

    private void StartNewGroup()
    {
        _currentGroupId = GenerateGroupId();
        NewTest();
    }

    private static string GenerateGroupId()
    {
        return $"group-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}";
    }

    private void RefreshGroupStats()
    {
        var groupResults = _state.RecentResults
            .Where(r => r.Metadata?.GroupId == _currentGroupId)
            .ToList();

        if (groupResults.Count >= 3)
        {
            double avgWpm = groupResults.Average(r => r.Wpm);
            double avgAcc = groupResults.Average(r => r.Accuracy);
            GroupStatsText = $"This sitting ({groupResults.Count} runs): {avgWpm:0} WPM avg, {avgAcc:0.#}% avg accuracy";
            ShowGroupStats = true;
        }
        else
        {
            GroupStatsText = "";
            ShowGroupStats = false;
        }
    }

    private void RefreshDifficultyDisplay()
    {
        var lang = string.IsNullOrWhiteSpace(SelectedLanguage) ? "python" : SelectedLanguage;
        int diff = _currentSnippet.Difficulty;

        bool yoyo = _state.DifficultyMemory.IsYoYoing(lang, ActiveProfile);
        ShowYoYoOverride = yoyo && !ManualDifficultyLock.HasValue;

        // Use plan info when available for richer display
        if (_currentPlan != null)
        {
            var cat = _currentPlan.Category switch
            {
                MixCategory.Review => "review",
                MixCategory.Stretch => "stretch",
                _ => ""
            };
            var suffix = string.IsNullOrEmpty(cat) ? "" : $" ({cat})";

            if (ManualDifficultyLock.HasValue)
                DifficultyInfoText = $"Difficulty: {diff} (locked)";
            else if (yoyo)
                DifficultyInfoText = $"Difficulty: {diff} (stabilizing)";
            else
                DifficultyInfoText = $"Difficulty: {diff}{suffix}";
        }
        else
        {
            DifficultyInfoText = $"Difficulty: {diff}";
        }

        // Update comfort zone display for sidebar
        var cz = _state.DifficultyMemory.ComfortZone(lang, ActiveProfile);
        ComfortZoneText = cz.HasValue ? $"Comfort zone: {cz.Value}" : "";
    }

    private void DismissInsight(string? type)
    {
        if (string.IsNullOrEmpty(type)) return;
        _state.Settings.DismissedInsightTypes.Add(type);
        InsightItems = InsightItems.Where(i => i.Type != type).ToList();
        Save();
    }

    private void DismissDefaultSuggestions()
    {
        ShowDefaultSuggestions = false;
        _state.PersonalDefaults.DismissSuggestions(20);
        Save();
    }

    private void ApplyDefaultSuggestions()
    {
        var defaults = _state.PersonalDefaults;
        if (defaults.PreferredLanguage != null
            && Languages.Contains(defaults.PreferredLanguage))
        {
            SelectedLanguage = defaults.PreferredLanguage;
        }
        if (defaults.PreferredFontSize.HasValue)
            CodeFontSize = defaults.PreferredFontSize.Value;

        ShowDefaultSuggestions = false;
        _state.PersonalDefaults.DismissSuggestions(20);
        Save();
    }

    private void ResetPersonalization()
    {
        _state.PersonalDefaults = new PersonalDefaults();
        ShowDefaultSuggestions = false;
        Save();
    }

    private void DismissYoYoLock()
    {
        var lang = string.IsNullOrWhiteSpace(SelectedLanguage) ? "python" : SelectedLanguage;
        _state.DifficultyMemory.DismissYoYoLock(lang);
        Save();
        RefreshDifficultyDisplay();
    }

    private void ToggleSessionBrowser()
    {
        ShowSessionBrowser = !ShowSessionBrowser;
        if (ShowSessionBrowser)
        {
            RefreshBrowsableResults();
            var stats = SummaryStatsEngine.Compute(_state.RecentResults);

            // Build summary with lifetime totals from monthly summaries
            int totalSessions = stats.TotalSessions;
            int totalXp = stats.TotalXpEarned;
            string? firstMonth = null;

            if (_state.SessionSummaryByMonth.Count > 0)
            {
                foreach (var kv in _state.SessionSummaryByMonth)
                {
                    totalSessions += kv.Value.SessionCount;
                    totalXp += kv.Value.TotalXp;
                    if (firstMonth == null || string.Compare(kv.Key, firstMonth, StringComparison.Ordinal) < 0)
                        firstMonth = kv.Key;
                }
            }

            if (stats.TotalSessions > 0 || _state.SessionSummaryByMonth.Count > 0)
            {
                var parts = new List<string>();
                if (firstMonth != null)
                    parts.Add($"Practiced since {firstMonth}: {totalSessions} sessions");
                else
                    parts.Add($"{totalSessions} sessions");
                parts.Add($"Avg {stats.AvgWpm:0} WPM, {stats.AvgAccuracy:0.#}%");
                parts.Add($"Best: {stats.BestWpm:0} WPM");
                parts.Add($"{totalXp:N0} XP earned");
                SummaryStatsText = string.Join(" | ", parts);
            }
            else
            {
                SummaryStatsText = "";
            }
        }
    }

    partial void OnSessionFilterTextChanged(string value) => RefreshBrowsableResults();

    private void RefreshBrowsableResults()
    {
        var results = _state.RecentResults.AsEnumerable().Reverse();
        var filter = SessionFilterText?.Trim();

        if (!string.IsNullOrEmpty(filter))
        {
            results = results.Where(r =>
                r.Language.Contains(filter, StringComparison.OrdinalIgnoreCase) ||
                (r.Metadata?.Intent.ToString().Contains(filter, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (r.Note?.Contains(filter, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var list = results.ToList();
        var formatted = new List<string>();

        // Prepend monthly summaries (descending by month)
        if (string.IsNullOrEmpty(filter) && _state.SessionSummaryByMonth.Count > 0)
        {
            var months = _state.SessionSummaryByMonth
                .OrderByDescending(kv => kv.Key);
            foreach (var kv in months)
            {
                var m = kv.Value;
                string langs = string.Join(", ", m.LanguagesUsed);
                formatted.Add($"[{kv.Key}] {m.SessionCount} sessions  {m.AvgWpm:0} WPM  {m.AvgAccuracy:0.#}%  +{m.TotalXp}xp  ({langs})");
            }
            if (formatted.Count > 0)
                formatted.Add("———");
        }

        foreach (var r in list)
        {
            string diffLabel = r.Difficulty > 0 ? $"  d{r.Difficulty}" : "";
            string line = $"[{r.Timestamp:yyyy-MM-dd HH:mm}] {r.Language}  {r.Wpm:0} WPM  {r.Accuracy:0.0}%  +{r.XpEarned}xp{diffLabel}";
            formatted.Add(line);

            if (!string.IsNullOrWhiteSpace(r.Note))
                formatted.Add($"    \"{r.Note}\"");
        }

        BrowsableResults = formatted;

        // Richer status with aggregate stats
        if (list.Count > 0)
        {
            double avgWpm = list.Average(r => r.Wpm);
            double avgAcc = list.Average(r => r.Accuracy);
            BrowserStatusText = $"Showing {list.Count} of {_state.RecentResults.Count} sessions | Avg: {avgWpm:0} WPM, {avgAcc:0.0}%";
        }
        else
        {
            BrowserStatusText = $"No sessions{(string.IsNullOrEmpty(filter) ? "" : " matching filter")}";
        }
    }

    /// <summary>
    /// Cached active profile. Re-resolved when profile name changes.
    /// Avoids repeated dictionary lookup and Clamp() on every engine call.
    /// </summary>
    private PracticeProfile _cachedProfile = PracticeProfile.Default;
    private string? _cachedProfileName;

    /// <summary>
    /// Returns the cached active profile. Only re-resolves when the
    /// active profile name changes (profile switching is infrequent).
    /// </summary>
    private PracticeProfile ActiveProfile
    {
        get
        {
            var name = _state.Settings.ActiveProfileName;
            if (name != _cachedProfileName)
            {
                _cachedProfileName = name;
                if (string.IsNullOrEmpty(name) || name == "Default")
                    _cachedProfile = PracticeProfile.Default;
                else
                    _cachedProfile = _state.PracticeProfiles.TryGetValue(name, out var profile)
                        ? profile
                        : PracticeProfile.Default;
            }
            return _cachedProfile;
        }
    }

    /// <summary>Invalidate profile cache after profile edits.</summary>
    private void InvalidateProfileCache() => _cachedProfileName = null;

    private void RefreshProfileNames()
    {
        var names = new List<string> { "Default" };
        names.AddRange(_state.PracticeProfiles.Keys.OrderBy(k => k));
        ProfileNames = names;

        _applyingSettings = true;
        try
        {
            SelectedProfileName = _state.Settings.ActiveProfileName ?? "Default";
        }
        finally { _applyingSettings = false; }

        LoadProfileEditorFields();
    }

    private void LoadProfileEditorFields()
    {
        var p = ActiveProfile;
        IsEditableProfile = SelectedProfileName != "Default";

        _applyingSettings = true;
        try
        {
            ProfileXpMultiplier = p.XpBaseMultiplier;
            ProfileSloppyThreshold = p.XpSloppyThreshold;
            ProfileRatingKFactor = p.RatingKFactor;
            ProfileComfortAccuracy = p.ComfortAccuracyThreshold;
            ProfileComfortMinSessions = p.ComfortMinSessions;
            ProfileTrendWpmThreshold = p.TrendWpmThreshold;
            ProfileFatigueBreakSessions = p.FatigueBreakSessions;
        }
        finally { _applyingSettings = false; }

        // Compute diff from Default for transparency
        if (IsEditableProfile)
        {
            var diffs = p.Diff(PracticeProfile.Default);
            ProfileDiffSummary = diffs.Count > 0
                ? string.Join(", ", diffs.Select(d => $"{d.Field}: {d.ThisValue}"))
                : "Same as Default";
        }
        else
        {
            ProfileDiffSummary = "";
        }

        // Badge for completion card
        ActiveProfileBadge = SelectedProfileName != "Default" ? $"Profile: {SelectedProfileName}" : "";
    }

    private void SaveProfileField()
    {
        if (_applyingSettings || !IsEditableProfile) return;
        var name = SelectedProfileName;
        if (!_state.PracticeProfiles.TryGetValue(name, out var profile)) return;

        profile.XpBaseMultiplier = ProfileXpMultiplier;
        profile.XpSloppyThreshold = ProfileSloppyThreshold;
        profile.RatingKFactor = ProfileRatingKFactor;
        profile.ComfortAccuracyThreshold = ProfileComfortAccuracy;
        profile.ComfortMinSessions = ProfileComfortMinSessions;
        profile.TrendWpmThreshold = ProfileTrendWpmThreshold;
        profile.FatigueBreakSessions = ProfileFatigueBreakSessions;
        InvalidateProfileCache();
        Save();
    }

    partial void OnSelectedProfileNameChanged(string value)
    {
        if (_applyingSettings) return;
        _state.Settings.ActiveProfileName = value == "Default" ? null : value;
        InvalidateProfileCache();
        LoadProfileEditorFields();
        Save();
    }

    partial void OnShowCommunityNotesChanged(bool value)
    {
        if (_applyingSettings) return;
        OnPropertyChanged(nameof(HasNotes));
        Save();
    }

    partial void OnShowCommunitySignalsChanged(bool value)
    {
        if (_applyingSettings) return;
        Save();
    }

    partial void OnGuidedModeChanged(bool value)
    {
        if (_applyingSettings) return;
        Save();
    }

    partial void OnShowScaffoldsChanged(bool value)
    {
        if (_applyingSettings) return;
        OnPropertyChanged(nameof(HasScaffold));
        OnPropertyChanged(nameof(HasScaffoldDepth));
        OnPropertyChanged(nameof(ScaffoldHint));
        OnPropertyChanged(nameof(ScaffoldDepth));
        Save();
    }

    partial void OnShowVariantsChanged(bool value)
    {
        if (_applyingSettings) return;
        OnPropertyChanged(nameof(HasVariants));
        Save();
    }

    partial void OnProfileXpMultiplierChanged(double value) => SaveProfileField();
    partial void OnProfileSloppyThresholdChanged(double value) => SaveProfileField();
    partial void OnProfileRatingKFactorChanged(int value) => SaveProfileField();
    partial void OnProfileComfortAccuracyChanged(double value) => SaveProfileField();
    partial void OnProfileComfortMinSessionsChanged(int value) => SaveProfileField();
    partial void OnProfileTrendWpmThresholdChanged(double value) => SaveProfileField();
    partial void OnProfileFatigueBreakSessionsChanged(int value) => SaveProfileField();

    private void CreateProfile(string? name)
    {
        var effectiveName = name ?? NewProfileName;
        if (string.IsNullOrWhiteSpace(effectiveName) || effectiveName == "Default") return;
        var trimmed = effectiveName.Trim();

        if (_state.PracticeProfiles.ContainsKey(trimmed)) return;

        var profile = new PracticeProfile { Name = trimmed };
        _state.PracticeProfiles[trimmed] = profile;
        _state.Settings.ActiveProfileName = trimmed;
        InvalidateProfileCache();
        NewProfileName = "";
        RefreshProfileNames();
        Save();
    }

    private void DeleteProfile()
    {
        var name = SelectedProfileName;
        if (string.IsNullOrEmpty(name) || name == "Default") return;

        _state.PracticeProfiles.Remove(name);
        _state.Settings.ActiveProfileName = null;
        InvalidateProfileCache();
        RefreshProfileNames();
        Save();
    }

    private void ExportBundle()
    {
        try
        {
            var packsDir = UserPackProvider.PacksDirectory();
            var json = PortableExporter.Export(packsDir, _state.PracticeProfiles);

            // Write to default export location next to packs
            var exportDir = Path.GetDirectoryName(packsDir) ?? packsDir;
            var exportPath = Path.Combine(exportDir, $"export-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}.ldtpack");
            File.WriteAllText(exportPath, json);

            ImportExportStatus = $"Exported to {exportPath}";
        }
        catch (Exception ex)
        {
            ImportExportStatus = $"Export failed: {ex.Message}";
        }
    }

    private void ImportBundle()
    {
        try
        {
            // Look for the most recent .ldtpack file in the config directory
            var packsDir = UserPackProvider.PacksDirectory();
            var configDir = Path.GetDirectoryName(packsDir) ?? packsDir;

            var files = Directory.GetFiles(configDir, "*.ldtpack");
            if (files.Length == 0)
            {
                ImportExportStatus = "No .ldtpack files found in config directory.";
                return;
            }

            // Import the most recent file
            var latest = files.OrderByDescending(f => File.GetLastWriteTimeUtc(f)).First();
            var json = File.ReadAllText(latest);

            var (success, message) = PortableExporter.Import(json, packsDir, _state.PracticeProfiles);
            ImportExportStatus = message;

            if (success)
            {
                RefreshPacks();
                RefreshProfileNames();
                Save();
            }
        }
        catch (Exception ex)
        {
            ImportExportStatus = $"Import failed: {ex.Message}";
        }
    }

    private void RefreshPacks()
    {
        // Re-scan user packs via a fresh UserPackProvider
        var userPacks = new UserPackProvider();
        var discovered = userPacks.DiscoverPacks();

        // Sync registry with discovered packs (preserve enabled state for known packs)
        var existing = _state.PackRegistry.ToDictionary(
            p => p.Language, p => p, StringComparer.OrdinalIgnoreCase);

        var updated = new List<PackMetadata>();
        foreach (var pack in discovered)
        {
            if (existing.TryGetValue(pack.Language, out var known))
            {
                known.SnippetCount = pack.SnippetCount;
                updated.Add(known);
            }
            else
            {
                updated.Add(pack);
            }
        }
        _state.PackRegistry = updated;

        // Re-ingest enabled user packs into the canonical pipeline
        var enabledUserLangs = _state.PackRegistry
            .Where(p => p.Enabled)
            .Select(p => p.Language)
            .ToList();
        if (enabledUserLangs.Count > 0)
            _pipeline.IngestUserPacks(enabledUserLangs, userPacks.LoadSnippets);

        Languages = _pipeline.Languages()
            .Select(l => l.ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(l => l)
            .ToList();
        if (Languages.Count == 0) Languages = new List<string> { "python" };

        RefreshPackItems();
        Save();
    }

    private void RefreshPackItems()
    {
        PackItems = _state.PackRegistry.Select(p => new PackItemViewModel(
            language: p.Language,
            snippetCount: p.SnippetCount,
            enabled: p.Enabled,
            onToggle: (lang, enabled) => TogglePackEnabled(lang, enabled)
        )).ToList();

        PackStatusText = _state.PackRegistry.Count > 0
            ? $"{_state.PackRegistry.Count} pack(s) discovered"
            : "No user packs found";
    }

    private void TogglePackEnabled(string language, bool enabled)
    {
        var pack = _state.PackRegistry.FirstOrDefault(
            p => string.Equals(p.Language, language, StringComparison.OrdinalIgnoreCase));
        if (pack != null)
        {
            pack.Enabled = enabled;

            // Re-ingest to reflect the change in the pipeline
            RefreshPacks();
        }
    }

    private void PasteCode()
    {
        if (string.IsNullOrWhiteSpace(PasteCodeText))
        {
            ContentStatusText = "Nothing to paste.";
            return;
        }

        var lang = string.IsNullOrWhiteSpace(PasteCodeLanguage) ? null : PasteCodeLanguage.Trim();
        var title = PasteCodeTitle;
        var item = _pipeline.PasteCode(title, PasteCodeText, lang);

        if (item == null)
        {
            ContentStatusText = "Already indexed (duplicate content).";
            return;
        }

        ContentStatusText = $"Added \"{item.Title}\" ({item.Language}).";
        PasteCodeText = "";
        PasteCodeTitle = "";
        RefreshContentState();
    }

    private async void ImportFile()
    {
        if (string.IsNullOrWhiteSpace(ImportFilePath))
        {
            ContentStatusText = "No file path specified.";
            return;
        }

        var path = ImportFilePath.Trim();
        if (!File.Exists(path))
        {
            ContentStatusText = $"File not found: {path}";
            return;
        }

        ContentStatusText = "Importing...";
        var added = await _pipeline.ImportFileAsync(path);
        ContentStatusText = added > 0
            ? $"Imported {added} item(s) from file."
            : "No new items (already indexed or empty).";
        ImportFilePath = "";
        RefreshContentState();
    }

    private async void ImportFolder()
    {
        if (string.IsNullOrWhiteSpace(ImportFolderPath))
        {
            ContentStatusText = "No folder path specified.";
            return;
        }

        var path = ImportFolderPath.Trim();
        if (!Directory.Exists(path))
        {
            ContentStatusText = $"Folder not found: {path}";
            return;
        }

        ContentStatusText = "Indexing folder...";
        var added = await _pipeline.ImportFolderAsync(path);
        ContentStatusText = $"Indexed {added} item(s) from folder.";
        ImportFolderPath = "";
        RefreshContentState();
    }

    private void RefreshContentState()
    {
        OnPropertyChanged(nameof(ContentItemCount));
        Languages = _pipeline.Languages()
            .Select(l => l.ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(l => l)
            .ToList();
        if (Languages.Count == 0) Languages = new List<string> { "python" };
        RefreshLibraryHealth();
    }

    /// <summary>Call on window close to clean up audio resources.</summary>
    public void Shutdown()
    {
        _audio.StopAmbient();
        _audio.Dispose();
    }
}

/// <summary>
/// Bindable insight item with type and text for display + dismissal.
/// </summary>
public sealed record InsightItem(string Type, string Text);

/// <summary>
/// Bindable pack item for the sidebar pack list.
/// </summary>
public sealed class PackItemViewModel : ObservableObject
{
    private readonly Action<string, bool> _onToggle;
    private bool _enabled;

    public string Language { get; }
    public int SnippetCount { get; }
    public string DisplayText => $"{Language} ({SnippetCount} snippets)";

    public bool Enabled
    {
        get => _enabled;
        set
        {
            if (SetProperty(ref _enabled, value))
                _onToggle(Language, value);
        }
    }

    public PackItemViewModel(string language, int snippetCount, bool enabled, Action<string, bool> onToggle)
    {
        Language = language;
        SnippetCount = snippetCount;
        _enabled = enabled;
        _onToggle = onToggle;
    }
}
