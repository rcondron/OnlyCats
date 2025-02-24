using System;
using Microsoft.Data.Sqlite;

namespace TournamentApp.Services
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
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Open();
                var sqlBattles = @"
                    CREATE TABLE IF NOT EXISTS Battles (
	                    Id INTEGER NOT NULL,
	                    ""Timestamp"" INTEGER NOT NULL,
	                    WinnerId INTEGER,
	                    LoserId INTEGER,
	                    Reward NUMERIC DEFAULT (0) NOT NULL,
	                    IsChamp INTEGER DEFAULT (0) NOT NULL,
	                    CONSTRAINT Battles_PK PRIMARY KEY (Id)
                    );
                    CREATE INDEX IF NOT EXISTS IX_Battles_Id ON Battles(Id);
                    CREATE INDEX IF NOT EXISTS IX_Battles_Timestamp ON Battles(Timestamp);";
                
                using (var command = new SqliteCommand(sqlBattles, connection))
                {
                    command.ExecuteNonQuery();
                }

                var sqlCats = @"
                    CREATE TABLE IF NOT EXISTS Cats (
	                    Id INTEGER NOT NULL,
	                    Name TEXT,
	                    IPFS TEXT,
	                    CONSTRAINT Cats_PK PRIMARY KEY (Id)
                    );

                    CREATE INDEX IF NOT EXISTS IX_Cats_Id ON Cats(Id);";

                using (var command = new SqliteCommand(sqlCats, connection))
                {
                    command.ExecuteNonQuery();
                }
            }
        }
    }
} 