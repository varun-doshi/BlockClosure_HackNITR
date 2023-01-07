//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;


     modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => address) public buyer;

constructor(address _nftAddress,
        address payable _seller
        ){

        nftAddress = _nftAddress;
        seller = _seller;
    
}

    function list(uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice) public payable onlySeller {


        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        buyer[_nftID] = _buyer;
    }


function finalizeSale(uint256 _nftID) public payable   {

        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }


    receive() external payable{}

    function getBalance() public view returns(uint256){
        return address(this).balance;
    }

}