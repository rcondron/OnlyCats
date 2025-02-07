using System;

namespace OnlyCatsConsoleApp.Models
{
    public class AppConfig
    {
        public required string RpcUrl { get; set; }
        public required string ContractAddress { get; set; }
        public required string PrivateKey { get; set; }
        public int MaxRetries { get; set; } = 3;
        public int RetryDelayMs { get; set; } = 1000;
        public int TransactionTimeoutSeconds { get; set; } = 60;
        public required ConnectionStrings ConnectionStrings { get; set; }
    }

    public class ConnectionStrings
    {
        public required string DefaultConnection { get; set; }
    }
} 