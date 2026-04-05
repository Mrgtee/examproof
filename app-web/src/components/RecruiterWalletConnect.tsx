"use client";

import { useEffect, useState } from "react";
import { connectRecruiterWallet, type HexAddress } from "@/lib/genlayer";

type Props = {
  onConnected: (address: HexAddress) => void;
};

export default function RecruiterWalletConnect({ onConnected }: Props) {
  const [wallet, setWallet] = useState<HexAddress | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("examproof_recruiter_wallet");
    if (saved) {
      const addr = saved as HexAddress;
      setWallet(addr);
      onConnected(addr);
    }
  }, [onConnected]);

  async function handleConnect() {
    try {
      setConnecting(true);
      setMessage("");

      const account = await connectRecruiterWallet();
      window.localStorage.setItem("examproof_recruiter_wallet", account);
      setWallet(account);
      onConnected(account);
      setMessage("Wallet connected.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to connect wallet."
      );
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[#e7dcd1] bg-white p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
        Recruiter wallet
      </div>

      {wallet ? (
        <div className="mt-3 space-y-3">
          <div className="break-all text-sm text-[#7f6a5a]">{wallet}</div>
          <div className="inline-flex rounded-full bg-[#eef7ef] px-3 py-1 text-xs text-[#276749]">
            Connected
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#7f6a5a]">
            Connect the recruiter wallet. This wallet will pay gas for exam creation
            and management actions.
          </p>

          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect wallet"}
          </button>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-[18px] border border-[#e7dcd1] bg-[#fffaf4] p-3 text-sm text-[#7f6a5a]">
          {message}
        </div>
      )}
    </div>
  );
}