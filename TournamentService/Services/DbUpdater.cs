using System;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace TournamentApp.Services
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

        public Tuple<long, string, string> GetCat(long catId)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var sql = "SELECT Id, Name, IPFS FROM Cats WHERE Id = @Id";

                using (var command = new SqliteCommand(sql, connection))
                {
                    command.Parameters.AddWithValue("@Id", catId);
                    
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new Tuple<long, string, string>(
                                reader.GetInt64(0),    // Id
                                reader.GetString(1),    // Name
                                reader.GetString(2)     // IPFS
                            );
                        }
                        return null; // Return null if cat not found
                    }
                }
            }
        }

        public List<long> GetCatIds()
        {
            var catIds = new List<long>();
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var sql = "SELECT Id FROM Cats ORDER BY Id";

                using (var command = new SqliteCommand(sql, connection))
                {
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            catIds.Add(reader.GetInt64(0));
                        }
                    }
                }
            }
            return catIds;
        }

        public void SaveBattles(TournamentResult result)
        {

            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var sql = @"INSERT INTO Battles (Id, Timestamp, WinnerId, LoserId, Reward, IsChamp) VALUES (@Id, @Timestamp, @WinnerId, @LoserId, @Reward, @IsChamp)";

                foreach (var b in result.Battles)
                {
                    try
                    {
                        using (var command = new SqliteCommand(sql, connection))
                        {
                            command.Parameters.AddWithValue("@Id", b.RoundId);
                            command.Parameters.AddWithValue("@Timestamp", DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                            command.Parameters.AddWithValue("@WinnerId", b.WinnerId);
                            command.Parameters.AddWithValue("@LoserId", b.LoserId);
                            command.Parameters.AddWithValue("@Reward", b.Reward);
                            command.Parameters.AddWithValue("@IsChamp", b.RoundId == result.Battles.Last().RoundId);
                            command.ExecuteNonQuery();
                        }

                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to update tournament results for battle {BattleId}", b.RoundId);
                        throw; // Re-throw to ensure the error is handled by the calling code
                    }
                }
            }

        }

        public void SaveCat(long id, string name, string ipfs)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var sql = "INSERT INTO Cats (Id, Name, IPFS) VALUES (@Id, @Name, @IPFS)";

                using (var command = new SqliteCommand(sql, connection))
                {
                    command.Parameters.AddWithValue("@Id", id);
                    command.Parameters.AddWithValue("@Name", name);
                    command.Parameters.AddWithValue("@IPFS", ipfs);
                    command.ExecuteNonQuery();
                }
            }
        }

    }
} 