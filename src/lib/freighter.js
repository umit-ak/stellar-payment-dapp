// src/lib/freighter.js
//
// Freighter tarayıcı uzantısıyla ilgili TÜM kod burada toplanıyor.
// "Connect", "disconnect" ve "sign" işlemleri buradan geçiyor.

import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";

export const EXPECTED_NETWORK = "TESTNET";

/**
 * Freighter uzantısı tarayıcıda kurulu mu diye bakar.
 */
export async function isFreighterInstalled() {
  const result = await isConnected();
  // Freighter API'sinde `isConnected` ismi biraz kafa karıştırıcı:
  // burada gerçekte "uzantı tarayıcıda yüklü mü" sorusunu cevaplıyor,
  // kullanıcının siteye izin verip vermediğini değil.
  return !result.error && result.isConnected;
}

/**
 * Kullanıcıdan cüzdana erişim izni ister (Freighter popup'ı açılır) ve
 * onay verilirse public key'i (adres) döner.
 *
 * Aynı zamanda kullanıcının Freighter'da Testnet'e geçip geçmediğini
 * kontrol eder; geçmediyse açık bir hata fırlatır.
 */
export async function connectFreighter() {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(
      "Freighter uzantısı bulunamadı. Lütfen önce Freighter'ı tarayıcına kur."
    );
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message || "Cüzdan erişimi reddedildi.");
  }

  const network = await getNetwork();
  if (network.error) {
    throw new Error(network.error.message || "Ağ bilgisi okunamadı.");
  }

  if (network.network !== EXPECTED_NETWORK) {
    throw new Error(
      `Freighter şu an "${network.network}" ağında. Lütfen Freighter ayarlarından "Test Net" ağına geç ve tekrar dene.`
    );
  }

  return {
    publicKey: access.address,
    network: network.network,
  };
}

/**
 * Şu an Freighter'a bağlı bir hesap var mı varsa adresini döner.
 * Sayfa yenilendiğinde "zaten bağlıydı" durumunu geri yüklemek için kullanılır.
 */
export async function getActiveAddress() {
  const installed = await isFreighterInstalled();
  if (!installed) return null;

  const result = await getAddress();
  if (result.error || !result.address) return null;
  return result.address;
}

/**
 * Hazırlanmış (imzasız) bir transaction XDR'ını Freighter ile imzalar.
 */
export async function signWithFreighter(transactionXdr, networkPassphrase, address) {
  const result = await signTransaction(transactionXdr, {
    networkPassphrase,
    address,
  });
  if (result.error) {
    throw new Error(result.error.message || "İşlem imzalanamadı.");
  }
  return result.signedTxXdr;
}

/**
 * NOT: Freighter, tarayıcı uzantısı seviyesinde gerçek bir "disconnect" API'si
 * sunmuyor (izin iptali kullanıcı tarafından uzantı ayarlarından yapılır).
 * Bu yüzden "Disconnect" butonu, bizim UYGULAMAMIZIN oturumunu (local state'i)
 * temizler: adres, bakiye ve geçmiş işlem bilgisi sıfırlanır ve kullanıcı
 * "bağlı değil" ekranına döner. Bunu kullanıcıya UI üzerinde de açıkça belirtiyoruz.
 */
export function disconnectAppSession(setState) {
  setState({
    publicKey: null,
    network: null,
    balance: null,
  });
}
