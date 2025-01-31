using System.Numerics;
using System.Security.Cryptography;

namespace OnlyCatsConsoleApp.Models
{

    public class TournamentResult
    {
        public List<BattleResult> Battles { get; set; }
        public List<long> DeadCats { get; set; }
        public Dictionary<long, decimal> BalanceUpdates { get; set; }
        public decimal GrandPrizePool { get; set; }
        public long ChampId { get; set; }

        public TournamentResult()
        {
            Battles = new List<BattleResult>();
            DeadCats = new List<long>();
            BalanceUpdates = new Dictionary<long, decimal>();
            GrandPrizePool = 0;
            ChampId = 0;
        }
    }

    public class BattleResult
    {
        public long RoundId { get; set; }
        public long WinnerId { get; set; }
        public long LoserId { get; set; }
    }

     public class Tournament
    {
        private readonly Random _random = new();

        public TournamentResult RunTournament(List<long> cats, decimal stake)
        {
            // Initialize balances
            var balances = cats.ToDictionary(cat => cat, cat => 0m);
            var result = new TournamentResult();

            var roundCnt = 0;

            // Run the tournament
            while (cats.Count > 1)
            {
                roundCnt++;
                cats = RunRound(cats, stake, balances, roundCnt, result);
            }

            result.BalanceUpdates = balances;

            // Award the grand prize to the last remaining cat
            var grandWinner = cats[0];
            result.BalanceUpdates[grandWinner] += result.GrandPrizePool;
            result.ChampId = grandWinner;

            return result;
        }

        private List<long> RunRound(List<long> cats, decimal stake, Dictionary<long, decimal> balances, int roundNum, TournamentResult result)
        {
            var nextRoundCats = new List<long>();

            // Shuffle the cats
            cats = cats.OrderBy(_ => _random.Next()).ToList();

            var indexCnt = 0;

            for (int i = 0; i < cats.Count; i += 2)
            {
                if (i + 1 >= cats.Count)
                {
                    // Odd cat out, advances automatically
                    nextRoundCats.Add(cats[i]);
                    continue;
                }

                indexCnt++;

                // Pair up two cats
                var cat1 = cats[i];
                var cat2 = cats[i + 1];

                // Randomly select a winner and loser
                var winner = _random.Next(2) == 0 ? cat1 : cat2;
                var loser = winner == cat1 ? cat2 : cat1;

                // Update balances
                //balances[loser] -= stake;
                balances[winner] += stake / 2;
                result.GrandPrizePool += stake / 2;

                //RoundId = hour (2 digits hour of day) + round (2 digits bracket level) + index (8 digits battle in bracket)
                var rId = DateTime.UtcNow.ToString("yyMMddHH") + roundNum.ToString("D2") + indexCnt.ToString("D8");
                // Record the battle
                result.Battles.Add(new BattleResult
                {
                    RoundId = long.Parse(rId),
                    WinnerId = winner,
                    LoserId = loser
                });

                // Add the winner to the next round
                nextRoundCats.Add(winner);

                // Track dead cats
                result.DeadCats.Add(loser);
            }

            return nextRoundCats;
        }
    }
} 