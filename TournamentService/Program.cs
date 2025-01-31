using System;
using System.Threading.Tasks;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using OnlyCatsConsoleApp.Services;
using OnlyCatsConsoleApp.Models;
using Microsoft.Extensions.Configuration;
using Org.BouncyCastle.Math;

namespace OnlyCatsConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            try
            {
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


                var logger = new LoggingService();

                await logger.LogAsync("Starting OnlyCats Daily Tournament");

                // Initialize Web3 with account
                var account = new Account(config.PrivateKey);
                var web3 = new Web3(account, config.RpcUrl);

                // Initialize services
                var contractService = new SmartContractService(web3, config.ContractAddress, logger, config);

                var reqStake = await contractService.GetRequiredStake();
                var cats = await contractService.GetCatsByState(1);

                if (cats.Count < 2)
                {
                    await logger.LogAsync("Not enough cats for tournament.");
                    return;
                }

                var tournament = new Tournament();
                var result = tournament.RunTournament(cats, (decimal)reqStake / 1e18m);

                await logger.LogAsync("Battles:");
                foreach (var battle in result.Battles)
                {
                    await logger.LogAsync($"Winner: {battle.WinnerId}, Loser: {battle.LoserId}");
                }

                await logger.LogAsync("\nBalances:");
                foreach (var kvp in result.BalanceUpdates.OrderBy(kvp => kvp.Key))
                {
                    await logger.LogAsync($"Cat {kvp.Key}: {kvp.Value:F2}");
                }

                await logger.LogAsync($"\nGrand Prize Pool: {result.GrandPrizePool:F2}");

                int[] states = Enumerable.Repeat(0, result.DeadCats.Count).ToArray();
                await contractService.UpdateCatStates(result.DeadCats.ToArray(), states);
                await contractService.AddToCatBalances(result.BalanceUpdates.Keys.ToArray(), result.BalanceUpdates.Values.ToArray());
                await contractService.RecordBattles(result);

            }
            catch (Exception ex)
            {
                var logger = new LoggingService();
                await logger.LogErrorAsync(ex, "Fatal error in main program");
                throw;
            }
        }
    }
} 