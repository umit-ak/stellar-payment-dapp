// src/App.jsx
import { useEffect, useState, useCallback } from "react";
import WalletPanel from "./components/WalletPanel";
import BalanceCard from "./components/BalanceCard";
import SendForm from "./components/SendForm";
import ReceiptCard from "./components/ReceiptCard";
import {
  connectFreighter,
  getActiveAddress,
  signWithFreighter,
} from "./lib/freighter";
import {
  fetchXlmBalance,
  buildPaymentTransaction,
  submitSignedTransaction,
  NETWORK_PASSPHRASE,
  toFriendlyErrorMessage,
} from "./lib/stellar";

export default function App() {
  const [publicKey, setPublicKey] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState(null);

  const [connecting, setConnecting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [walletError, setWalletError] = useState(null);
  const [txResult, setTxResult] = useState(null); // { status, hash, message, amount, destination }

  const loadBalance = useCallback(async (address) => {
    setBalanceLoading(true);
    try {
      const xlm = await fetchXlmBalance(address);
      setBalance(xlm);
    } catch (err) {
      console.error("Bakiye okunamadı:", err);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // Sayfa açıldığında, kullanıcı zaten Freighter'a bağlıysa oturumu geri yükle.
  useEffect(() => {
    (async () => {
      const address = await getActiveAddress();
      if (address) {
        setPublicKey(address);
        loadBalance(address);
      }
    })();
  }, [loadBalance]);

  async function handleConnect() {
    setWalletError(null);
    setConnecting(true);
    try {
      const { publicKey: address, network: net } = await connectFreighter();
      setPublicKey(address);
      setNetwork(net);
      await loadBalance(address);
    } catch (err) {
      setWalletError(err.message);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setPublicKey(null);
    setNetwork(null);
    setBalance(null);
    setTxResult(null);
    setWalletError(null);
  }

  async function handleSend({ destination, amount, memoText }) {
    setSending(true);
    setTxResult(null);
    try {
      const unsignedXdr = await buildPaymentTransaction({
        sourcePublicKey: publicKey,
        destinationPublicKey: destination,
        amount,
        memoText,
      });

      const signedXdr = await signWithFreighter(
        unsignedXdr,
        NETWORK_PASSPHRASE,
        publicKey
      );

      const submitResult = await submitSignedTransaction(signedXdr);

      setTxResult({
        status: "success",
        hash: submitResult.hash,
        amount,
        destination,
      });

      await loadBalance(publicKey);
    } catch (err) {
      console.error("Gönderim hatası:", err);
      setTxResult({
        status: "error",
        message: toFriendlyErrorMessage(err),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="panel-eyebrow">Stellar · Testnet</div>
        <h1 className="app-title">Basit XLM Ödeme dApp'i</h1>
        <p className="app-subtitle">
          Freighter cüzdanını bağla, bakiyeni gör, testnet üzerinde XLM gönder.
        </p>
      </header>

      <main className="app-grid">
        <WalletPanel
          publicKey={publicKey}
          network={network}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          connecting={connecting}
        />

        {walletError && <p className="form-error form-error--banner">{walletError}</p>}

        {publicKey && (
          <>
            <BalanceCard
              balance={balance}
              loading={balanceLoading}
              onRefresh={() => loadBalance(publicKey)}
              hasWallet={Boolean(publicKey)}
            />

            <SendForm
              onSend={handleSend}
              sending={sending}
              hasWallet={Boolean(publicKey)}
              maxAmount={balance}
            />

            <ReceiptCard result={txResult} onClose={() => setTxResult(null)} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <span className="mono">stellar-payment-dapp</span> · Stellar Testnet üzerinde çalışır, gerçek para kullanılmaz.
      </footer>
    </div>
  );
}
