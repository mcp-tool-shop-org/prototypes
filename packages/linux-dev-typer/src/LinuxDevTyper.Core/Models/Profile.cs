namespace LinuxDevTyper.Core.Models;

public sealed class Profile
{
    public int Level { get; set; } = 1;
    public int Xp { get; set; } = 0;

    public Dictionary<string, int> RatingByLanguage { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public void EnsureLanguage(string lang)
    {
        if (string.IsNullOrWhiteSpace(lang)) return;
        if (!RatingByLanguage.ContainsKey(lang)) RatingByLanguage[lang] = 1200;
    }

    public void AddXp(int amount)
    {
        Xp += Math.Max(0, amount);
        while (Xp >= XpNeededForNext(Level))
        {
            Xp -= XpNeededForNext(Level);
            Level++;
        }
    }

    public static int XpNeededForNext(int level) => 200 + (level * 40);
}
