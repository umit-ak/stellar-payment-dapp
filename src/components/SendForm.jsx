// src/components/SendForm.jsx
import { useState } from "react";

export default function SendForm({ onSend, sending, hasWallet, maxAmount }) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [formError, setFormError] = useState(null);

  function validate() {
    if (!destination.trim().startsWith("G") || destination.trim().length !== 56) {
      return "Geçerli bir Stellar adresi gir (G ile başlayan, 56 karakter).";
    }
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return "Geçerli bir miktar gir (0'dan büyük).";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    await onSend({ destination: destination.trim(), amount, memoText: memo });
  }

  return (
    <section className="panel send-form">
      <div className="panel-eyebrow">Adım 2</div>
      <h2 className="panel-title">XLM gönder</h2>

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Alıcı adresi</span>
          <input
            className="field-input mono"
            placeholder="GABC...XYZ"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={!hasWallet || sending}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Miktar (XLM)</span>
            <input
              className="field-input mono"
              type="number"
              min="0"
              step="0.0000001"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!hasWallet || sending}
            />
          </label>

          <label className="field">
            <span className="field-label">Not (opsiyonel)</span>
            <input
              className="field-input"
              placeholder="örn. kahve parası"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={!hasWallet || sending}
              maxLength={28}
            />
          </label>
        </div>

        {maxAmount !== null && hasWallet && (
          <p className="panel-text panel-text--small">
            Kullanılabilir bakiye: <span className="mono">{maxAmount} XLM</span>
          </p>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <button className="btn btn-primary btn-full" type="submit" disabled={!hasWallet || sending}>
          {sending ? "Gönderiliyor…" : "Testnette gönder"}
        </button>

        {!hasWallet && (
          <p className="panel-text panel-text--small">Önce cüzdanını bağlamalısın.</p>
        )}
      </form>
    </section>
  );
}
