// src/components/WalletPanel.jsx
import { useState } from "react";

function truncateAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function WalletPanel({
  publicKey,
  network,
  onConnect,
  onDisconnect,
  connecting,
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!publicKey) {
    return (
      <section className="panel wallet-panel">
        <div className="panel-eyebrow">Adım 1</div>
        <h2 className="panel-title">Cüzdanını bağla</h2>
        <p className="panel-text">
          XLM göndermek için önce Freighter cüzdanını Stellar Testnet üzerinde
          bağlaman gerekiyor.
        </p>
        <button
          className="btn btn-primary"
          onClick={onConnect}
          disabled={connecting}
        >
          {connecting ? "Bağlanıyor…" : "Freighter ile bağlan"}
        </button>
      </section>
    );
  }

  return (
    <section className="panel wallet-panel wallet-panel--connected">
      <div className="wallet-row">
        <div>
          <div className="panel-eyebrow">Bağlı cüzdan</div>
          <button className="address-pill" onClick={handleCopy} title="Adresi kopyala">
            <span className="dot dot--online" />
            <span className="mono">{truncateAddress(publicKey)}</span>
            <span className="copy-hint">{copied ? "kopyalandı" : "kopyala"}</span>
          </button>
        </div>
        <div className="wallet-row__right">
          <span className="badge badge--network">{network}</span>
          <button className="btn btn-ghost" onClick={onDisconnect}>
            Bağlantıyı kes
          </button>
        </div>
      </div>
    </section>
  );
}
