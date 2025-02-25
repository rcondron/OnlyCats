import { WARRIOR_CATS_ADDRESS, MOR_TOKEN_ADDRESS } from '@/lib/constants';
import { warriorCatsABI } from '@/lib/contracts/warriorCatsABI';

export const getCatDataRequests = (tokenId: BigInt) => [
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'tokenURI',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getCatState',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'catBalances',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'lifetimeRewards',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'getBattlesByCat',
        args: [tokenId],
      },
      {
        address: WARRIOR_CATS_ADDRESS,
        abi: warriorCatsABI,
        functionName: 'champsByCat',
        args: [tokenId],
      }
]