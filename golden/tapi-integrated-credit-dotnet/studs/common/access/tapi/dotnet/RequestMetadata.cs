using System.Text.Json;

namespace GeneratedSample;

public static class RequestMetadata
{
    public static string? ClientTransactionId(JsonElement body)
    {
        foreach (var name in new[] { "clientTransactionId", "idempotencyKey" })
        {
            if (!body.TryGetProperty(name, out var value)) continue;
            if (value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
            {
                throw new ArgumentException($"{name} must be a non-empty string when provided");
            }
            return value.GetString()!.Trim();
        }
        return null;
    }
}
