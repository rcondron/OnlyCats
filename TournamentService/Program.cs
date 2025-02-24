using System;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using TournamentApp.Services;
using TournamentApp.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;

namespace TournamentApp
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

                // Override private key from environment variable if it exists
                var envPrivateKey = Environment.GetEnvironmentVariable("PRIVATE_KEY");
                if (!string.IsNullOrEmpty(envPrivateKey))
                {
                    config.PrivateKey = envPrivateKey;
                    logger.LogInformation("Using private key from environment variable");
                }

                if (string.IsNullOrEmpty(config.PrivateKey))
                {
                    throw new InvalidOperationException("Private key is not configured");
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

                var dbLogger = loggerFactory.CreateLogger<DbUpdater>();
                var dbUpdater = new DbUpdater(config.ConnectionStrings.DefaultConnection, dbLogger);

                // Add Battle to Local Database
                try
                {
                    dbUpdater.SaveBattles(result);
                    logger.LogInformation("Tournament results recorded successfully to local database.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to record tournament results to local database");
                    // Continue execution as this is not a critical failure
                }

                // Load Cats to Local Database
                var nextId = await contractService.GetNextTokenId();
                var getIds = new List<long>();
                var currIds = dbUpdater.GetCatIds();

                for (long i = 1; i < nextId; i++)
                {
                    if (!currIds.Contains(i))
                    {
                        getIds.Add(i);
                    }
                }

                // Fetch and save cat data
                using (var httpClient = new HttpClient())
                {
                    foreach (var id in getIds)
                    {
                        try
                        {
                            // Get the IPFS URI from the contract
                            var tokenUri = await contractService.GetTokenURI(id);
                            
                            // Convert ipfs:// to https://
                            var httpUri = tokenUri.Replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                            
                            // Fetch the JSON metadata
                            var response = await httpClient.GetStringAsync(httpUri);
                            using (JsonDocument document = JsonDocument.Parse(response))
                            {
                                var root = document.RootElement;
                                var name = root.GetProperty("name").GetString();
                                
                                // Save to database
                                dbUpdater.SaveCat(id, name, tokenUri);
                                logger.LogInformation("Saved cat #{CatId}: {Name}", id, name);
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Failed to process cat #{CatId}", id);
                            // Continue with next cat even if one fails
                            continue;
                        }
                    }
                }

            }
            catch (Exception ex)
            {
                var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<Program>();
                logger.LogError(ex, "Fatal error in main program");
                throw;
            }
        }
    }
} 