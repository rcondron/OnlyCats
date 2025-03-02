using System;
using System.Threading.Tasks;
using System.Numerics;
using Nethereum.Web3;
using Nethereum.Contracts;
using Nethereum.ABI.FunctionEncoding.Attributes;
using System.Linq;
using System.Threading;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Hex.HexTypes;
using TournamentApp.Models;
using Nethereum.Contracts.ContractHandlers;
using System.IO;
using Nethereum.JsonRpc.Client;
using Microsoft.Extensions.Logging;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace TournamentApp.Services
{

    public class SmartContractService
    {
        private readonly Web3 _web3;
        private readonly Contract _contract;
        private readonly ILogger _logger;
        private readonly AppConfig _config;

        public Contract Contract => _contract;

        public SmartContractService(Web3 web3, string contractAddress, ILogger logger, AppConfig config)
        {
            _web3 = web3;
            _logger = logger;
            _config = config;

            try
            {
                string abiPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "contract-abi.json");
                if (!File.Exists(abiPath))
                {
                    throw new FileNotFoundException($"ABI file not found at: {abiPath}. Please ensure contract-abi.json exists in the application directory.");
                }

                string abi = File.ReadAllText(abiPath);
                _contract = web3.Eth.GetContract(abi, contractAddress);
                _logger.LogInformation("Contract ABI loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize contract");
                throw;
            }
        }

        private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> action, string operationName)
        {
            for (int i = 0; i < _config.MaxRetries; i++)
            {
                try
                {
                    return await action();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Attempt {i + 1} of {_config.MaxRetries} for {operationName}");

                    if (i == _config.MaxRetries - 1)
                        throw;

                    await Task.Delay(_config.RetryDelayMs * (i + 1)); // Exponential backoff
                }
            }
            throw new Exception($"Failed after {_config.MaxRetries} attempts: {operationName}");
        }

        public async Task<long> GetNextTokenId()
        {
            try
            {
                var nextIdFunction = _contract.GetFunction("nextTokenId");
                var nextId = await nextIdFunction.CallAsync<long>();
                return nextId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting next token ID");
                throw;
            }
        }

        public async Task<string> GetTokenURI(long tokenId)
        {
            try
            {
                var tokenURIFunction = _contract.GetFunction("tokenURI");
                var tokenURI = await tokenURIFunction.CallAsync<string>(tokenId);
                return tokenURI;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting tokenURI");
                throw;
            }
        }

        public async Task<BigInteger> GetCatBalance(long tokenId)
        {
            try
            {
                var balanceFunction = _contract.GetFunction("catBalances");
                var balance = await balanceFunction.CallAsync<BigInteger>(new BigInteger(tokenId));
                _logger.LogInformation($"Cat #{tokenId} balance: {balance}");
                return balance;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting balance for cat #{tokenId}");
                throw;
            }
        }

        public async Task<List<long>> GetCatsByState(int stateNumber)
        {
            try
            {

                var catsFunction = _contract.GetFunction("getCatsByState");
                _logger.LogInformation($"Calling getCatsByState with parameter: {stateNumber}");

                try
                {
                    var result = await catsFunction.CallAsync<List<BigInteger>>(stateNumber);

                    if (result != null && result.Count > 0)
                    {
                        //await _logger.LogAsync($"getCatsByState returned {result.Count} cats");
                        var catIds = result.Select(x => long.Parse(x.ToString())).ToList();
                        _logger.LogInformation($"Cat IDs: [{string.Join(", ", catIds)}]");
                        return catIds;
                    }

                    _logger.LogInformation($"No cats found in state: {stateNumber}", "WARN");
                    return new List<long>();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error calling getCatsByState: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cats by state: {stateNumber}");
                throw;
            }
        }

        public async Task<BigInteger> GetRequiredStake()
        {
            var reqStakeFunction = _contract.GetFunction("reqStake");
            return await reqStakeFunction.CallAsync<BigInteger>();
        }

        public async Task<string> UpdateCatStates(long[] tokenIds, int[] newStates)
        {
            var updateFunction = _contract.GetFunction("updateCatStates");
            return await ExecuteWithRetryAsync(async () =>
            {
                try
                {
                    _logger.LogInformation($"Updating states for {tokenIds.Length} cats");

                    var callerAddress = _web3.TransactionManager.Account.Address;
                    var txInput = updateFunction.CreateTransactionInput(
                        callerAddress,
                        tokenIds,
                        newStates
                    );
                    txInput.Gas = new HexBigInteger(500000);

                    var txHash = await _web3.Eth.TransactionManager.SendTransactionAsync(txInput);
                    _logger.LogInformation($"State update transaction hash: {txHash}");

                    return txHash;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update cat states");
                    throw;
                }
            }, "UpdateCatStates");
        }

        public async Task<string> AddToCatBalances(long[] tokenIds, decimal[] amounts)
        {
            var updateFunction = _contract.GetFunction("addToCatBalances");
            return await ExecuteWithRetryAsync(async () =>
            {
                try
                {
                    if (tokenIds.Length != amounts.Length)
                        throw new ArgumentException($"Token IDs array length ({tokenIds.Length}) does not match amounts array length ({amounts.Length})");

                    // Log current balances and updates
                    for (int i = 0; i < tokenIds.Length; i++)
                    {
                        BigInteger amt = new(amounts[i] * 1e18m);

                        var currentBalance = await GetCatBalance(tokenIds[i]);
                        _logger.LogInformation($"Cat #{tokenIds[i]} - Current balance: {currentBalance}, Update amount: {amounts[i]}, " + $"New balance will be: {currentBalance + amt}");
                    }

                    var callerAddress = _web3.TransactionManager.Account.Address;
                    var txInput = updateFunction.CreateTransactionInput(
                        callerAddress,
                        tokenIds.Select(id => new BigInteger(id)).ToArray(), // Convert to BigInteger for contract call
                        amounts.Select(x => new BigInteger(x * 1e18m)).ToArray()
                    );
                    txInput.Gas = new HexBigInteger(500000);

                    _logger.LogInformation($"Sending balance update transaction with gas: {txInput.Gas.Value}");
                    var txHash = await _web3.Eth.TransactionManager.SendTransactionAsync(txInput);
                    _logger.LogInformation($"Transaction hash: {txHash}");

                    return txHash;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to add to cat balances");
                    throw;
                }
            }, "AddToCatBalances");
        }

        public async Task<string> RecordBattles(TournamentResult result)
        {
            var recordFunction = _contract.GetFunction("recordTournament");
            return await ExecuteWithRetryAsync(async () =>
            {
                try
                {
                    // Convert battles to arrays for contract call
                    var currentDate = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero).ToUnixTimeSeconds();
                    var rounds = result.Battles.Select(b => b.RoundId).ToArray();
                    var winners = result.Battles.Select(b => new BigInteger(b.WinnerId)).ToArray();
                    var losers = result.Battles.Select(b => new BigInteger(b.LoserId)).ToArray();

                    _logger.LogInformation($"Recording {result.Battles.Count} battles");

                    var callerAddress = _web3.TransactionManager.Account.Address;

                    // Estimate gas
                    var gasEstimate = await recordFunction.EstimateGasAsync(
                        callerAddress,
                        null, // Default gas price (you can set this if needed)
                        null, // Default value (for ETH transfer, set it if required)
                        currentDate,
                        rounds,
                        winners,
                        losers,
                        result.ChampId
                    );

                    // Prepare the transaction input
                    var txInput = recordFunction.CreateTransactionInput(
                        callerAddress,
                        gasEstimate,
                        null, // Default gas price
                        null, // Default value
                        currentDate,
                        rounds,
                        winners,
                        losers,
                        result.ChampId
                    );

                    var txHash = await _web3.Eth.TransactionManager.SendTransactionAsync(txInput);
                    _logger.LogInformation($"Battles record transaction hash: {txHash}");

                    return txHash;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to record battles");
                    throw;
                }
            }, "RecordBattles");
        }
    }
}