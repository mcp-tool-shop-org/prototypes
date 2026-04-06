using Xunit;

namespace CursorAssist.Tests.Cli;

public class DiagnoseTests
{
    [Fact]
    public void Diagnose_Returns_Zero()
    {
        var output = new StringWriter();
        Console.SetOut(output);

        try
        {
            var exitCode = CursorAssist.Benchmark.Cli.Program.Main(["--diagnose"]);
            Assert.Equal(0, exitCode);
        }
        finally
        {
            Console.SetOut(new StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });
        }

        var text = output.ToString();
        Assert.Contains("runtime.version", text);
        Assert.Contains("package.version", text);
    }

    [Fact]
    public void Version_Returns_Zero()
    {
        var output = new StringWriter();
        Console.SetOut(output);

        try
        {
            var exitCode = CursorAssist.Benchmark.Cli.Program.Main(["--version"]);
            Assert.Equal(0, exitCode);
        }
        finally
        {
            Console.SetOut(new StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });
        }

        var text = output.ToString().Trim();
        Assert.Matches(@"^\d+\.\d+\.\d+", text);
    }
}
