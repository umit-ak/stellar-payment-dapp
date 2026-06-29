// src/lib/stellar.js
//
// Bu dosya, Stellar Testnet ile doğrudan ilgili tüm mantığı içerir:
// - Horizon (Stellar'ın API sunucusu) ile bağlantı
// - Hesap bakiyesi okuma
// - XLM gönderme transaction'ı oluşturma ve ağa gönderme
//
// Freighter cüzdanına özel kod burada YOK, o lib/freighter.js içinde.
// Böylece "Stellar mantığı" ve "cüzdan mantığı" birbirinden ayrı kalıyor.

import {
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Memo,
} from "@stellar/stellar-sdk";

// Testnet sabitleri. Mainnet'e geçmek istenirse sadece bu iki satır değişir.
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// Horizon sunucu istemcisi - tüm app boyunca tek instance kullanıyoruz.
export const server = new Horizon.Server(HORIZON_URL);

/**
 * Verilen public key'in (cüzdan adresinin) testnet XLM bakiyesini döner.
 * Hesap testnette hiç fonlanmamışsa (yeni oluşturulmuş ama friendbot'tan
 * para almamışsa) Horizon 404 döner; bu durumda bakiyeyi "0" kabul ediyoruz.
 */
export async function fetchXlmBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (err) {
    // Horizon, var olmayan/fonlanmamış hesaplar için 404 NotFoundError fırlatır.
    if (err?.response?.status === 404) {
      return "0";
    }
    throw err;
  }
}

/**
 * Bir XLM ödeme transaction'ı kurar, imzalanması için XDR (transaction'ın
 * string halini) döner. İmzalama işini Freighter yapacağı için burada
 * sadece "imzasız" transaction hazırlanıyor.
 */
export async function buildPaymentTransaction({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memoText,
}) {
  const sourceAccount = await server.loadAccount(sourcePublicKey);

  const transactionBuilder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({
      destination: destinationPublicKey,
      asset: Asset.native(),
      amount: amount.toString(),
    })
  );

  if (memoText && memoText.trim().length > 0) {
    // Memo en fazla 28 byte olabilir (Stellar kuralı).
    transactionBuilder.addMemo(Memo.text(memoText.trim().slice(0, 28)));
  }

  const transaction = transactionBuilder.setTimeout(180).build();

  return transaction.toXDR();
}

/**
 * Freighter tarafından imzalanmış XDR'ı tekrar bir Transaction nesnesine
 * çevirir ve Stellar testnet ağına gönderir (submit).
 */
export async function submitSignedTransaction(signedTxXdr) {
  const transaction = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );
  const result = await server.submitTransaction(transaction);
  return result; // result.hash -> işlem hash'i
}

/**
 * Stellar Expert testnet explorer üzerinde bir adres/transaction linki üretir.
 * Kullanıcıya "kanıt" göstermek için README ve UI'da kullanılıyor.
 */
export function explorerTxUrl(hash) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function explorerAccountUrl(publicKey) {
  return `https://stellar.expert/explorer/testnet/account/${publicKey}`;
}

/**
 * Horizon / Stellar SDK hatalarını kullanıcıya gösterilebilir, anlaşılır
 * bir mesaja çevirir. Ham hata objelerini ekrana basmamak için merkezi
 * bir yerde topluyoruz.
 */
export function toFriendlyErrorMessage(err) {
  const resultCodes = err?.response?.data?.extras?.result_codes;
  if (resultCodes?.operations?.includes("op_underfunded")) {
    return "Bakiye yetersiz: göndermeye çalıştığın tutar + işlem ücreti için yeterli XLM yok.";
  }
  if (resultCodes?.transaction === "tx_bad_auth") {
    return "İmza doğrulanamadı. Cüzdanını tekrar bağlamayı dene.";
  }
  if (err?.response?.status === 404) {
    return "Hesap testnette bulunamadı. Adresi kontrol et ya da Friendbot ile fonla.";
  }
  if (err?.message) {
    return err.message;
  }
  return "Bilinmeyen bir hata oluştu.";
}
