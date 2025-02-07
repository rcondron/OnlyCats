using System;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;

namespace TournamentService.Services
{
    public class DbUpdater
    {
        private readonly string _connectionString;
        private readonly ILogger<DbUpdater> _logger;

        public DbUpdater(string connectionString, ILogger<DbUpdater> logger)
        {
            _connectionString = connectionString;
            _logger = logger;
        }

        public void UpdateTournamentResults(TournamentResult result)
        {
            try
            {
                using (var connection = new SqliteConnection(_connectionString))
                {
                    connection.Open();
                    var sql = @"
                        INSERT INTO TournamentResults 
                        (BattleId, Result, Timestamp, WinnerAddress, PrizePool, ParticipantCount) 
                        VALUES 
                        (@battleId, @result, @timestamp, @winnerAddress, @prizePool, @participantCount)";

                    using (var command = new SqliteCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@battleId", result.BattleId);
                        command.Parameters.AddWithValue("@result", result.OverallResult);
                        command.Parameters.AddWithValue("@timestamp", DateTime.Now);
                        command.Parameters.AddWithValue("@winnerAddress", result.WinnerAddress);
                        command.Parameters.AddWithValue("@prizePool", result.GrandPrizePool);
                        command.Parameters.AddWithValue("@participantCount", result.ParticipantCount);
                        command.ExecuteNonQuery();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update tournament results for battle {BattleId}", result.BattleId);
                throw; // Re-throw to ensure the error is handled by the calling code
            }
        }
    }

    public class TournamentResult
    {
        public required string BattleId { get; set; }
        public required string OverallResult { get; set; }
        public required string WinnerAddress { get; set; }
        public decimal GrandPrizePool { get; set; }
        public int ParticipantCount { get; set; }
        public List<BattleResult> Battles { get; set; } = new();
    }

    public class BattleResult
    {
        public required string WinnerId { get; set; }
        public required string LoserId { get; set; }
    }
} 