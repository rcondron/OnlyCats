// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyLogic is Initializable {
    uint256 private data;

    event DataChanged(uint256 newValue);

    function initialize() public initializer {
        data = 0;
    }

    function setData(uint256 _data) public {
        data = _data;
        emit DataChanged(_data);
    }

    function getData() public view returns (uint256) {
        return data;
    }
}
