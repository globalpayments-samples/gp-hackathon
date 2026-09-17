using System.Text.Json;
using GeneratedSample;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace GeneratedSample.Tests;

[TestClass]
public sealed class ContractTests
{
    [TestMethod]
    public void ExposesOnlyFixedLifecycleRoutes()
    {
        var source = File.ReadAllText(ProjectFile("Program.cs"));
        foreach (var route in new[] { "verify", "authorize", "capture", "refund", "reverse", "status" })
        {
            StringAssert.Contains(source, $"\"/api/payments/{route}\"");
        }
        Assert.IsFalse(source.Contains(":operation", StringComparison.Ordinal));
        Assert.IsFalse(source.Contains("MapMethods", StringComparison.Ordinal));
    }

    [TestMethod]
    public void LiveBoundaryReportsMissingCredentials()
    {
        var names = new[] { "GP_API_ENVIRONMENT", "GP_APP_ID", "GP_APP_KEY" };
        var original = names.ToDictionary(name => name, System.Environment.GetEnvironmentVariable);
        try
        {
            foreach (var name in names) System.Environment.SetEnvironmentVariable(name, null);
            CollectionAssert.AreEqual(names, LiveBoundary.MissingCredentials(names));
        }
        finally
        {
            foreach (var item in original) System.Environment.SetEnvironmentVariable(item.Key, item.Value);
        }
    }

    [TestMethod]
    public void FixtureAndOfficialSdkIdiomsRemainStable()
    {
        using var fixture = JsonDocument.Parse(File.ReadAllText(ProjectFile("tests", "fixtures", "lifecycle.json")));
        Assert.AreEqual("single-use-token-from-hosted-fields", fixture.RootElement.GetProperty("tokenPayment").GetProperty("token").GetString());
        var source = File.ReadAllText(ProjectFile("bricks", "gp-api", "dotnet", "PaymentLifecycle.cs"));
        StringAssert.Contains(source, "CreditCardData");
        StringAssert.Contains(source, "Transaction.FromId");
        StringAssert.Contains(source, "ReportingService.TransactionDetail");
    }

    private static string ProjectFile(params string[] parts)
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "SampleProject.csproj")))
        {
            directory = directory.Parent;
        }
        Assert.IsNotNull(directory);
        return Path.Combine(new[] { directory.FullName }.Concat(parts).ToArray());
    }
}
