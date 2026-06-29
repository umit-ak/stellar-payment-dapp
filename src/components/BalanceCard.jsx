// src/components/BalanceCard.jsx

export default function BalanceCard({ balance, loading, onRefresh, hasWallet }) {
  return (
    <section className="panel balance-card">
      <div className="balance-card__top">
        <div>
          <div className="panel-eyebrow">Bakiye</div>
          <h2 className="panel-title">Testnet XLM</h2>
        </div>
        <button
          className="btn btn-icon"
          onClick={onRefresh}
          disabled={!hasWallet || loading}
          title="Bakiyeyi yenile"
          aria-label="Bakiyeyi yenile"
        >
          ⟳
        </button>
      </div>

      <div className="balance-display">
        {!hasWallet ? (
          <span className="balance-display__placeholder">— · —</span>
        ) : loading ? (
          <span className="balance-display__placeholder">yükleniyor…</span>
        ) : (
          <>
            <span className="balance-display__amount mono">{formatAmount(balance)}</span>
            <span className="balance-display__unit">XLM</span>
          </>
        )}
      </div>

      {hasWallet && (
        <p className="panel-text panel-text--small">
          Testnet hesabında hiç XLM yoksa{" "}
          <a
            href="https://laboratory.stellar.org/#account-creator?network=test"
            target="_blank"
            rel="noreferrer"
          >
            Friendbot
          </a>{" "}
          ile ücretsiz test XLM'i alabilirsin.
        </p>
      )}
    </section>
  );
}

function formatAmount(balance) {
  if (balance === null || balance === undefined) return "0.0000000";
  const value = Number(balance);
  if (Number.isNaN(value)) return balance;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}
