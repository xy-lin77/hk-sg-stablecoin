"use client";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { ADDR } from "@/lib/addresses";
import { ABI } from "@/lib/abis";
import PixelChart from "@/components/PixelChart";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");

  const [hkdcBal, setHkdcBal] = useState("0");
  const [sgdcBal, setSgdcBal] = useState("0");

  const [side, setSide] = useState("HKDC_TO_SGDC");
  const [amt, setAmt] = useState("");

  // KYC state
  const [kycVerified, setKycVerified] = useState(false);

  // Real-time clock
  const [now, setNow] = useState(Date.now());
  
  // Exchange rate data for chart
  const [exchangeRateData, setExchangeRateData] = useState([]);

  // ---- New: Pay (transfer) states ----
  const [payToken, setPayToken] = useState("HKDC");
  const [payTo, setPayTo] = useState("");
  const [payAmt, setPayAmt] = useState("");

  // Contract instances
  const hkdc = useMemo(
    () => provider && new ethers.Contract(ADDR.HKDC, ABI.ERC20, provider),
    [provider]
  );
  const sgdc = useMemo(
    () => provider && new ethers.Contract(ADDR.SGDC, ABI.ERC20, provider),
    [provider]
  );
  const fx = useMemo(
    () => provider && new ethers.Contract(ADDR.STABLEFX, ABI.FX, provider),
    [provider]
  );
  const oracle = useMemo(
    () => provider && new ethers.Contract(ADDR.ORACLE, ABI.ORACLE, provider),
    [provider]
  );

  useEffect(() => {
    let intervalId;
    
    const fetchExchangeRateData = async () => {
      if (!oracle || !provider) {
        console.log("Oracle or provider not ready");
        return;
      }
      
      try {
        console.log("Fetching exchange rate data...");
        // Get current rate from blockchain oracle
        console.log("Oracle rate:", oracle.getRate());
        const result = await oracle.getRate();
        console.log("Raw result from oracle:", result);
        
        // Check if result is valid
        if (!result || result.length < 2) {
          console.error("Invalid rate data received from oracle");
          return;
        }
        
        const [rate, updatedAt] = result;
        console.log("Rate:", rate.toString(), "UpdatedAt:", updatedAt.toString());
        
        // Check if rate is valid
        if (rate === undefined || updatedAt === undefined) {
          console.error("Rate or timestamp is undefined");
          return;
        }
        
        // Convert rate to a readable format (18 decimals to actual rate)
        const formattedRate = Number(ethers.formatUnits(rate, 18));
        const timestamp = Number(updatedAt) * 1000; // Convert to milliseconds
        console.log("Formatted rate:", formattedRate, "Timestamp:", new Date(timestamp));
        
        // Add to data array
        setExchangeRateData(prevData => {
          // Create new data point
          const newDataPoint = { t: timestamp, rate: formattedRate };
          
          // Check if this is a duplicate of the last entry
          if (prevData.length > 0 && prevData[prevData.length - 1].t === timestamp) {
            // Update the last entry instead of adding a new one
            const updatedData = [...prevData];
            updatedData[updatedData.length - 1] = newDataPoint;
            return updatedData;
          }
          
          // Add new data point
          const newData = [...prevData, newDataPoint];
          
          // Keep only last 50 data points to prevent memory issues
          if (newData.length > 50) {
            newData.shift();
          }
          
          return newData;
        });
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };
    
    // Fetch immediately on load
    fetchExchangeRateData();
    
    // Set up periodic fetching (every 30 seconds)
    intervalId = setInterval(fetchExchangeRateData, 30000);
    
    return () => clearInterval(intervalId);
  }, [oracle, provider]);

  // Connect wallet
  const connect = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    const p = new ethers.BrowserProvider(window.ethereum);
    const accs = await p.send("eth_requestAccounts", []);
    setProvider(p);
    setSigner(await p.getSigner());
    setAccount(accs[0]);
  };

  // Fake KYC
  const runKYC = async () => {
    setKycVerified(true);
    alert("KYC completed (demo).");
  };

  // Refresh balances
  const refreshBasics = async () => {
    if (!provider || !account || !hkdc || !sgdc) return;
    const [db, sb] = await Promise.all([
      hkdc.balanceOf(account),
      sgdc.balanceOf(account),
    ]);
    setHkdcBal(ethers.formatUnits(db, 6));
    setSgdcBal(ethers.formatUnits(sb, 6));
  };

  // Swap
  const doSwap = async () => {
    if (!signer || !fx) return;

    if (!kycVerified) {
      alert("Please complete KYC before swapping.");
      return;
    }

    const tokenIn = side === "HKDC_TO_SGDC" ? ADDR.HKDC : ADDR.SGDC;
    const tokenOut = side === "HKDC_TO_SGDC" ? ADDR.SGDC : ADDR.HKDC;

    const erc = new ethers.Contract(tokenIn, ABI.ERC20, signer);
    const fxw = fx.connect(signer);

    const amountIn = ethers.parseUnits(amt || "0", 6);
    if (amountIn <= 0n) return;

    // Approve if needed
    const allowance = await erc
      .allowance(account, ADDR.STABLEFX)
      .catch(() => 0n);
    if (allowance < amountIn) {
      const tx1 = await erc.approve(ADDR.STABLEFX, amountIn);
      await tx1.wait();
    }

    const tx2 = await fxw.swapExactIn(tokenIn, tokenOut, amountIn, 0, 600);
    const rc = await tx2.wait();

    await refreshBasics();
    alert("Swap completed. Tx: " + rc.hash);
  };

  // ---- New: send payment (ERC20 transfer) ----
  const doPay = async () => {
    if (!signer) return;

    if (!kycVerified) {
      alert("Please complete KYC before sending.");
      return;
    }
    if (!ethers.isAddress(payTo)) {
      alert("Invalid recipient address.");
      return;
    }
    const amount = ethers.parseUnits(payAmt || "0", 6);
    if (amount <= 0n) {
      alert("Amount must be greater than 0.");
      return;
    }

    const tokenAddr = payToken === "HKDC" ? ADDR.HKDC : ADDR.SGDC;
    const erc = new ethers.Contract(tokenAddr, ABI.ERC20, signer);

    const tx = await erc.transfer(payTo, amount);
    const rc = await tx.wait();

    await refreshBasics();
    alert(`${payToken} sent. Tx: ${rc.hash}`);
    setPayAmt("");
    // leave payTo for convenience; uncomment to clear:
    // setPayTo("");
  };

  useEffect(() => {
    if (!provider) return;
    refreshBasics();
  }, [provider, account, hkdc, sgdc]);

  return (
    <main className="min-h-screen bg-[#03050a] text-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wider">
            <span className="text-lime-400">SCCS</span> - StableCoin CyberSpace
          </h1>

          {/* Wallet + KYC */}
          <div className="flex items-center gap-3">
            {account ? (
              <div className="rounded-xl border border-lime-400/30 bg-black/40 px-4 py-2 text-sm">
                Connected:{" "}
                <span className="text-lime-300">
                  {account.slice(0, 6)}…{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={connect}
                className="rounded-xl bg-lime-500/90 px-4 py-2 font-semibold text-black hover:bg-lime-400"
              >
                Connect Wallet
              </button>
            )}

            <button
              onClick={runKYC}
              className="rounded-xl border border-lime-400/60 px-4 py-2 hover:bg-lime-400/10"
            >
              {kycVerified ? "KYC Verified" : "Verify Identity (KYC)"}
            </button>
          </div>
        </div>

        {/* ---- New: Pay section (top, under the title) ---- */}
        <div className="rounded-2xl border border-lime-400/20 bg-black/60 p-4">
          <div className="mb-3 text-sm text-white/70">Pay</div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Token selector */}
            <select
              value={payToken}
              onChange={(e) => setPayToken(e.target.value)}
              className="rounded-lg bg-[#0a1118] px-3 py-2 outline-none"
            >
              <option value="HKDC">HKDC</option>
              <option value="SGDC">SGDC</option>
            </select>

            {/* Recipient */}
            <input
              value={payTo}
              onChange={(e) => setPayTo(e.target.value)}
              placeholder="Recipient address (0x...)"
              className="min-w-[280px] flex-1 rounded-lg bg-[#0a1118] px-3 py-2 outline-none"
            />

            {/* Amount */}
            <input
              value={payAmt}
              onChange={(e) => setPayAmt(e.target.value)}
              placeholder="Amount (6 decimals)"
              className="min-w-[200px] rounded-lg bg-[#0a1118] px-3 py-2 outline-none"
            />

            {/* Send */}
            <button
              onClick={doPay}
              disabled={
                !account || !kycVerified || !payAmt || !ethers.isAddress(payTo)
              }
              className="rounded-xl bg-lime-500/90 px-4 py-2 font-semibold text-black hover:bg-lime-400 disabled:opacity-40"
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-white/50">
            The transaction will be rejected if either party has not completed
            identity verification (KYC), or is restricted due to suspicious or
            illicit activity.
          </div>
        </div>

        {/* Rate + Dynamic Chart */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Dynamic chart */}
          <div className="md:col-span-2">
            {exchangeRateData.length > 0 ? (
              <PixelChart data={exchangeRateData} />
            ) : (
              <div className="w-full rounded-2xl border border-lime-400/20 bg-black/60 p-3 shadow-[0_0_40px_rgba(70,255,130,0.12)] h-[260px] flex items-center justify-center">
                <p className="text-lime-300">Loading exchange rate data...</p>
              </div>
            )}
          </div>

          {/* Time + balances */}
          <div className="rounded-2xl border border-lime-400/20 bg-black/60 p-4">
            <div className="text-sm text-white/70">Current Time</div>
            <div className="mt-2 text-2xl font-bold text-lime-300">
              {new Date(now).toLocaleString()}
            </div>

            <div className="mt-6 space-y-2">
              <div className="text-sm text-white/70">Balances</div>
              <div className="flex justify-between rounded-xl bg-[#0a1118] px-3 py-2">
                <span>HKDC</span>
                <span className="text-lime-300">{hkdcBal}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-[#0a1118] px-3 py-2">
                <span>SGDC</span>
                <span className="text-lime-300">{sgdcBal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Section */}
        <div className="rounded-2xl border border-lime-400/20 bg-black/60 p-4">
          <div className="mb-3 text-sm text-white/70">Swap</div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={side}
              onChange={(e) => setSide(e.target.value)}
              className="rounded-lg bg-[#0a1118] px-3 py-2 outline-none"
            >
              <option value="HKDC_TO_SGDC">HKDC → SGDC</option>
              <option value="SGDC_TO_HKDC">SGDC → HKDC</option>
            </select>

            <input
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="Amount (6 decimals)"
              className="min-w-[200px] flex-1 rounded-lg bg-[#0a1118] px-3 py-2 outline-none"
            />

            <button
              onClick={doSwap}
              disabled={!account || !amt || !kycVerified}
              className="rounded-xl bg-lime-500/90 px-4 py-2 font-semibold text-black hover:bg-lime-400 disabled:opacity-40"
            >
              Swap
            </button>

            <button
              onClick={refreshBasics}
              className="rounded-xl border border-lime-400/40 px-3 py-2 hover:bg-lime-400/10"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 text-xs text-white/50">
            Fees are deducted from the output token; the transaction will be
            rejected if you haven't completed identity verification (KYC) or if
            your account is frozen due to illicit activity.
          </div>
        </div>
      </div>
    </main>
  );
}