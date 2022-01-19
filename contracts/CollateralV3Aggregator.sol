// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV2V3Interface.sol";

import "./CollateralManagerV1.sol";

contract CollateralV3Aggregator is AggregatorV2V3Interface {
    uint256 public constant override version = 0;

    uint8 public override decimals = 18;
    int256 public override latestAnswer;
    uint256 public override latestTimestamp;
    uint256 public override latestRound;

    mapping(uint256 => int256) public override getAnswer;
    mapping(uint256 => uint256) public override getTimestamp;
    mapping(uint256 => uint256) private getStartedAt;

    bytes32 reserveId;
    address collateralManager;

    constructor(bytes32 _reserveId, address _collateralManager) {
        require(_reserveId != bytes32(0), "Reserve: empty identifier");
        require(
            _collateralManager != address(0),
            "Manager: is the zero address"
        );

        reserveId = _reserveId;
        collateralManager = _collateralManager;
    }

    function updateAnswer() public {
        int256 _answer = int256(
            CollateralManagerV1(collateralManager).getReserveValue(reserveId)
        );

        require(_answer > 0, "invalid reserve value");

        latestAnswer = _answer;
        latestTimestamp = block.timestamp;
        latestRound++;
        getAnswer[latestRound] = _answer;
        getTimestamp[latestRound] = block.timestamp;
        getStartedAt[latestRound] = block.timestamp;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _roundId,
            getAnswer[_roundId],
            getStartedAt[_roundId],
            getTimestamp[_roundId],
            _roundId
        );
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(latestRound),
            getAnswer[latestRound],
            getStartedAt[latestRound],
            getTimestamp[latestRound],
            uint80(latestRound)
        );
    }

    function description() external pure override returns (string memory) {
        return "fxUSD PoR";
    }
}
