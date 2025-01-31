using System;

namespace OnlyCatsConsoleApp.Models
{
    public class AppConfig
    {
        public string RpcUrl { get; set; } = string.Empty;
        public string ContractAddress { get; set; } = string.Empty;
        public string PrivateKey { get; set; } = string.Empty;
        public int MaxRetries { get; set; } = 3;
        public int RetryDelayMs { get; set; } = 1000;
        public int TransactionTimeoutSeconds { get; set; } = 60;
    }
} 