using System;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using OnlyCatsConsoleApp.Services;
using OnlyCatsConsoleApp.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TournamentService.Services;

namespace OnlyCatsConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            try
            {
                // Set up logging
                using var loggerFactory = LoggerFactory.Create(builder =>
                {
                    builder
                        .AddConsole()
                        .SetMinimumLevel(LogLevel.Information);
                });

                var logger = loggerFactory.CreateLogger<Program>();

                // Load configuration
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json")
                    .AddEnvironmentVariables()
                    .Build();

                var config = configuration.Get<AppConfig>();
                if (config == null)
                {
                    throw new InvalidOperationException("Failed to load configuration");
                }

                // Initialize database
                var dbInitializer = new DbInitializer(config.ConnectionStrings.DefaultConnection);
                dbInitializer.EnsureDatabase();

                logger.LogInformation("Starting OnlyCats Daily Tournament");

                // Initialize Web3 with account
                var account = new Account(config.PrivateKey);
                var web3 = new Web3(account, config.RpcUrl);

                // Initialize services
                var contractService = new SmartContractService(web3, config.ContractAddress, logger, config);

                var reqStake = await contractService.GetRequiredStake();
                var cats = await contractService.GetCatsByState(1);

                if (cats.Count < 2)
                {
                    logger.LogWarning("Not enough cats for tournament.");
                    return;
                }

                var tournament = new Tournament();
                var result = tournament.RunTournament(cats, (decimal)reqStake / 1e18m);

                logger.LogInformation("Battles:");
                foreach (var battle in result.Battles)
                {
                    logger.LogInformation("Winner: {WinnerId}, Loser: {LoserId}", battle.WinnerId, battle.LoserId);
                }

                logger.LogInformation("\nBalances:");
                foreach (var kvp in result.BalanceUpdates.OrderBy(kvp => kvp.Key))
                {
                    logger.LogInformation("Cat {CatId}: {Balance:F2}", kvp.Key, kvp.Value);
                }

                logger.LogInformation("\nGrand Prize Pool: {GrandPrizePool:F2}", result.GrandPrizePool);

                // Update states and record battles
                int[] states = Enumerable.Repeat(0, result.DeadCats.Count).ToArray();
                await contractService.UpdateCatStates(result.DeadCats.ToArray(), states);
                await contractService.AddToCatBalances(result.BalanceUpdates.Keys.ToArray(), result.BalanceUpdates.Values.ToArray());
                await contractService.RecordBattles(result);

                // Update local database with tournament results
                try
                {
                    var dbLogger = loggerFactory.CreateLogger<DbUpdater>();
                    var dbUpdater = new DbUpdater(config.ConnectionStrings.DefaultConnection, dbLogger);

                    // Get the first winner's address (if any)
                    var winnerAddress = result.Battles.FirstOrDefault()?.WinnerId.ToString() ?? "Unknown";

                    dbUpdater.UpdateTournamentResults(new TournamentService.Services.TournamentResult
                    {
                        BattleId = $"battle-{DateTime.Now:yyyyMMddHH}",
                        OverallResult = $"Tournament completed with {result.Battles.Count} battles",
                        WinnerAddress = winnerAddress,
                        GrandPrizePool = result.GrandPrizePool,
                        ParticipantCount = cats.Count,
                        Battles = result.Battles.Select(b => new TournamentService.Services.BattleResult 
                        {
                            WinnerId = b.WinnerId.ToString(),
                            LoserId = b.LoserId.ToString()
                        }).ToList()
                    });

                    logger.LogInformation("Tournament results recorded successfully in local database.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to record tournament results in local database");
                    // Continue execution as this is not a critical failure
                }
            }
            catch (Exception ex)
            {
                var logger = LoggerFactory.Create(builder => builder.AddConsole())
                    .CreateLogger<Program>();
                logger.LogError(ex, "Fatal error in main program");
                throw;
            }
        }
    }
} 