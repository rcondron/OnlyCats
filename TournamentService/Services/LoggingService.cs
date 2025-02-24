using System;
using System.IO;
using System.Threading.Tasks;

namespace TournamentApp.Services
{
    public class LoggingService
    {
        private readonly string _logPath;
        private readonly object _lockObj = new object();

        public LoggingService(string logDirectory = "logs")
        {
            Directory.CreateDirectory(logDirectory);
            _logPath = Path.Combine(logDirectory, $"tournament_{DateTime.Now:yyyyMMdd}.log");
        }

        public async Task LogAsync(string message, string level = "INFO")
        {
            var logMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [{level}] {message}";
            Console.WriteLine(logMessage);
            
            await Task.Run(() =>
            {
                lock (_lockObj)
                {
                    File.AppendAllText(_logPath, logMessage + Environment.NewLine);
                }
            });
        }

        public async Task LogErrorAsync(Exception ex, string context = "")
        {
            var message = $"{context} - Error: {ex.Message}\nStackTrace: {ex.StackTrace}";
            await LogAsync(message, "ERROR");
        }
    }
} 