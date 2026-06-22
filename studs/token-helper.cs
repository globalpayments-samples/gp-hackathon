/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 *
 * Implementation: direct HttpClient REST call (not the GP .NET SDK).
 * All four GP-Projects language implementations use direct REST for this step
 * because the SDK does not expose the PMT_POST_Create_Single permission scope.
 *
 * Reference: online-card-payments/dotnet/Program.cs
 * Protocol:  POST /ucp/accesstoken with SHA-512(nonce + appKey) secret
 *            and X-GP-Version: 2021-03-22 header.
 */

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public static class TokenHelper
{
    private static readonly HttpClient _http = CreateHttpClient();

    private static HttpClient CreateHttpClient()
    {
        var handler = new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate,
        };
        var client = new HttpClient(handler);
        client.DefaultRequestHeaders.Add("X-GP-Version", "2021-03-22");
        return client;
    }

    private static string GenerateNonce()
    {
        var bytes = new byte[16];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLower();
    }

    private static string HashSecret(string nonce, string appKey)
    {
        var hash = SHA512.HashData(Encoding.UTF8.GetBytes(nonce + appKey));
        return Convert.ToHexString(hash).ToLower();
    }

    public static async Task<object> GenerateAccessToken()
    {
        var appId = System.Environment.GetEnvironmentVariable("GP_APP_ID")!;
        var appKey = System.Environment.GetEnvironmentVariable("GP_APP_KEY")!;
        var env = (System.Environment.GetEnvironmentVariable("GP_API_ENVIRONMENT") ?? "sandbox").ToLower();

        var nonce = GenerateNonce();
        var secret = HashSecret(nonce, appKey);

        var endpoint = env == "production"
            ? "https://apis.globalpay.com/ucp/accesstoken"
            : "https://apis.sandbox.globalpay.com/ucp/accesstoken";

        var payload = JsonSerializer.Serialize(new
        {
            app_id = appId,
            nonce,
            secret,
            grant_type = "client_credentials",
            seconds_to_expire = 600,
            permissions = new[] { "PMT_POST_Create_Single" },
        });

        var response = await _http.PostAsync(endpoint,
            new StringContent(payload, Encoding.UTF8, "application/json"));
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Failed to generate access token: {body}");

        var data = JsonSerializer.Deserialize<JsonElement>(body);
        return new
        {
            accessToken = data.GetProperty("token").GetString(),
            environment = env,
        };
    }
}
