// src/components/ReceiptCard.jsx
//
// Bu sayfanın "imza" öğesi: gönderilen işlemin sonucunu gerçek bir ödeme
// fişi/bilet gibi gösteren kart. Başarılı/başarısız durumuna göre üstte
// bir damga, ortada işlem detayları ve hash, en altta explorer linki olur.

export default function ReceiptCard({ result, onClose }) {
  if (!result) return null;

  const { status, hash, message, amount, destination } = result;
  const isSuccess = status === "success";

  return (
    <section className={`receipt ${isSuccess ? "receipt--success" : "receipt--error"}`}>
      <div className="receipt__perforation" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="receipt__hole" />
        ))}
      </div>

      <div className="receipt__body">
        <div className="receipt__stamp">
          {isSuccess ? "ÖDENDİ" : "BAŞARISIZ"}
        </div>

        <h3 className="receipt__title">
          {isSuccess ? "İşlem testnette onaylandı" : "İşlem gönderilemedi"}
        </h3>

        {isSuccess ? (
          <dl className="receipt__details">
            <div className="receipt__row">
              <dt>Tutar</dt>
              <dd className="mono">{amount} XLM</dd>
            </div>
            <div className="receipt__row">
              <dt>Alıcı</dt>
              <dd className="mono">{destination}</dd>
            </div>
            <div className="receipt__row">
              <dt>İşlem hash'i</dt>
              <dd className="mono receipt__hash">{hash}</dd>
            </div>
          </dl>
        ) : (
          <p className="receipt__message">{message}</p>
        )}

        <div className="receipt__actions">
          {isSuccess && hash && (
            <a
              className="btn btn-ghost"
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
            >
              Stellar Expert'te gör ↗
            </a>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </section>
  );
}
