using System.Text.Json;
using GeneratedSample;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace GeneratedSample.Tests;

[TestClass]
public sealed class ContractTests
{
    [TestMethod]
    public void ExposesOnlyFixedCreditRoutes()
    {
        var source = File.ReadAllText(ProjectFile("Program.cs"));
        foreach (var route in new[] { "sale", "authorize", "capture", "void", "refund", "status" })
        {
            StringAssert.Contains(source, $"\"/api/credit/{route}\"");
        }
        Assert.IsFalse(source.Contains(":operation", StringComparison.Ordinal));
        Assert.IsFalse(source.Contains("MapMethods", StringComparison.Ordinal));
    }

    [TestMethod]
    public void UsesTransactionApiConfigWithoutPhpCredentialLeakage()
    {
        var source = File.ReadAllText(ProjectFile("baseplate", "GatewayConfig.cs"));
        foreach (var token in new[] { "TransactionApiConfig", "AccountCredential", "AppSecret", "Region" })
        {
            StringAssert.Contains(source, token);
        }
        StringAssert.Contains(source, "TAPI_API_SECRET");
        Assert.IsFalse(source.Contains("TAPI_APP_SECRET", StringComparison.Ordinal));
        Assert.IsFalse(source.Contains("TAPI_API_KEY", StringComparison.Ordinal));
        Assert.IsFalse(source.Contains("TAPI_PARTNER_NAME", StringComparison.Ordinal));
    }

    [TestMethod]
    public void RequestMetadataAndFixtureRemainStable()
    {
        using var body = JsonDocument.Parse("""{"idempotencyKey":"fixture-idempotency-key"}""");
        Assert.AreEqual("fixture-idempotency-key", RequestMetadata.ClientTransactionId(body.RootElement));
        using var fixture = JsonDocument.Parse(File.ReadAllText(ProjectFile("tests", "fixtures", "credit.json")));
        Assert.AreEqual("fixture-idempotency-key", fixture.RootElement.GetProperty("sale").GetProperty("idempotencyKey").GetString());
        var source = File.ReadAllText(ProjectFile("bricks", "tapi", "dotnet", "CreditLifecycle.cs"));
        StringAssert.Contains(source, "WithClientTransactionId");
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
