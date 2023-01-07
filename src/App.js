import { ethers } from "ethers";
import { useState, useEffect, useRef } from "react";
import Web3Modal from "web3modal";
import "./App.css";
import Footer from "./components/Footer";
import {
  REAL_ESTATE_ADDRESS,
  REAL_ESTATE_ABI,
  ESCROW_ADDRESS,
  ESCROW_ABI,
} from "./constants/constants.js";

import house from "./images/house.png";

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [homes, setHomes] = useState([]);

  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();
    setUserAddress(address);

    if (needSigner) {
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      return (
        <button className="address">
          {" "}
          {userAddress.slice(0, 6) + "..." + userAddress.slice(38, 42)}
        </button>
      );
    } else {
      return (
        <button className="address" onClick={connectWallet}>
          Connect
        </button>
      );
    }
  };

  const getProperties = async () => {
    const provider = await getProviderOrSigner();
    const realEstate = new ethers.Contract(
      REAL_ESTATE_ADDRESS,
      REAL_ESTATE_ABI,
      provider
    );
    const totalSupply = await realEstate.totalSupply();
    const homes = [];
    for (let i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      const response = await fetch(uri);
      const metadata = await response.json();
      homes.push(metadata);
    }
    setHomes(homes);
  };

  const buyHome = async (id) => {
    console.log(id);
    const nftId = homes[id - 1].attributes[0].value.toString();
    // console.log(typeof nftId);
    // console.log(ethers.utils.parseEther(nftId));

    const signer = await getProviderOrSigner(true);
    const contract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

    let tx = await signer.sendTransaction({
      to: ESCROW_ADDRESS,
      value: ethers.utils.parseEther(nftId),
    });
    await tx.wait();
    let txn = contract.finalizeSale(id);
    await txn.wait();

    console.log(`Bought Home:${id}`);
    const price = await contract.purchasePrice(id);
    const pp = ethers.utils.formatEther(price);
    console.log(pp);
  };

  const displayHomes = () => {
    return (
      <div className="cards">
        {homes.map((home, index) => (
          <div className="card" key={index}>
            <div className="card__image">
              <img src={home.image} alt="Home" />
            </div>
            <div className="card__info">
              <p className="description">{home.description}</p>
              <p>
                Address: <strong>{home.address}</strong>
              </p>

              <ul className="home-attr">
                <li>
                  <strong>{home.attributes[2].value}</strong> beds{" "}
                </li>
                <li>
                  <strong>{home.attributes[3].value}</strong> bathrooms{" "}
                </li>
                <li>
                  <strong>{home.attributes[4].value}</strong> sqft
                </li>
              </ul>
              <h4>Price: {home.attributes[0].value} ETH</h4>
            </div>

            <button className="buyBtn" onClick={() => buyHome(index + 1)}>
              BUY
            </button>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      getProperties();

      window.ethereum.on("accountsChanged", connectWallet);
      // setInterval(async function () {
      // }, 5 * 1000);
    }
  }, []);

  return (
    <div className="App">
      <div className="navbar">
        <div className="nav--logo">
          <img src={house} alt="" width={40} className="logo" />
          <span>B</span>lock<span>C</span>losure
        </div>
        <div className="nav--items">
          <ul className="nav--links">
            <li className="nav-link">Buy</li>
            <li className="nav-link">Sell</li>
            <li className="nav-link">{renderButton()}</li>
          </ul>
        </div>
      </div>
      <div>{displayHomes()}</div>
      <Footer />
    </div>
  );
}

export default App;
