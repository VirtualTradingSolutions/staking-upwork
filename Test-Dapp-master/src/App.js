import React, { useState, useEffect } from "react";
import "./App.css";
import {
  chainID,
  StakeAddress,
  Stakeabi,
  TokenAddress,
  Tokenabi,
} from "./helper";
import Web3Modal from "web3modal";
import Web3 from "web3";
import WalletConnectProvider from "@walletconnect/web3-provider";

let web3Modal;
let provider;
let web3;
async function init() {
  console.log("initalzing");
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          56: "https://bsc-dataseed.binance.org/",
        },
        network: "BSC",
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions,
  });
}

function App() {
  const [Hello, setHello] = useState({});
  const [address, setaddress] = useState(
    "0x0000000000000000000000000000000000000000"
  );
  const [chainid, setchainId] = useState(0);
  const [Total_supply, setTotal_supply] = useState(0);
  const [Token, setToken] = useState({});
  const [userInfo, setuserInfo] = useState({});
  const [active, setactive] = useState(false);
  const [val1, setval1] = useState(0);
  const [val2, setval2] = useState(0);
  const [stk, setstk] = useState(0);
  const [unstk, setunstk] = useState(0);
  const [hide, sethide] = useState(false);

  const [minAmount, setminAmount] = useState(0);
  const [canClaim, setcanClaim] = useState(0);
  const [apr, setapr] = useState(0);
  const [day, setday] = useState(0);
  const [totalStake, settotalStake] = useState(0);

  useEffect(() => {
    if (active) {
      async function fet() {
        await init();
        await loadBlockdata();
      }
      fet();
    }
  }, [active]);

  const loadBlockdata = async () => {
    try {
      provider = await web3Modal.connect();
    } catch (e) {
      console.log("Could not get a wallet connection", e);
      return;
    }
    web3 = new Web3(provider);

    loadBlockdat();
  };
  const loadBlockdat = async () => {
    console.log("Web3 instance is", web3);
    let chain;
    await web3.eth.getChainId().then((values) => {
      setchainId(values);
      chain = values;
    });
    if (chain === chainID) {
      console.log("yes");
      const accounts = await new web3.eth.getAccounts();
      console.log(accounts[0]);
      setaddress(accounts[0]);
      const Hell = new web3.eth.Contract(Stakeabi, StakeAddress);
      setHello(Hell);
      const token = new web3.eth.Contract(Tokenabi, TokenAddress);
      setToken(token);

      const endblock = await Hell.methods.rewardEndBlock().call();

      const startblock = await Hell.methods.startBlock().call();

      const reward = await Hell.methods.pendingReward(accounts[0]).call();
      setcanClaim(reward);

      const minamount = await Hell.methods.minStakingAmount().call();
      setminAmount(parseInt(minamount / 1e18));

      const totalstake = await Hell.methods.totalStake().call();
      settotalStake(parseFloat(totalstake / 1e18).toFixed(2));

      const mintime_ = await Hell.methods.mintime().call();
      let time_ = Math.floor(mintime_ / (24 * 60 * 60));
      setday(time_);

      const rewardperblock = await Hell.methods.rewardPerBlock().call();

      let total_value_of_reward_token = parseFloat(
        rewardperblock / 1e18
      ).toFixed(2);
      total_value_of_reward_token =
        total_value_of_reward_token * (endblock - startblock);

      const stakeamount = await Hell.methods.totalStake().call();

      let apr_ =
        total_value_of_reward_token / parseFloat(stakeamount / 1e18).toFixed(2);
      setapr(parseFloat(apr_ * 100).toFixed(2));
      console.log(
        apr_ * 100,
        total_value_of_reward_token,
        stakeamount,
        rewardperblock
      );
      const userinfo = await Hell.methods.userInfo(accounts[0]).call();
      setuserInfo(userinfo);
      console.log(userinfo.amount / 1e18);

      const allow = await token.methods
        .allowance(accounts[0], StakeAddress)
        .call();
      if (allow > 1000000000000000000000000000000000) sethide(true);
      const bal = await token.methods.balanceOf(accounts[0]).call();
      console.log(bal / 1e18);
      setTotal_supply(parseFloat(bal / 1e18));
    } else {
      setactive(false);
      alert("Connect to Bsc Mainnet");
    }
    return;
  };

  setInterval(async () => {
    if (
      Hello.methods !== undefined &&
      address !== "0x0000000000000000000000000000000000000000"
    ) {
      const reward = await Hello.methods.pendingReward(address).call();
      setcanClaim(reward);

      const userinfo = await Hello.methods.userInfo(address).call();
      setuserInfo(userinfo);

      const totalstake = await Hello.methods.totalStake().call();
      settotalStake(parseFloat(totalstake / 1e18).toFixed(2));
    }
  }, 10000);

  const unStake1 = async (amount) => {
    amount = amount * 1000000000;
    amount = amount + "000000000";
    try {
      await Hello.methods
        .withdraw(amount)
        .send({ from: address, gasLimit: 200000 })
        .on("transactionHash", (hash) => {
          loadBlockdat();
        });
    } catch (err) {
      console.log("tx rejected");
    }
  };

  const Approve = async (amount) => {
    let allow;
    let userallowance;
    let num = parseFloat(amount);
    if (num >= minAmount) {
      amount = amount + "000000000000000000";
      allow = amount;
      console.log("clicked", amount);
      await Token.methods
        .allowance(address, StakeAddress)
        .call()
        .then((val) => {
          userallowance = val;
        });
      try {
        if (allow > userallowance) {
          allow = allow + "000000000000000000";
          await Token.methods
            .approve(StakeAddress, allow)
            .send({ from: address })
            .on("transactionHash", (hash) => {
              sethide(true);
            });
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      alert(`Minimum staking amount is ${minAmount} $TEST`);
    }
  };

  const Stake1 = async (amount) => {
    amount = amount * 1000000000;
    if (amount >= minAmount) {
      amount = amount + "000000000";
      console.log("clicked", amount);
      try {
        Hello.methods
          .deposit(amount)
          .send({ from: address, gasLimit: 200000 })
          .on("transactionHash", (hash) => {
            loadBlockdat();
          });
      } catch (err) {
        console.log(err);
      }
    } else {
      alert(`Minimum staking amount is ${minAmount} $TEST`);
    }
  };

  const claim_t = async () => {
    try {
      await Hello.methods
        .claimReward()
        .send({ from: address })
        .on("transactionHash", (hash) => {
          loadBlockdat();
        });
    } catch (err) {
      console.log("tx rejected");
      return;
    }
  };

  return (
    <div className="App">
      <div className="header">
        <img
          className="back1"
          alt="logo"
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjEiIGhlaWdodD0iNDkiIHZpZXdCb3g9IjAgMCA2MSA0OSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTU5LjUyODIgNDQuMzAzOEM1OS4wODUzIDQ0LjEwOTcgNTguNTk1NyA0NC4wNDgyIDU4LjExODUgNDQuMTI2Nkw1MS4zMDAzIDBIOS4zNDUwOEwzLjAwNTY5IDQ0LjA5MTFDMi41MjY5MSA0My45ODQgMi4wMjcxIDQ0LjAyMSAxLjU2OTM1IDQ0LjE5NzVDMS4wMzQ2NyA0NC40MDU5IDAuNTg5NTA5IDQ0Ljc5NDIgMC4zMTA2MzUgNDUuMjk1NEMwLjAzMTc2MTcgNDUuNzk2NyAtMC4wNjMzNDI5IDQ2LjM3OTUgMC4wNDE3MjI0IDQ2Ljk0MzRDMC4xNDY3ODggNDcuNTA3MiAwLjQ0NTQzNyA0OC4wMTY4IDAuODg2MTY3IDQ4LjM4NDFDMS4zMjY5IDQ4Ljc1MTUgMS44ODIwOCA0OC45NTM2IDIuNDU1OTggNDguOTU1N0MyLjkzMzg0IDQ4Ljk1NjEgMy40MDE0NCA0OC44MTcxIDMuODAxNDUgNDguNTU1OEM0LjIwMTQ2IDQ4LjI5NDYgNC41MTY1MiA0Ny45MjI0IDQuNzA4MDEgNDcuNDg0OEM0Ljk2NDc4IDQ2LjkwNzUgNC45ODcxOCA0Ni4yNTMyIDQuNzcwNDkgNDUuNjU5N0M0LjU1MzgxIDQ1LjA2NjMgNC4xMTQ5NyA0NC41ODAxIDMuNTQ2NTMgNDQuMzAzOEwxOS45NjY5IDE4LjcxMzlMMjkuNzE5OCAzNS4yMzA0SDI5LjYzMTFDMjkuMDkyNiAzNS40MzQ1IDI4LjY0MyAzNS44MjEyIDI4LjM2MDggMzYuMzIzQzI4LjA3ODYgMzYuODI0OCAyNy45ODE5IDM3LjQwOTcgMjguMDg3NiAzNy45NzU1QzI4LjE5MzIgMzguNTQxMyAyOC40OTQ1IDM5LjA1MjEgMjguOTM4NyAzOS40MTg0QzI5LjM4MjkgMzkuNzg0OCAyOS45NDE4IDM5Ljk4MzUgMzAuNTE3NyAzOS45Nzk3QzMwLjgyMDMgMzkuOTc4NCAzMS4xMjAzIDM5LjkyNDQgMzEuNDA0NCAzOS44MjAzQzMxLjcwNjcgMzkuNzAzNyAzMS45ODI5IDM5LjUyODUgMzIuMjE3MSAzOS4zMDQ4QzMyLjQ1MTQgMzkuMDgxMSAzMi42MzkgMzguODEzMyAzMi43NjkyIDM4LjUxNjdDMzIuODk5NSAzOC4yMjAyIDMyLjk2OTcgMzcuOTAwOSAzMi45NzU5IDM3LjU3NzJDMzIuOTgyIDM3LjI1MzQgMzIuOTI0MSAzNi45MzE2IDMyLjgwNTMgMzYuNjMwNEMzMi42OTE0IDM2LjMyOTIgMzIuNTE4MiAzNi4wNTQgMzIuMjk1OCAzNS44MjExQzMyLjA3MzQgMzUuNTg4MiAzMS44MDY1IDM1LjQwMjQgMzEuNTEwOCAzNS4yNzQ3TDMxLjMxNTcgMzUuMjEyN0w0MS4wNDIgMTguNTE5TDU3LjU3NzYgNDQuMzAzOEM1Ny4wNzU4IDQ0LjUzNjMgNTYuNjY2NyA0NC45MzA4IDU2LjQxNjQgNDUuNDIzOEM1Ni4xNjYgNDUuOTE2OCA1Ni4wODg5IDQ2LjQ3OTYgNTYuMTk3NCA0Ny4wMjE3QzU2LjMwNTkgNDcuNTYzOCA1Ni41OTM3IDQ4LjA1MzcgNTcuMDE0NSA0OC40MTI1QzU3LjQzNTMgNDguNzcxMyA1Ny45NjQ3IDQ4Ljk3ODMgNTguNTE3NSA0OUM1OC44MjA3IDQ4Ljk5NzMgNTkuMTIxIDQ4Ljk0MDMgNTkuNDA0MSA0OC44MzE2QzU5LjcwNjIgNDguNzE0OCA1OS45ODIyIDQ4LjUzOTcgNjAuMjE2NSA0OC4zMTYyQzYwLjQ1MDggNDguMDkyNyA2MC42Mzg3IDQ3LjgyNTIgNjAuNzY5NSA0Ny41MjkxQzYxLjAyNzUgNDYuOTM2MyA2MS4wNDE5IDQ2LjI2NTggNjAuODA5NyA0NS42NjI0QzYwLjU3NzUgNDUuMDU5MSA2MC4xMTcyIDQ0LjU3MTEgNTkuNTI4MiA0NC4zMDM4Wk00OS45NzkyIDEuMDQ1NTdMNDAuOTk3NyAxNi41NjA4TDMxLjAzMiAxLjAzNjcxTDQ5Ljk3OTIgMS4wNDU1N1pNMjAuMDAyMyAxNi43NzM0TDEwLjYzOTYgMS4wMTg5OUgzMC4xNDU0TDIwLjAwMjMgMTYuNzczNFpNMy4wNDExNSA0NS4xODk5QzMuMjE1MDcgNDUuMjY0OSAzLjM3MjMyIDQ1LjM3MzcgMy41MDM3MyA0NS41MUMzLjYzNTE1IDQ1LjY0NjMgMy43MzgxIDQ1LjgwNzQgMy44MDY1OSA0NS45ODM5QzMuODc1MDggNDYuMTYwNCAzLjkwNzc0IDQ2LjM0ODcgMy45MDI2NyA0Ni41MzhDMy44OTc2IDQ2LjcyNzIgMy44NTQ5IDQ2LjkxMzUgMy43NzcwNSA0Ny4wODYxQzMuNzAzNTcgNDcuMjYxNCAzLjU5NTk2IDQ3LjQyMDUgMy40NjA0NyA0Ny41NTM5QzMuMzI0OTggNDcuNjg3NCAzLjE2NDMgNDcuNzkyNiAyLjk4Nzc4IDQ3Ljg2MzVDMi44MTEyNiA0Ny45MzQ0IDIuNjIyNCA0Ny45Njk2IDIuNDMyMTggNDcuOTY2OUMyLjI0MTk1IDQ3Ljk2NDMgMi4wNTQxNSA0Ny45MjM5IDEuODc5NjcgNDcuODQ4MUMxLjUzMTA3IDQ3LjY5MiAxLjI1NzQgNDcuNDA1OCAxLjExNzE3IDQ3LjA1MDZDMS4wNDg1NyA0Ni44NzQ0IDEuMDE1NDkgNDYuNjg2MyAxLjAxOTgzIDQ2LjQ5NzNDMS4wMjQxOCA0Ni4zMDgyIDEuMDY1ODYgNDYuMTIxOSAxLjE0MjQ4IDQ1Ljk0OUMxLjIxOTEgNDUuNzc2MSAxLjMyOTE1IDQ1LjYyIDEuNDY2MzIgNDUuNDg5N0MxLjYwMzQ4IDQ1LjM1OTUgMS43NjUwNCA0NS4yNTc2IDEuOTQxNzMgNDUuMTg5OUMyLjEwNDkzIDQ1LjEyMzQgMi4yNzk3NyA0NS4wOTAzIDIuNDU1OTggNDUuMDkyNEMyLjU5MTUgNDUuMDkwNyAyLjcyNjM2IDQ1LjExMTcgMi44NTQ5NiA0NS4xNTQ0VjQ1LjM2NzFMMi45NDM2MiA0NS4xODk5SDMuMDQxMTVaTTQuNDk1MjIgNDAuODQ4MUwxMC4wODEgMi4wMTEzOUwxOS4zOTA2IDE3LjcyMTVMNC40OTUyMiA0MC44NDgxWk0zMC4wNzQ0IDMuMDIxNTJWMzMuNzQxOEwyMC41ODc1IDE3LjcyMTVMMzAuMDc0NCAzLjAyMTUyWk0zMS45MTg2IDM3LjAyOTFDMzIuMDU0NyAzNy4zODUyIDMyLjA0NDQgMzcuNzgwNyAzMS44OSAzOC4xMjkzQzMxLjczNTUgMzguNDc3OCAzMS40NDk0IDM4Ljc1MTMgMzEuMDk0MSAzOC44ODk5QzMwLjc1MjYgMzguOTgxIDMwLjM4OTUgMzguOTQzMSAzMC4wNzQzIDM4Ljc4MzRDMjkuNzU5MSAzOC42MjM4IDI5LjUxMzggMzguMzUzNiAyOS4zODU0IDM4LjAyNDZDMjkuMjU3IDM3LjY5NTUgMjkuMjU0NSAzNy4zMzA3IDI5LjM3ODMgMzYuOTk5OUMyOS41MDIyIDM2LjY2OTIgMjkuNzQzNyAzNi4zOTU2IDMwLjA1NjcgMzYuMjMxNkMzMC40MTMxIDM2LjA5NTYgMzAuODA4OCAzNi4xMDU5IDMxLjE1NzYgMzYuMjYwM0MzMS41MDYzIDM2LjQxNDcgMzEuNzc5OSAzNi43MDA2IDMxLjkxODYgMzcuMDU1N1YzNy4wMjkxWk0zMS4wNzYzIDMzLjY3MDlWMi45OTQ5NEw0MC40MDM3IDE3LjUyNjZMMzEuMDc2MyAzMy42NzA5Wk00MS42MTgzIDE3LjUyNjZMNTAuNTgyMSAyLjA0Njg0TDU2LjU3NTcgNDAuODIxNUw0MS42MTgzIDE3LjUyNjZaTTU5Ljg1NjMgNDcuMTEyN0M1OS43NDMzIDQ3LjM3NDcgNTkuNTU0NyA0Ny41OTcyIDU5LjMxNDcgNDcuNzUxNkM1OS4wNzQ2IDQ3LjkwNjEgNTguNzkzOSA0Ny45ODU1IDU4LjUwODQgNDcuOTc5OEM1OC4yMjMgNDcuOTc0MSA1Ny45NDU3IDQ3Ljg4MzUgNTcuNzEyIDQ3LjcxOTZDNTcuNDc4MyA0Ny41NTU3IDU3LjI5ODggNDcuMzI1OSA1Ny4xOTY0IDQ3LjA1OTVDNTcuMDU3IDQ2LjcwMzQgNTcuMDY0NyA0Ni4zMDY3IDU3LjIxNzYgNDUuOTU2MkM1Ny4zNzA1IDQ1LjYwNTcgNTcuNjU2MiA0NS4zMzAyIDU4LjAxMjEgNDUuMTg5OUg1OC4xNDUxTDU4LjMyMjQgNDUuNDY0Nkw1OC4yNjkyIDQ1LjE1NDRDNTguNTI3MyA0NS4xMDQgNTguNzk0MyA0NS4xMjU0IDU5LjA0MSA0NS4yMTYzQzU5LjI4NzggNDUuMzA3MSA1OS41MDQ5IDQ1LjQ2MzkgNTkuNjY4NiA0NS42Njk2QzU5LjgzMjMgNDUuODc1MiA1OS45MzY0IDQ2LjEyMTkgNTkuOTY5NSA0Ni4zODI2QzYwLjAwMjYgNDYuNjQzMyA1OS45NjM0IDQ2LjkwODEgNTkuODU2MyA0Ny4xNDgxVjQ3LjExMjdaIiBmaWxsPSIjREFCNjc5Ii8+Cjwvc3ZnPgo="
          style={{ marginTop: "29px", width: "8%", height: "8%" }}
        />
        <div className="mid">
          <p style={{ color: "white", backgroundColor: "#1f6e85" }}>
            TEST STAKING DAPP
          </p>
        </div>
        <div className="wallet1">
          <button onClick={() => setactive(true)} className="wallet">
            {chainid === chainID ? "CONNECTED" : "CONNECT WALLET"}
          </button>
        </div>
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "55px" }}
      >
        <div className="new_middle">
          <span style={{ marginTop: "25px" }}>
            <div style={{ display: "flex", justifyContent: "left" }}>
              <img
                className="i1"
                alt="logo"
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjEiIGhlaWdodD0iNDkiIHZpZXdCb3g9IjAgMCA2MSA0OSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTU5LjUyODIgNDQuMzAzOEM1OS4wODUzIDQ0LjEwOTcgNTguNTk1NyA0NC4wNDgyIDU4LjExODUgNDQuMTI2Nkw1MS4zMDAzIDBIOS4zNDUwOEwzLjAwNTY5IDQ0LjA5MTFDMi41MjY5MSA0My45ODQgMi4wMjcxIDQ0LjAyMSAxLjU2OTM1IDQ0LjE5NzVDMS4wMzQ2NyA0NC40MDU5IDAuNTg5NTA5IDQ0Ljc5NDIgMC4zMTA2MzUgNDUuMjk1NEMwLjAzMTc2MTcgNDUuNzk2NyAtMC4wNjMzNDI5IDQ2LjM3OTUgMC4wNDE3MjI0IDQ2Ljk0MzRDMC4xNDY3ODggNDcuNTA3MiAwLjQ0NTQzNyA0OC4wMTY4IDAuODg2MTY3IDQ4LjM4NDFDMS4zMjY5IDQ4Ljc1MTUgMS44ODIwOCA0OC45NTM2IDIuNDU1OTggNDguOTU1N0MyLjkzMzg0IDQ4Ljk1NjEgMy40MDE0NCA0OC44MTcxIDMuODAxNDUgNDguNTU1OEM0LjIwMTQ2IDQ4LjI5NDYgNC41MTY1MiA0Ny45MjI0IDQuNzA4MDEgNDcuNDg0OEM0Ljk2NDc4IDQ2LjkwNzUgNC45ODcxOCA0Ni4yNTMyIDQuNzcwNDkgNDUuNjU5N0M0LjU1MzgxIDQ1LjA2NjMgNC4xMTQ5NyA0NC41ODAxIDMuNTQ2NTMgNDQuMzAzOEwxOS45NjY5IDE4LjcxMzlMMjkuNzE5OCAzNS4yMzA0SDI5LjYzMTFDMjkuMDkyNiAzNS40MzQ1IDI4LjY0MyAzNS44MjEyIDI4LjM2MDggMzYuMzIzQzI4LjA3ODYgMzYuODI0OCAyNy45ODE5IDM3LjQwOTcgMjguMDg3NiAzNy45NzU1QzI4LjE5MzIgMzguNTQxMyAyOC40OTQ1IDM5LjA1MjEgMjguOTM4NyAzOS40MTg0QzI5LjM4MjkgMzkuNzg0OCAyOS45NDE4IDM5Ljk4MzUgMzAuNTE3NyAzOS45Nzk3QzMwLjgyMDMgMzkuOTc4NCAzMS4xMjAzIDM5LjkyNDQgMzEuNDA0NCAzOS44MjAzQzMxLjcwNjcgMzkuNzAzNyAzMS45ODI5IDM5LjUyODUgMzIuMjE3MSAzOS4zMDQ4QzMyLjQ1MTQgMzkuMDgxMSAzMi42MzkgMzguODEzMyAzMi43NjkyIDM4LjUxNjdDMzIuODk5NSAzOC4yMjAyIDMyLjk2OTcgMzcuOTAwOSAzMi45NzU5IDM3LjU3NzJDMzIuOTgyIDM3LjI1MzQgMzIuOTI0MSAzNi45MzE2IDMyLjgwNTMgMzYuNjMwNEMzMi42OTE0IDM2LjMyOTIgMzIuNTE4MiAzNi4wNTQgMzIuMjk1OCAzNS44MjExQzMyLjA3MzQgMzUuNTg4MiAzMS44MDY1IDM1LjQwMjQgMzEuNTEwOCAzNS4yNzQ3TDMxLjMxNTcgMzUuMjEyN0w0MS4wNDIgMTguNTE5TDU3LjU3NzYgNDQuMzAzOEM1Ny4wNzU4IDQ0LjUzNjMgNTYuNjY2NyA0NC45MzA4IDU2LjQxNjQgNDUuNDIzOEM1Ni4xNjYgNDUuOTE2OCA1Ni4wODg5IDQ2LjQ3OTYgNTYuMTk3NCA0Ny4wMjE3QzU2LjMwNTkgNDcuNTYzOCA1Ni41OTM3IDQ4LjA1MzcgNTcuMDE0NSA0OC40MTI1QzU3LjQzNTMgNDguNzcxMyA1Ny45NjQ3IDQ4Ljk3ODMgNTguNTE3NSA0OUM1OC44MjA3IDQ4Ljk5NzMgNTkuMTIxIDQ4Ljk0MDMgNTkuNDA0MSA0OC44MzE2QzU5LjcwNjIgNDguNzE0OCA1OS45ODIyIDQ4LjUzOTcgNjAuMjE2NSA0OC4zMTYyQzYwLjQ1MDggNDguMDkyNyA2MC42Mzg3IDQ3LjgyNTIgNjAuNzY5NSA0Ny41MjkxQzYxLjAyNzUgNDYuOTM2MyA2MS4wNDE5IDQ2LjI2NTggNjAuODA5NyA0NS42NjI0QzYwLjU3NzUgNDUuMDU5MSA2MC4xMTcyIDQ0LjU3MTEgNTkuNTI4MiA0NC4zMDM4Wk00OS45NzkyIDEuMDQ1NTdMNDAuOTk3NyAxNi41NjA4TDMxLjAzMiAxLjAzNjcxTDQ5Ljk3OTIgMS4wNDU1N1pNMjAuMDAyMyAxNi43NzM0TDEwLjYzOTYgMS4wMTg5OUgzMC4xNDU0TDIwLjAwMjMgMTYuNzczNFpNMy4wNDExNSA0NS4xODk5QzMuMjE1MDcgNDUuMjY0OSAzLjM3MjMyIDQ1LjM3MzcgMy41MDM3MyA0NS41MUMzLjYzNTE1IDQ1LjY0NjMgMy43MzgxIDQ1LjgwNzQgMy44MDY1OSA0NS45ODM5QzMuODc1MDggNDYuMTYwNCAzLjkwNzc0IDQ2LjM0ODcgMy45MDI2NyA0Ni41MzhDMy44OTc2IDQ2LjcyNzIgMy44NTQ5IDQ2LjkxMzUgMy43NzcwNSA0Ny4wODYxQzMuNzAzNTcgNDcuMjYxNCAzLjU5NTk2IDQ3LjQyMDUgMy40NjA0NyA0Ny41NTM5QzMuMzI0OTggNDcuNjg3NCAzLjE2NDMgNDcuNzkyNiAyLjk4Nzc4IDQ3Ljg2MzVDMi44MTEyNiA0Ny45MzQ0IDIuNjIyNCA0Ny45Njk2IDIuNDMyMTggNDcuOTY2OUMyLjI0MTk1IDQ3Ljk2NDMgMi4wNTQxNSA0Ny45MjM5IDEuODc5NjcgNDcuODQ4MUMxLjUzMTA3IDQ3LjY5MiAxLjI1NzQgNDcuNDA1OCAxLjExNzE3IDQ3LjA1MDZDMS4wNDg1NyA0Ni44NzQ0IDEuMDE1NDkgNDYuNjg2MyAxLjAxOTgzIDQ2LjQ5NzNDMS4wMjQxOCA0Ni4zMDgyIDEuMDY1ODYgNDYuMTIxOSAxLjE0MjQ4IDQ1Ljk0OUMxLjIxOTEgNDUuNzc2MSAxLjMyOTE1IDQ1LjYyIDEuNDY2MzIgNDUuNDg5N0MxLjYwMzQ4IDQ1LjM1OTUgMS43NjUwNCA0NS4yNTc2IDEuOTQxNzMgNDUuMTg5OUMyLjEwNDkzIDQ1LjEyMzQgMi4yNzk3NyA0NS4wOTAzIDIuNDU1OTggNDUuMDkyNEMyLjU5MTUgNDUuMDkwNyAyLjcyNjM2IDQ1LjExMTcgMi44NTQ5NiA0NS4xNTQ0VjQ1LjM2NzFMMi45NDM2MiA0NS4xODk5SDMuMDQxMTVaTTQuNDk1MjIgNDAuODQ4MUwxMC4wODEgMi4wMTEzOUwxOS4zOTA2IDE3LjcyMTVMNC40OTUyMiA0MC44NDgxWk0zMC4wNzQ0IDMuMDIxNTJWMzMuNzQxOEwyMC41ODc1IDE3LjcyMTVMMzAuMDc0NCAzLjAyMTUyWk0zMS45MTg2IDM3LjAyOTFDMzIuMDU0NyAzNy4zODUyIDMyLjA0NDQgMzcuNzgwNyAzMS44OSAzOC4xMjkzQzMxLjczNTUgMzguNDc3OCAzMS40NDk0IDM4Ljc1MTMgMzEuMDk0MSAzOC44ODk5QzMwLjc1MjYgMzguOTgxIDMwLjM4OTUgMzguOTQzMSAzMC4wNzQzIDM4Ljc4MzRDMjkuNzU5MSAzOC42MjM4IDI5LjUxMzggMzguMzUzNiAyOS4zODU0IDM4LjAyNDZDMjkuMjU3IDM3LjY5NTUgMjkuMjU0NSAzNy4zMzA3IDI5LjM3ODMgMzYuOTk5OUMyOS41MDIyIDM2LjY2OTIgMjkuNzQzNyAzNi4zOTU2IDMwLjA1NjcgMzYuMjMxNkMzMC40MTMxIDM2LjA5NTYgMzAuODA4OCAzNi4xMDU5IDMxLjE1NzYgMzYuMjYwM0MzMS41MDYzIDM2LjQxNDcgMzEuNzc5OSAzNi43MDA2IDMxLjkxODYgMzcuMDU1N1YzNy4wMjkxWk0zMS4wNzYzIDMzLjY3MDlWMi45OTQ5NEw0MC40MDM3IDE3LjUyNjZMMzEuMDc2MyAzMy42NzA5Wk00MS42MTgzIDE3LjUyNjZMNTAuNTgyMSAyLjA0Njg0TDU2LjU3NTcgNDAuODIxNUw0MS42MTgzIDE3LjUyNjZaTTU5Ljg1NjMgNDcuMTEyN0M1OS43NDMzIDQ3LjM3NDcgNTkuNTU0NyA0Ny41OTcyIDU5LjMxNDcgNDcuNzUxNkM1OS4wNzQ2IDQ3LjkwNjEgNTguNzkzOSA0Ny45ODU1IDU4LjUwODQgNDcuOTc5OEM1OC4yMjMgNDcuOTc0MSA1Ny45NDU3IDQ3Ljg4MzUgNTcuNzEyIDQ3LjcxOTZDNTcuNDc4MyA0Ny41NTU3IDU3LjI5ODggNDcuMzI1OSA1Ny4xOTY0IDQ3LjA1OTVDNTcuMDU3IDQ2LjcwMzQgNTcuMDY0NyA0Ni4zMDY3IDU3LjIxNzYgNDUuOTU2MkM1Ny4zNzA1IDQ1LjYwNTcgNTcuNjU2MiA0NS4zMzAyIDU4LjAxMjEgNDUuMTg5OUg1OC4xNDUxTDU4LjMyMjQgNDUuNDY0Nkw1OC4yNjkyIDQ1LjE1NDRDNTguNTI3MyA0NS4xMDQgNTguNzk0MyA0NS4xMjU0IDU5LjA0MSA0NS4yMTYzQzU5LjI4NzggNDUuMzA3MSA1OS41MDQ5IDQ1LjQ2MzkgNTkuNjY4NiA0NS42Njk2QzU5LjgzMjMgNDUuODc1MiA1OS45MzY0IDQ2LjEyMTkgNTkuOTY5NSA0Ni4zODI2QzYwLjAwMjYgNDYuNjQzMyA1OS45NjM0IDQ2LjkwODEgNTkuODU2MyA0Ny4xNDgxVjQ3LjExMjdaIiBmaWxsPSIjREFCNjc5Ii8+Cjwvc3ZnPgo="
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "right",
              }}
            >
              <span
                style={{
                  margin: "0",
                  justifyContent: "right",
                  marginRight: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "right",
                    borderRadius: "10px",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    margin: "0 4px",
                  }}
                >
                  <p
                    style={{
                      margin: "9px 6px",
                      alignItems: "center",
                      marginTop: "11.5px",
                      letterSpacing: "1px",
                    }}
                  >
                    CORE
                  </p>
                </div>
              </span>
              <p
                style={{
                  fontSize: "large",
                  fontWeight: "650",
                  margin: "auto 4px",
                }}
              >
                $TEST
              </p>
            </div>
          </span>
          <span>
            <p>APR</p>
            <p>{apr}%</p>
          </span>
          <span>
            <p>Earn</p>
            <p>$TEST</p>
          </span>
          <span>
            <p>Min Deposit</p>
            <p>{minAmount} $TEST</p>
          </span>
          <span>
            <p>Min Lockup</p>
            <p>{day} Days</p>
          </span>
          <span>
            <p>User Staked</p>
            <p>{parseFloat(userInfo.amount / 1e18).toFixed(2)} $TEST</p>
          </span>
          <span>
            <p>Total Staked</p>
            <p>{totalStake} $TEST</p>
          </span>

          <span>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "0",
                textAlign: "left",
              }}
            >
              <p>Pending Reward:</p>
              <p style={{ display: "flex", flexWrap: "wrap" }}>
                <span style={{ margin: "0", marginRight: "4px" }}>
                  {parseFloat(canClaim / 1e18).toFixed(2)}{" "}
                </span>{" "}
                $TEST
              </p>
            </span>
            <span style={{ margin: "0" }}>
              <button
                className="new_button"
                onClick={() => {
                  claim_t();
                }}
              >
                Claim
              </button>
            </span>
          </span>

          <span style={{ marginBottom: "10px" }}>
            <span
              style={{ margin: "0", display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  margin: "0",
                  display: "flex",
                  flexDirection: "row",
                  marginRight: "10px",
                }}
              >
                <input
                  type="number"
                  value={stk === 0 ? null : stk}
                  placeholder="Enter Amount"
                  onChange={(event) => {
                    setstk(event.target.value);
                    setval1(event.target.value);
                  }}
                />
                <span
                  onClick={() => {
                    setval1(Total_supply);
                    setstk(Total_supply);
                  }}
                  className="max"
                >
                  MAX
                </span>
              </div>
            </span>

            <span
              style={{ margin: "0", display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginLeft: "10px",
                  margin: "0",
                }}
              >
                <input
                  value={unstk === 0 ? null : unstk}
                  type="number"
                  placeholder="Enter Amount"
                  onChange={(event) => {
                    setunstk(event.target.value);
                    setval2(event.target.value);
                  }}
                />
                <span
                  onClick={() => {
                    setval2(userInfo.amount / 1e18);
                    setunstk(userInfo.amount / 1e18);
                  }}
                  className="max"
                >
                  MAX
                </span>
              </div>
            </span>
          </span>

          <span className="change" style={{ marginBottom: "25px" }}>
            <button
              className="new_button"
              onClick={() => {
                // console.log(pool_1)
                if (hide) {
                  Stake1(val1);
                } else {
                  Approve(val1);
                }
              }}
            >
              {hide ? "Stake" : "Approve"}
            </button>

            <button
              className="new_button"
              onClick={() => {
                unStake1(val2);
              }}
            >
              Unstake
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
