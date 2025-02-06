using System;
using System.Data.SQLite;

namespace TournamentService.Services
{
    public class DbInitializer
    {
        private readonly string _connectionString;

        public DbInitializer(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void EnsureDatabase()
        {
            // Create database if it doesn't exist
            SQLiteConnection.CreateFile("leaderboard.db");

            using (var connection = new SQLiteConnection(_connectionString))
            {
                connection.Open();
                var sql = @"
                    CREATE TABLE IF NOT EXISTS TournamentResults (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        BattleId TEXT NOT NULL,
                        Result TEXT NOT NULL,
                        Timestamp DATETIME NOT NULL,
                        WinnerAddress TEXT,
                        PrizePool DECIMAL(18,2),
                        ParticipantCount INTEGER
                    );
                    CREATE INDEX IF NOT EXISTS IX_TournamentResults_BattleId ON TournamentResults(BattleId);
                    CREATE INDEX IF NOT EXISTS IX_TournamentResults_Timestamp ON TournamentResults(Timestamp);";
                
                using (var command = new SQLiteCommand(sql, connection))
                {
                    command.ExecuteNonQuery();
                }
            }
        }
    }
} 