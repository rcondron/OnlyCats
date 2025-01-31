// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256); 
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract CatFightClubNFT is ERC721URIStorage, Ownable {

    uint256 public reviveAllFee = 100000000000000; // 0.0001 ETH
    uint256 public reqStake = 10000000000000000; // 0.01 MOR
    uint256 public nextTokenId;


    mapping(uint256 => uint256) public catStates;
    mapping(uint256 => uint256) public catBalances;
    mapping(bytes32 => bool) private _mintedTokenURIs;
    mapping(uint256 => Battle[]) public battlesByDate;
    mapping(uint256 => Battle[]) public battlesByCat;
    IERC20 public morToken;

    mapping(uint256 => uint256) public lifetimeRewards;
    mapping(uint256 => uint256) public dailyChampions; // date => tokenId

    struct CatInfo {
        uint256 tokenId;
        string tokenURI;
    }

    struct Battle {
        uint256 date;
        uint256 winnerId;
        uint256 loserId;
    }

    // Events
    event CatMinted(address indexed owner, uint256 tokenId);
    event CatStatesUpdated(uint256[] tokenIds, uint256[] newStates);
    event CatBalanceUpdated(uint256 tokenId, uint256 newBalance);
    event TokensClaimed(address indexed owner, uint256 tokenId, uint256 amount);
    event CatRevived(address indexed owner, uint256 tokenId);
    event BattleRecorded(uint256 indexed date, uint256 winnerId, uint256 loserId);
    event ReviveAllFeeUpdated(uint256 newFee);
    event StakeFeeUpdated(uint256 newFee);

    constructor() ERC721("Only Cats Fight Club", "OCF") Ownable(msg.sender) {
        nextTokenId = 1;
        morToken = IERC20(0xc9E93d0cc08e5D6581bdfdfAf869b37cB89f5c9d);
    }

    // ========================= Minting =========================

    function mintCat(string memory tokenURI, bytes memory signature) external {
        require(verifySignature(tokenURI, signature), "Invalid signature");

        bytes32 tokenURIHash = keccak256(abi.encodePacked(tokenURI));
        require(!_mintedTokenURIs[tokenURIHash], "Already minted");

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        catStates[tokenId] = 0;
        _mintedTokenURIs[tokenURIHash] = true;
        emit CatMinted(msg.sender, tokenId);
    }

    // ========================= State Management =========================

    function updateCatStates(uint256[] memory tokenIds, uint256[] memory newStates) external onlyOwner {
        require(tokenIds.length == newStates.length, "Invalid state length" );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) != address(0), "Token does not exist");

            require(newStates[i] == 0 || newStates[i] == 1, "Invalid state" );
            catStates[tokenId] = newStates[i];
        }

        emit CatStatesUpdated(tokenIds, newStates);
    }

    function getCatState(uint256 tokenId) external view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return catStates[tokenId];
    }

    function getCatsByState(uint256 state) external view returns (uint256[] memory) {

        uint256 count = 0;
        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (catStates[tokenId] == state) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (catStates[tokenId] == state) {
                result[index++] = tokenId;
            }
        }
        
        return result;
    }

    // ========================= Ownership and Balances =========================

    function getCatsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (ownerOf(tokenId) == owner) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (ownerOf(tokenId) == owner) {
                result[index++] = tokenId;
            }
        }
        return result;
    }

    function addToCatBalances(uint256[] memory tokenIds, uint256[] memory amounts) external onlyOwner {
        require(tokenIds.length == amounts.length, "Mismatched input lengths");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) != address(0), "Token does not exist");

            int256 newBalance = int256(catBalances[tokenId]) + int256(amounts[i]);
            lifetimeRewards[tokenId] += amounts[i];
            
            if (newBalance < 0) {
                catBalances[tokenId] = 0; // Ensure balance does not go below zero
            } else {
                catBalances[tokenId] = uint256(newBalance);
            }

            emit CatBalanceUpdated(tokenId, catBalances[tokenId]);
        }
    }

    function claimTokens(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        uint256 amount = catBalances[tokenId];
        require(amount > 0, "No balance");

        require(morToken.transfer(msg.sender, amount), "Transfer failed");
        
        catBalances[tokenId] = 0;
        emit TokensClaimed(msg.sender, tokenId, amount);
    }

    function claimAllTokens(uint256[] memory tokenIds) external {

         uint256 totalAmount = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not token owner");
            uint256 amount = catBalances[tokenId];

            totalAmount += amount;
  
            catBalances[tokenId] = 0;
            emit TokensClaimed(msg.sender, tokenId, amount);
        }

        require(morToken.transfer(msg.sender, totalAmount), "Transfer failed");
    }

    // ========================= Battles =========================

    function recordBattle(uint256 date, uint256 winnerId, uint256 loserId) public onlyOwner {

        require(ownerOf(winnerId) != address(0) && ownerOf(loserId) != address(0), "Invalid token IDs");

        // Record the battle
        Battle memory newBattle = Battle({
            date: date,
            winnerId: winnerId,
            loserId: loserId
        });

        battlesByDate[date].push(newBattle);
        battlesByCat[winnerId].push(newBattle);
        battlesByCat[loserId].push(newBattle);

        emit BattleRecorded(date, winnerId, loserId);
    }

    function recordBattles(uint256[] memory dates, uint256[] memory winnerIds, uint256[] memory loserIds, uint256 champId) external onlyOwner {
        require(
            dates.length == winnerIds.length && 
            winnerIds.length == loserIds.length,
            "Input arrays must be same length"
        );

        for (uint256 i = 0; i < dates.length; i++) {
            recordBattle(dates[i], winnerIds[i], loserIds[i]);
        }

        if (dates.length > 0 && champId > 0) { //set champId to 0 to skip
            recordChampion(dates[0], champId);
        }
    }

    function recordChampion(uint256 date, uint256 tokenId) public onlyOwner {

        require(ownerOf(tokenId) != address(0), "Invalid token ID");
        dailyChampions[date] = tokenId;

    }

    function getBattlesByDate(uint256 date) external view returns (Battle[] memory) {
        return battlesByDate[date];
    }

    function getBattlesByCat(uint256 catId) external view returns (Battle[] memory) {
        return battlesByCat[catId];
    }

    // ========================= Staking and Reviving =========================

    function reviveCat(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(catStates[tokenId] == 0, "Cat is not dead");
        
        require(morToken.transferFrom(msg.sender, address(this), reqStake), "MOR transfer failed");
        catStates[tokenId] = 1;
        
        emit CatRevived(msg.sender, tokenId);
    }

    function reviveAllCats() external payable {
        require(msg.value == reviveAllFee, "Incorrect ETH amount");
        
        uint256[] memory ownedCats = getCatsByOwner(msg.sender);
        require(ownedCats.length > 0, "No cats owned");

        uint256 stakeTotal = 0;
        
        for (uint256 i = 0; i < ownedCats.length; i++) {

            uint256 tokenId = ownedCats[i];

            if (catStates[tokenId] == 0) {

                stakeTotal += reqStake;
                catStates[tokenId] = 1;
        
                emit CatRevived(msg.sender, tokenId);
            }
        }

        require(morToken.transferFrom(msg.sender, address(this), stakeTotal), "MOR transfer failed");
    }

    // ========================= Administrative =========================

    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }

    function updateReviveAllFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be greater than zero");
        reviveAllFee = newFee;
        emit ReviveAllFeeUpdated(newFee);
    }

    function updateStakeFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be greater than zero");
        reqStake = newFee;
        emit StakeFeeUpdated(newFee);
    }

    // ========================= Internal =========================

    function verifySignature(string memory tokenURI, bytes memory signature) internal view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(tokenURI));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address signer = recoverSigner(ethSignedMessageHash, signature);
        return signer == owner();
    }

    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        require(v == 27 || v == 28, "Invalid v value");
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

}
