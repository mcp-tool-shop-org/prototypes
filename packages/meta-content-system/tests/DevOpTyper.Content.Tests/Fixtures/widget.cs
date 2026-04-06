namespace App;

public class Widget
{
    public string Name { get; set; } = "";

    public override string ToString()
        => $"Widget: {Name}";
}
