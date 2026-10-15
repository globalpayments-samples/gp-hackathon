namespace GeneratedSample;

public sealed class MissingCredentialsException(string message) : InvalidOperationException(message);

public static class LiveBoundary
{
    public static string[] MissingCredentials(IEnumerable<string> required) =>
        required.Where(name => string.IsNullOrWhiteSpace(System.Environment.GetEnvironmentVariable(name)))
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();

    public static void RequireCredentials(IEnumerable<string> required)
    {
        var missing = MissingCredentials(required);
        if (missing.Length > 0)
        {
            throw new MissingCredentialsException($"Live call blocked: missing {string.Join(", ", missing)}");
        }
    }
}
