import { useState, useEffect } from "react";
import {
  ThumbsUp,
  Wallet,
  ShieldCheck,
  Globe,
  Zap,
  DollarSign,
  Users,
  Shield,
  Scale,
  Eye,
  Landmark,
  FileText,
  Scroll,
  ArrowLeft,
  Check,
  Minus,
  Plus,
  X,
  Archive,
  SlidersHorizontal,
  AlertTriangle,
  Menu,
  Home,
  Power,
  Vote,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/* ============================================================
   THE DIRECTIVE — v1 MOTOR
   Tasarım dokümanı sürüm 0.1'e göre kurulmuştur.
   İçerik: her kategoriden 1 örnek eylem (motoru test etmek için).
   ============================================================ */

// ---------- PALET (Doküman Bölüm 14) ----------
const C = {
  zemin: "#0A0E17",
  panel: "#131A29",
  kenar: "#232C40",
  pirinc: "#C9A227",
  kagit: "#E8E1CE",
  murekkep: "#1F1B14",
  damga: "#9B2F2A",
  arti: "#3DDC84",
  eksi: "#E5555A",
  sandik: "#4E9FD1",
  solgun: "#8B93A7",
  sonuk: "#5B6478",
};

const TOPLAM_TUR = 10;
// Devletin aynı anda yürütebileceği büyük iş sayısı.
// 3 seçildi çünkü dengeli oyunu engellemiyor ama kanun yığmayı durduruyor.
const KAPASITE = 3;
// Meclis tek sayıdır; böylece oylama hiçbir zaman berabere bitemez.
const TOPLAM_SANDALYE = 101;
const BARAJ = 51;

// Üç belge türünün gerçek maliyeti yalnızca bu tabloda değil; kanunun geçince
// iade ettiği nüfuzda ve etkisini iki kez uygulamasında saklı. Eski değerlerle
// (kanun 5 − 3 iade = net 2, etki iki kez / kararname net 4, etki bir kez)
// kanun, kararnamenin yarı fiyatına iki katı etki veriyordu: kararnameyi
// seçmek için hiçbir sebep kalmıyordu.
//
// Yeni denge, uygulama başına düşen nüfuz olarak okunmalı:
//   KANUN      net 4, etki ×2  → 2.0   en verimli, ama en yavaş ve tek riskli
//                                       olan (meclis reddedebilir) ve kapasiteyi
//                                       4 tur boyunca tutan
//   KARARNAME  net 3, etki ×1  → 3.0   ucuz, hızlı, garantili, mütevazı
//   OPERASYON  net 4, etki ×1  → 4.0   en pahalısı, ama anında ve tekrarlanabilir
const NUFUZ_MALIYET = { KANUN: 5, KARARNAME: 3, OPERASYON: 4 };
// Meclisten kanun geçirmek siyasi sermaye kazandırır — ama eskisi kadar değil.
const KANUN_IADE = 1;
// Nüfuz biriktirilebilir ama sınırsız değil: en fazla birkaç yarıyıllık gelir.
const NUFUZ_TAVAN = 30;
// Bazı etkiler anında değil, birkaç yarıyıl sonra hissedilir.
// Bir fabrika kurulur ama istihdamı üretime geçince yaratır.
const ETKI_GECIKMESI = 2;

// Kanunun ömrü: imzadan kaç tur sonra yürürlüğe girer, kaç tur sonra tamamlanır.
// Tamamlanma bürokratik kapasiteyi de boşaltır; bu yüzden süre uzadıkça oyunda
// geçirilebilecek kanun sayısı düşer. 4 seçildi: 10 turluk oyunda kanunların
// çoğunu görebilmek için yeterince kısa, tamamlanmayı beklemek için yeterince uzun.
const KANUN_YURURLUK = 2;
const KANUN_TAMAMLANMA = 4;

// Her kanun aynı kolaylıkta geçmez. Yapısal reformlar nitelikli çoğunluk ister.
const BUYUK_BARAJ = 55;
// Meclis'ten dönen tasarı hemen yeniden sunulamaz, ama kaybolmaz da.
const RED_BEKLEME = 2;
const KOL_MALIYET = 2;

// Her turun sonunda uygulanan yıpranma.
// Yönetim oyununun temel gerilimi buradan gelir: hiçbir şey yapmamak kaybettirir.
// Yıpranma sabit değildir: gösterge yükseldikçe onu korumak zorlaşır.
// Halk yüksek beklentiye alışır, düzen sıkılaşınca çatlar, itibar kolay yıpranır.
// Bu sayede göstergeler tavana yapışmaz, doğal bir denge noktasında oturur.
const YIPRANMA_TABAN = { onay: 1.5, istikrar: 0.8, kuresel: 0.6 };
const YIPRANMA_EGIM = 10; // 50'nin üstündeki her 10 puan, yıpranmayı 1 artırır

// ŞİMDİLİK KAPALI. Göstergeler kendiliğinden gerilemiyor; düşüş yalnızca
// eylemlerin olumsuz sonuçlarından ve politika kollarından geliyor.
// Geri açmak için YIPRANMA_ACIK = true yeterli.
const YIPRANMA_ACIK = false;

function yipranmaHesapla(ist) {
  if (!YIPRANMA_ACIK) return { onay: 0, istikrar: 0, kuresel: 0 };
  const hesapla = (deger, taban) =>
    -(taban + Math.max(0, deger - 50) / YIPRANMA_EGIM);
  return {
    onay: Math.round(hesapla(ist.onay, YIPRANMA_TABAN.onay) * 10) / 10,
    istikrar: Math.round(hesapla(ist.istikrar, YIPRANMA_TABAN.istikrar) * 10) / 10,
    kuresel: Math.round(hesapla(ist.kuresel, YIPRANMA_TABAN.kuresel) * 10) / 10,
  };
}

// Ülke nüfusu ve sandığa giden seçmen sayısı.
// Şimdilik sabit; ileride demografi sistemi gelirse buradan beslenir.
const BASLANGIC_YILI = 2026;

// Görev süresinin on yarıyılı, hiçbiri tekrar etmeyen adlarla anılır.
// Yalnızca isimdir; oyun mekaniğine etkisi yoktur — nerede olduğunu hissettirir.
// ŞÜPHE: riskli hamleler burada birikir. Üç kademede karşına çıkar.
const SUPHE_SORUSTURMA = 40;
const SUPHE_KISITLAMA = 70;
const SUPHE_AZIL = 100;
const KISITLAMA_SURESI = 3; // yetki kısıtlamasının kaç tur süreceği

const OTURUM_ADLARI = [
  "Göreve Başlama",
  "İlk Adımlar",
  "Yerleşme Dönemi",
  "İlk Sınav",
  "Orta Dönem",
  "Dönüm Noktası",
  "Hesap Dönemi",
  "Son Viraj",
  "Seçim Arifesi",
  "Görev Sonu",
];

// 1 tur = 1 yarıyıl. Meclislerde ilkbahar yasama, sonbahar bütçe mevsimidir;
// takvim bu ritmi taşır.
function takvim(tur) {
  const yil = BASLANGIC_YILI + Math.floor((tur - 1) / 2);
  const ilkYari = tur % 2 === 1;
  return {
    yil,
    donem: OTURUM_ADLARI[tur - 1] || `${tur}. Oturum`,
    aylar: ilkYari ? "Ocak — Haziran" : "Temmuz — Aralık",
    kapanis: ilkYari ? `30 Haziran ${yil}` : `31 Aralık ${yil}`,
  };
}

const NUFUS = 78_400_000;
const SECMEN = Math.round(NUFUS * 0.71);

// Koalisyonu ayakta tutmak için gereken onay eşiği.
// Bunun altında sandalye kaybedersin, üstünde toplarsın.
//
// 58 idi ve bu tam olarak başlangıç onayına eşitti; sadakat pivotu (50) da
// başlangıç sadakatine eşit olduğu için kayma başlangıçta matematiksel olarak
// TAM SIFIRDI. Yıpranma da kapalı olduğundan hiçbir şey yapmayan oyuncunun
// koalisyonu 10 tur boyunca 51'de donuyordu — meclis ölü bir sayıydı.
//
// 60'a çekildi: koalisyon artık bakım isteyen canlı bir organ. Ölçüldü —
// hiçbir şey yapmayan oyuncu tur 7'de çoğunluğu kaybeder (oyunun ilk yarısı
// rahat geçer, hesap sonda sorulur), buna karşılık aktif oyuncu sandalye
// kazanmaya devam eder. Parti sadakati kolunu yukarı çekmek erimeyi dengeler;
// o kolun şimdiye kadar olmayan gerçek bir işlevi oldu.
const KOALISYON_ESIGI = 60;

// Tutulmayan vaatler yalnızca seçimde değil, yönetirken de bedel ödetir:
// grubun morali bozulur, sandalye erimesi hızlanır. Görev süresinin ilk
// yarısında sözünü tutmak için vaktin var — bu baskı yarıdan sonra başlar.
const VAAT_BASKI_TURU = 6;
const VAAT_BASKI_KAYMA = 0.08;

// ---------- İSTATİSTİK TANIMLARI ----------
const ISTATISTIKLER = [
  { k: "onay", ad: "Onay", ikon: ThumbsUp },
  { k: "hazine", ad: "Hazine", ikon: Wallet, para: true },
  { k: "istikrar", ad: "İstikrar", ikon: ShieldCheck },
  { k: "kuresel", ad: "Küresel", ikon: Globe },
  { k: "nufuz", ad: "Nüfuz", ikon: Zap },
];

const ETIKET = {
  onay: "Onay",
  hazine: "Hazine",
  istikrar: "İstikrar",
  kuresel: "Küresel",
  nufuz: "Nüfuz",
  istihdam: "İstihdam",
  halkSagligi: "Halk Sağlığı",
  hazirlik: "Hazırlık",
  supheDegisim: "Şüphe",
  gsyih: "GSYİH",
  koalisyon: "Koalisyon",
};

// ---------- KAMPANYA VAATLERİ (Doküman Bölüm 12) ----------
// Hedefler simülasyonla eşitlendi. Ölçüt iki tanedir ve ikisi de aynı anda tutmalı:
//  1) Hiçbir vaat bedava olmamalı — sıradan oyunun zaten getirdiği bir eşik,
//     o vaadi seçeni hiçbir şey yapmadan ödüllendirir. Eski `issizlik` eşiği
//     (başlangıç+10 = 62) tam olarak böyleydi: normal oyun zaten 63 getiriyordu.
//     Tek başına bu, vaat seçimini oyunun en belirleyici kararı yapıyordu —
//     aynı oyunla vaat çiftine göre %61.8 ile %47.8 arasında sonuç çıkıyordu.
//  2) Vaadini kovalayan oyuncu için hepsi ulaşılabilir olmalı ve birbirine
//     yakın kazandırmalı. Ölçüldü: kovalayan oyuncuda vaatler arası fark 0.85 puan.
//
// Ödül/ceza vaat başına ayarlanabilir ama şu an hepsi eşittir. Denendi ve ölçüldü:
// hedefler eşitlendikten sonra ölçeklenecek bir zorluk farkı kalmıyor, farklı ödül
// vermek yalnızca yüksek ödüllü vaadi üstün kılıyordu (fark 0.85 → 3.5'e çıkıyordu).
const VAATLER = [
  {
    id: "issizlik",
    ad: "İşsizliği düşüreceğim",
    kisa: "İstihdam",
    kategori: "İstihdam",
    kosulMetni: "İstihdam, başlangıcın 12 puan üstüne çıkmalı",
    odul: 8,
    ceza: 6,
    olc: (s) => ({ simdi: s.kpi.istihdam, hedef: s.baslangic.istihdam + 12 }),
  },
  {
    id: "saglik",
    ad: "Sağlığı herkese ulaştıracağım",
    kisa: "Halk sağlığı",
    kategori: "Sağlık",
    kosulMetni: "Halk sağlığı 70'e ulaşmalı",
    odul: 8,
    ceza: 6,
    olc: (s) => ({ simdi: s.kpi.halkSagligi, hedef: 70 }),
  },
  {
    id: "guvenlik",
    ad: "Sokakları güvene kavuşturacağım",
    kisa: "İstikrar",
    kategori: "İç Güvenlik",
    kosulMetni: "İstikrar 68'e ulaşmalı",
    odul: 8,
    ceza: 6,
    olc: (s) => ({ simdi: s.ist.istikrar, hedef: 68 }),
  },
  {
    id: "itibar",
    ad: "Ülkeyi dünyada saygın kılacağım",
    kisa: "Küresel itibar",
    kategori: "Diplomasi",
    kosulMetni: "Küresel itibar 70'e ulaşmalı",
    odul: 8,
    ceza: 6,
    olc: (s) => ({ simdi: s.ist.kuresel, hedef: 70 }),
  },
  {
    id: "vergi",
    ad: "Vergi yükünü hafifleteceğim",
    kisa: "Ortalama vergi",
    kategori: "Vergi",
    // Kendiliğinden tutulmasın: oyuncunun vergi kolunu bilerek indirmesi gerekir
    // ve o indirim tüm dönem boyunca vergi gelirinden götürür.
    kosulMetni: "Ortalama vergi oranı başlangıcın 2 puan altına inmeli",
    odul: 8,
    ceza: 6,
    olc: (s) => ({
      simdi: (s.kollar.gelirVergisi + s.kollar.kurumsalVergi) / 2,
      hedef: (s.baslangic.gelirVergisi + s.baslangic.kurumsalVergi) / 2 - 2,
      tersine: true, // burada hedefin ALTINDA kalmak gerekir
    }),
  },
];

// Bir vaadin o anki durumu: nerede, hedef ne, tutuluyor mu?
function vaatDurumu(v, s) {
  const { simdi, hedef, tersine } = v.olc(s);
  const tutuldu = tersine ? simdi < hedef : simdi >= hedef;
  return { simdi, hedef, tersine: !!tersine, tutuldu };
}

// ---------- BÖLÜMLER, KOLLAR, EYLEMLER (Doküman Bölüm 13) ----------
const BOLUMLER = {
  ekonomi: {
    k: "ekonomi",
    ad: "Ekonomi",
    tamAd: "Ekonomi Bakanlığı",
    ikon: DollarSign,
    aciklama:
      "Devletin kasasından sorumludur. Ülkenin ekonomiyle ilgili her işi buradan yürütülür.",
    kpi: [
      { k: "gsyih", ad: "GSYİH" },
      { k: "istihdam", ad: "İstihdam" },
    ],
    kollar: [
      { k: "gelirVergisi", ad: "Gelir Vergisi" },
      { k: "kurumsalVergi", ad: "Kurumsal Vergi" },
    ],
    kategoriler: ["Vergi", "İstihdam"],
    eylemler: [
      {
        id: "eko-vergi-1",
        kategori: "Vergi",
        tur: "KANUN",
        ad: "Genç Girişimci Vergi Paketi",
        metin:
          "Hazine'nin masasında beş yıldır aynı rakam duruyor: genç girişimci sayısı yerinde sayıyor. Tasarı hazır, imza seninle.",
        secenekler: [
          {
            ad: "Geniş kapsamlı muafiyet — üç yıl tam istisna",
            sonuclar: [
              {
                metin: "Düzenleme yürürlüğe girdi; iki çeyrekte 47 bin yeni işletme açıldı.",
                alinti:
                  "Dükkânının kepengini ilk kez indiren bir girişimci, «Kendi işimi bu kadar erken açabileceğimi hiç düşünmemiştim» dedi.",
                skor: (s) => 50 + s.kpi.istihdam / 8 + (s.ist.hazine > 30 ? 8 : 0),
                etki: { onay: 2, hazine: -4 },
                gecikmeli: { istihdam: 3 },
                gecikmeliMetin:
                  "Muafiyetten yararlanan işletmeler ilk kadrolarını aldı; genç istihdamı belirgin arttı.",
              },
              {
                metin:
                  "Vergi Denetim Kurulu raporu, başvuranların dörtte birinin aynı holdinge bağlı paravan şirketler olduğunu ortaya çıkardı.",
                alinti:
                  "Yan dükkândaki esnaf, «Ben yıllardır tam vergi veriyorum, o ‘genç girişimci’ bir holdingin oğlu» diye sitem etti.",
                skor: (s) => 50 + (60 - s.ist.onay) / 5,
                etki: { istihdam: 1, onay: -1, hazine: -4, istikrar: -1, supheDegisim: 6 },
              },
            ],
          },
          {
            ad: "Dar kapsamlı, denetimli destek — sadece üretim sektörü",
            sonuclar: [
              {
                metin:
                  "Destek yalnızca üretim yapan işletmelere verildi; başvuruların yüzde altmışı reddedildi, onaylananların tamamı hâlâ açık.",
                alinti:
                  "Küçük bir torna atölyesi kuran bir usta, «Krediyi alırken üç kez kontrol ettiler, iyi ki de etmişler» diye konuştu.",
                skor: (s) => 50 + s.kpi.gsyih / 7,
                etki: { istihdam: 2, hazine: -2, gsyih: 1 },
              },
              {
                metin:
                  "Başvuru süreci on bir belge şartına bağlandı; dosyaların yarısı tamamlanamadan düştü.",
                alinti:
                  "Dosyasını üçüncü kez getiren bir üniversite mezunu, «Her seferinde bir kâğıt daha istediler» kaydetti.",
                skor: (s) => 50 + (50 - s.kpi.istihdam) / 4,
                etki: { istihdam: 1, onay: -1, hazine: -2 },
              },
            ],
          },
        ],
      },
      {
        id: "eko-vergi-2",
        kategori: "Vergi",
        tur: "KANUN",
        buyuk: true,
        ad: "Kurumsal Vergi Reformu",
        metin:
          "Sanayi odası başkanı ile sendika temsilcisi aynı sabah, aynı saate randevu almış. İkisi de aynı dosya için geldi; ikisi de tam tersini istiyor.",
        secenekler: [
          {
            ad: "Oranı indir, yatırımı çek",
            sonuclar: [
              {
                metin:
                  "Kurumsal vergi oranı dört puan indirildi; yıl kapanmadan üç yabancı üretici fabrika duyurusu yaptı.",
                alinti:
                  "Fabrikanın kurulacağı ilçenin belediye başkanı, «Otuz yıldır buraya ilk kez birileri yatırım yapıyor» diye konuştu.",
                skor: (s) => 50 + s.ist.kuresel / 6,
                etki: { gsyih: 2, kuresel: 2, hazine: -3, onay: -1 },
                gecikmeli: { istihdam: 2 },
                gecikmeliMetin: "İlk fabrika üretime geçti; bölgede iki bin kişi işe alındı.",
              },
              {
                metin:
                  "İndirimin karşılığı yatırıma dönüşmedi; şirketlerin çoğu farkı kâr payı olarak dağıttı.",
                alinti:
                  "Şirketin mali işler müdürü, «Yatırım kararı bizim elimizde değildi, merkez öyle uygun gördü» diye ifade etti.",
                skor: (s) => 50 + (55 - s.kpi.gsyih) / 4,
                etki: { gsyih: 1, hazine: -3, onay: -2, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Büyük şirketlere ek dilim koy",
            sonuclar: [
              {
                metin:
                  "Cirosu eşiği aşan şirketler için ek vergi dilimi getirildi; ilk tahsilat beklentinin üzerinde geldi.",
                alinti:
                  "Emekli maaşına yapılan zammı duyan bir dul, «Nereden geldiğini bilmem ama bu ay ilaç param arttı» dedi.",
                skor: (s) => 50 + s.ist.onay / 6,
                etki: { hazine: 4, onay: 2, gsyih: -1, kuresel: -1 },
              },
              {
                metin:
                  "İki büyük holding merkezini yurt dışına taşıdı; endeks üç gün üst üste geriledi.",
                alinti:
                  "Taşınan şirkette on dört yıldır çalışan bir muhasebeci, «Bize üç ay süre verdiler, sonra ofis kapandı» sözleriyle anlattı.",
                skor: (s) => 50 + (58 - s.ist.kuresel) / 4,
                etki: { hazine: 2, gsyih: -2, istihdam: -2, kuresel: -2 },
              },
            ],
          },
        ],
      },
      {
        id: "eko-vergi-3",
        kategori: "Vergi",
        tur: "OPERASYON",
        bekleme: 3,
        ad: "Vergi Denetim Harekâtı",
        metin:
          "Maliye müfettişlerinin hazırladığı listede iki bin şirket var. Listenin kimin masasından geçtiği ise henüz belli değil.",
        secenekler: [
          {
            ad: "Sert denetim — kaçakçılığın üstüne git",
            sonuclar: [
              {
                metin:
                  "Denetimler altı ilde eş zamanlı yürütüldü; kayıt dışı işlem hacmi ilk çeyrekte belirgin daraldı.",
                alinti:
                  "Faturasını hep kesen bir market sahibi, «Yıllardır kesenle kesmeyen aynıydı, artık değil» diye konuştu.",
                skor: (s) => 50 + s.ist.istikrar / 6,
                etki: { hazine: 3, istikrar: 1, gsyih: -1 },
              },
              {
                metin:
                  "Denetimler küçük esnafa yığıldı; büyük mükelleflerin dosyaları bekletildi.",
                alinti:
                  "Kepenk kapatan bir kırtasiyeci, «Üç gün üst üste geldiler, karşı sokaktaki plazaya bir kez uğramadılar» diye sitem etti.",
                skor: (s) => 50 + (58 - s.ist.onay) / 4,
                etki: { hazine: 2, onay: -2, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Yapılandırma çıkar — borcunu ödeyene af",
            sonuclar: [
              {
                metin:
                  "Yapılandırmaya başvuru beklenenin iki katı oldu; tahsilat üç haftada tamamlandı.",
                alinti:
                  "Borcunu on iki taksite bölen bir nakliyeci, «Kamyonu satmaktan kurtuldum» dedi.",
                skor: (s) => 50 + s.ist.onay / 7,
                etki: { hazine: 2, onay: 1, istikrar: -1 },
              },
              {
                metin:
                  "Af, düzenli ödeyenlerle borçluları aynı noktaya getirdi; itirazlar yazılı olarak kayda geçti.",
                alinti:
                  "Otuz yıldır vergisini gününde ödeyen bir terzi, «Demek ki ödemesem de olurmuş» kaydetti.",
                skor: (s) => 50 + (62 - s.ist.istikrar) / 5,
                etki: { hazine: 2, onay: -2, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Vergi kayıtlarını siyasi rakiplere karşı kullan",
            riskli: true,
            gizli: true,
            sonuclar: [
              {
                metin: "Üç muhalif iş insanı sessizce geri çekildi; baskı işe yaradı.",
                alinti:
                  "Esnaf loncası başkanı basın önünde, «Sonunda büyük balığı da yakaladılar» dedi — listenin nasıl hazırlandığından habersiz.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 4,
                etki: { hazine: 3, istikrar: 2, supheDegisim: 9 },
              },
              {
                ifsa: true,
                metin: "Seçici denetim iddiası basına düştü.",
                alinti:
                  "İstifa eden müfettiş, «Listeyi ben hazırlamadım, masama öyle geldi» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 4,
                etki: { hazine: 2, onay: -3, supheDegisim: 12 },
              },
            ],
          },
        ],
      },
      {
        id: "eko-ist-1",
        kategori: "İstihdam",
        tur: "KARARNAME",
        ad: "Sanayi İstihdam Teşviki",
        metin:
          "Organize sanayi bölgesinde üç fabrika vardiya azaltmış. Bölge müdürü telefonda tek cümle kuruyor: «Bir teşvik gelmezse şubatta kimse kalmaz.»",
        secenekler: [
          {
            ad: "Yüksek prim, geniş kapsam — hızlı sonuç al",
            sonuclar: [
              {
                metin: "Prim ödemesi başladı; ilk ayda on yedi bin yeni sigortalı kaydı açıldı.",
                alinti:
                  "İki yıl sonra ilk kez sigortalı işe giren bir kaynakçı, «Eve haberi verirken sesim titredi» dedi.",
                skor: (s) => 50 + s.kpi.gsyih / 6,
                etki: { istihdam: 3, onay: 2, hazine: -4 },
              },
              {
                metin:
                  "Şirketlerin bir kısmı primi aldıktan sonra çıkarmalara devam etti; denetim mekanizması işlemedi.",
                alinti:
                  "Primli kadroda dört ay çalışıp çıkarılan bir işçi, «Prim bitti, ben de bittim» diye sitem etti.",
                skor: (s) => 50 + (55 - s.ist.istikrar) / 4,
                etki: { istihdam: 1, onay: -2, hazine: -4 },
              },
            ],
          },
          {
            ad: "Düşük prim, uzun taahhüt şartı — kalıcılığı zorla",
            sonuclar: [
              {
                metin:
                  "Prim iki yıllık istihdam taahhüdüne bağlandı; başvuran şirket sayısı az ama kadrolar kalıcı.",
                alinti:
                  "Sözleşmesini iki yıllık imzalayan bir tekstil işçisi, «İlk defa bu kadar uzun bir kâğıt imzaladım» diye konuştu.",
                skor: (s) => 50 + s.ist.istikrar / 7,
                etki: { istihdam: 2, hazine: -2, gsyih: 1 },
              },
              {
                metin: "Taahhüt şartı çoğu şirkete ağır geldi; başvuru hedefin üçte birinde kaldı.",
                alinti:
                  "Başvurudan vazgeçen bir atölye sahibi, «İki yıl sonrasını kim garanti edebilir» kaydetti.",
                skor: (s) => 50 + (50 - s.kpi.gsyih) / 4,
                etki: { istihdam: 1, hazine: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "eko-ist-2",
        kategori: "İstihdam",
        tur: "KANUN",
        ad: "Mesleki Eğitim Seferberliği",
        metin:
          "Aynı şehirde iki rakam yan yana duruyor: on dört bin işsiz genç, dokuz yüz doldurulamayan teknik kadro. Arada bir köprü yok.",
        secenekler: [
          {
            ad: "Devlet eliyle ulusal meslek okulları ağı kur",
            sonuclar: [
              {
                metin: "Otuz iki ilde meslek okulu açıldı; ilk mezunlar sanayiye doğrudan yerleşti.",
                alinti:
                  "Oğlunu okula yazdıran bir anne, «Liseyi bitirince ne yapacağını bilmiyorduk, artık biliyor» dedi.",
                skor: (s) => 50 + s.ist.hazine / 12,
                etki: { onay: 2, hazine: -5, gsyih: 1 },
                gecikmeli: { istihdam: 3 },
                gecikmeliMetin: "İlk mezun kuşağı işe yerleşti; teknik kadro açığı yarıya indi.",
              },
              {
                metin:
                  "Okullar açıldı ama müfredat sanayinin talebini karşılamadı; mezunların çoğu alan dışına yerleşti.",
                alinti:
                  "Bölümünü bitiren bir öğrenci, «İki yıl öğrendiğim makine fabrikada yoktu» sözleriyle anlattı.",
                skor: (s) => 50 + (35 - s.ist.hazine) / 6,
                etki: { istihdam: 1, hazine: -5, onay: -1 },
              },
            ],
          },
          {
            ad: "Şirketlere bırak, eğitim masrafını vergiden düş",
            sonuclar: [
              {
                metin: "Şirketler kendi eğitim programlarını kurdu; devlete maliyeti sınırlı kaldı.",
                alinti:
                  "Fabrikada altı ay eğitim alıp kadroya geçen bir çırak, «Ustam da benimle beraber sertifika aldı» diye konuştu.",
                skor: (s) => 50 + s.kpi.gsyih / 6,
                etki: { istihdam: 2, gsyih: 1, hazine: -2 },
              },
              {
                metin:
                  "Programdan yalnızca büyük şirketler yararlanabildi; küçük işletmeler kapsam dışında kaldı.",
                alinti:
                  "On kişilik atölyesi olan bir usta, «Bizim eğitim bütçemiz mi olurmuş» diye sitem etti.",
                skor: (s) => 50 + (55 - s.kpi.istihdam) / 4,
                etki: { istihdam: 1, hazine: -2, onay: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "eko-ist-3",
        kategori: "İstihdam",
        tur: "KARARNAME",
        ad: "Kamu İstihdam Paketi",
        metin:
          "İşsizlik rakamı sabah bültenlerinde manşet oldu. Kamuda boş kadro var — ama kimin dolduracağı ayrı bir soru.",
        secenekler: [
          {
            ad: "Sadece eksik olan kritik kadrolara al",
            sonuclar: [
              {
                metin:
                  "Öğretmen ve sağlık personeli açığı kapatıldı; atamalar sınav sırasına göre yapıldı.",
                alinti:
                  "Köy okuluna atanan bir öğretmen, «Sınıfta yirmi üç çocuk beni bekliyormuş» dedi.",
                skor: (s) => 50 + s.kpi.halkSagligi / 7,
                etki: { istihdam: 2, onay: 2, halkSagligi: 1, hazine: -3 },
              },
              {
                metin: "Atama sayısı beklentinin altında kaldı; bekleyen aday listesi uzamaya devam etti.",
                alinti:
                  "Dördüncü kez sıraya giren bir aday, «Her yıl ‘bu yıl olacak’ diyorlar» kaydetti.",
                skor: (s) => 50 + (65 - s.ist.onay) / 5,
                etki: { istihdam: 1, onay: -2, hazine: -3 },
              },
            ],
          },
          {
            ad: "Geniş çaplı kamu alımı yap",
            sonuclar: [
              {
                metin: "Kamuda toplu alım yapıldı; işsizlik oranı iki puan geriledi.",
                alinti:
                  "Kadroya geçen bir temizlik görevlisi, «On bir yıl taşeron çalıştım, ilk defa maaşım gününde yattı» diye konuştu.",
                skor: (s) => 50 + s.ist.hazine / 12,
                etki: { istihdam: 3, onay: 2, hazine: -5, gsyih: -1 },
              },
              {
                metin:
                  "Kadrolar hızla dolduruldu; kurumlarda görev tanımı olmayan personel sayısı arttı.",
                alinti:
                  "Aynı odayı dört kişiyle paylaşan bir memur, «İkimiz aynı işi yapıyoruz, üçüncüsü ne yapıyor bilmiyorum» dedi.",
                skor: (s) => 50 + (60 - s.ist.istikrar) / 4,
                etki: { istihdam: 2, onay: 1, hazine: -5, gsyih: -2, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Kadroları kendi seçmenine dağıt",
            riskli: true,
            gizli: true,
            sonuclar: [
              {
                metin: "Atamalar hızla tamamlandı; teşkilat sahada belirgin şekilde güçlendi.",
                alinti:
                  "İlçe başkanının yeğeni olan bir atanan, «Sınavdan önce arayıp müjdeyi verdiler» dedi — sözünün kayda geçtiğini fark etmeden.",
                skor: (s) => 50 + s.kollar.partiSadakati / 4,
                etki: { istihdam: 2, koalisyon: 2, hazine: -4, supheDegisim: 10 },
              },
              {
                ifsa: true,
                metin: "Atama listeleri sızdı; adayların üçte ikisinin aynı ilçeden olduğu görüldü.",
                alinti:
                  "Sınavda birinci olup atanmayan bir aday, «Listede benden otuz sıra geridekiler vardı» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 4,
                etki: { istihdam: 1, onay: -3, hazine: -4, supheDegisim: 13 },
              },
            ],
          },
        ],
      },
    ],
  },

  icisleri: {
    k: "icisleri",
    ad: "İçişleri",
    tamAd: "İçişleri Bakanlığı",
    ikon: Users,
    aciklama:
      "Halkın devletle her gün karşılaştığı yerdir. Vatandaşın gördüğü hizmetin tamamı bu bakanlıktan yürür.",
    kpi: [
      { k: "halkSagligi", ad: "Halk Sağlığı" },
      { k: "istikrar", ad: "İstikrar" },
    ],
    kollar: [
      { k: "sosyalYardim", ad: "Sosyal Yardım" },
      { k: "guvenlikButcesi", ad: "Güvenlik Bütçesi" },
    ],
    kategoriler: ["Sağlık", "İç Güvenlik"],
    eylemler: [
      {
        id: "ici-sag-1",
        kategori: "Sağlık",
        tur: "KANUN",
        ad: "Kırsal Sağlık Ağı",
        metin:
          "Bir köy muhtarının dilekçesi altı aydır sırada bekliyor: en yakın hastane iki saat uzakta, kışın yol kapanıyor. Tasarı masaya iki farklı model koyuyor.",
        secenekler: [
          {
            ad: "Her ilçeye tam donanımlı sağlık merkezi kur",
            sonuclar: [
              {
                metin: "Kırk yedi ilçede sağlık merkezi hizmete girdi; kırsalda ilk muayene süresi ortalama iki güne indi.",
                alinti:
                  "Torununu ilk kez kendi ilçesinde muayene ettiren bir emekli, «Eskiden bu yol için bir günümü verirdim» dedi.",
                skor: (s) => 50 + s.ist.hazine / 12,
                etki: { halkSagligi: 2, onay: 2, hazine: -5 },
                gecikmeli: { halkSagligi: 2 },
                gecikmeliMetin:
                  "Sağlık merkezleri tam kadroya ulaştı; kırsalda hasta kabulü ikiye katlandı.",
              },
              {
                metin: "Merkezlerin yarısı doktor atanamadığı için kapalı kaldı.",
                alinti:
                  "Açılışa gelen bir hemşire, «Binayı gösterdiler, kadroyu göstermediler» diye sitem etti.",
                skor: (s) => 50 + (30 - s.ist.hazine) / 6,
                etki: { halkSagligi: 1, onay: -1, hazine: -5, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Gezici sağlık ekipleri kur",
            sonuclar: [
              {
                metin: "Yirmi altı ekip haftalık rotayla köyleri dolaşmaya başladı; maliyeti sabit merkezlerin beşte biri.",
                alinti:
                  "Ayda bir tansiyonunu ölçtürebilen bir çiftçi, «Araba kapıya geliyor artık» diye konuştu.",
                skor: (s) => 50 + s.kpi.halkSagligi / 7,
                etki: { halkSagligi: 2, onay: 1, hazine: -2 },
              },
              {
                metin: "Ekipler kışın üç ay boyunca yüksek köylere ulaşamadı.",
                alinti:
                  "Yolu kapalı kalan bir köyün öğretmeni, «Bize gelen tek araç kar küreme aracıydı» sözleriyle anlattı.",
                skor: (s) => 50 + (70 - s.kpi.halkSagligi) / 4,
                etki: { halkSagligi: 1, onay: -2, hazine: -2 },
              },
            ],
          },
        ],
      },
      {
        id: "ici-sag-2",
        kategori: "Sağlık",
        tur: "KARARNAME",
        ad: "İlaç Fiyatlandırma Düzenlemesi",
        metin:
          "Eczane kuyruğunda bekleyen bir emekli, reçetesindeki üç kalemden ikisini geri bırakıyor. Maliyeti karşılayamıyor. Bakanlık masasında iki fiyatlandırma modeli var.",
        secenekler: [
          {
            ad: "Tavan fiyat koy, farkı devlet karşılasın",
            sonuclar: [
              {
                metin: "Tavan fiyat yürürlüğe girdi; eczanelerde reçete tamamlama oranı iki ayda belirgin arttı.",
                alinti:
                  "Üç ilacını da alabilen bir emekli, «Bu ay ilk kez hiçbirini yarım bırakmadım» dedi.",
                skor: (s) => 50 + s.ist.hazine / 15,
                etki: { halkSagligi: 2, onay: 2, hazine: -4 },
              },
              {
                metin: "İki uluslararası üretici düşük kârlı kalemleri Türkiye pazarından çekti.",
                alinti:
                  "Rafında üç ay boyunca aynı ilacı bulamayan bir eczacı, «Reçeteyi yazıyorlar, ilacı ben nereden bulacağım» diye sitem etti.",
                skor: (s) => 50 + (55 - s.ist.kuresel) / 4,
                etki: { halkSagligi: 1, onay: -1, hazine: -4, kuresel: -1 },
              },
            ],
          },
          {
            ad: "Yerli üretimi destekle, ithalata bağımlılığı azalt",
            sonuclar: [
              {
                metin: "Yerli üretime geçiş teşviki verildi; iki fabrika kapasitesini artırdı.",
                alinti:
                  "Vardiyaya yeni katılan bir kalite kontrol mühendisi, «İlk kez ürettiğimiz kutuyu eczanede gördüm» diye konuştu.",
                skor: (s) => 50 + s.kpi.gsyih / 6,
                etki: { halkSagligi: 1, gsyih: 1, hazine: -2 },
                gecikmeli: { halkSagligi: 2 },
                gecikmeliMetin: "Yerli üretim hatları tam kapasiteye ulaştı; ithal ilaç bağımlılığı belirgin geriledi.",
              },
              {
                metin: "Geçiş sürecinde tedarik iki hafta aksadı; bazı kronik hastalar ilacını zamanında bulamadı.",
                alinti:
                  "Annesinin ilacını üç eczane gezip bulan bir çocuk, «Sonuncusunda vardı, o da az kalmıştı» kaydetti.",
                skor: (s) => 50 + (58 - s.kpi.gsyih) / 4,
                etki: { halkSagligi: -1, onay: -1, hazine: -2 },
              },
            ],
          },
          {
            ad: "İhaleyi yakın çevredeki firmaya ver",
            riskli: true,
            gizli: true,
            sonuclar: [
              {
                metin: "İhale hızla sonuçlandı; ilaç tedariki beklenenden erken başladı.",
                alinti:
                  "Süreci takip eden bir eczacılar odası temsilcisi, «Bu kadar hızlı bir ihale görmemiştim» dedi — fiyat farkını fark etmeden.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 4,
                etki: { halkSagligi: 2, hazine: -2, supheDegisim: 8 },
              },
              {
                ifsa: true,
                metin: "İhale belgeleri bir gazetecinin eline geçti; şirketin sahibiyle akrabalık bağı ortaya çıktı.",
                alinti:
                  "Belgeleri inceleyen bir muhalefet vekili, «Şirketin adresiyle bakanlığın adresi aynı sokakta» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3.5,
                etki: { halkSagligi: 1, onay: -2, hazine: -2, supheDegisim: 13 },
              },
            ],
          },
        ],
      },
      {
        id: "ici-sag-3",
        kategori: "Sağlık",
        tur: "OPERASYON",
        bekleme: 3,
        ad: "Salgın Erken Uyarı Sistemi",
        metin:
          "Laboratuvardan gelen numunede beklenmedik bir sonuç var: komşu ildeki üç vakada aynı etken. Henüz salgın değil, ama bakanlık bekleyip görmeyi göze alamıyor.",
        secenekler: [
          {
            ad: "Ülke çapında tarama ve stok seferberliği başlat",
            sonuclar: [
              {
                metin: "Tarama iki hafta içinde tamamlandı; vaka sayısı yayılmadan kontrol altına alındı.",
                alinti:
                  "Taramada pozitif çıkıp erken tedaviye başlayan bir öğretmen, «Belirti bile vermeden yakaladılar» diye konuştu.",
                skor: (s) => 50 + s.kpi.halkSagligi / 6,
                etki: { halkSagligi: 2, istikrar: 1, hazine: -3 },
              },
              {
                metin: "Seferberlik haberi sosyal medyada abartılarak yayıldı; eczanelerde panik alımı başladı.",
                alinti:
                  "Market rafını boşaltan bir müşteriyi gören bir kasiyer, «Daha ilk vaka bile yokken kavga çıktı» sözleriyle anlattı.",
                skor: (s) => 50 + (62 - s.ist.istikrar) / 4,
                etki: { halkSagligi: 1, istikrar: -1, onay: -1, hazine: -3 },
              },
            ],
          },
          {
            ad: "Karantina yerine aşı ve tedavi seferberliği başlat",
            sonuclar: [
              {
                metin: "Aşı dağıtımı bölgesel olarak hızlandırıldı; hayat akışı hiç durmadı.",
                alinti:
                  "İlk dozunu iş çıkışında olan bir vardiya işçisi, «Mesai bitince gidip vurdurdum, işten hiç kalmadım» dedi.",
                skor: (s) => 50 + s.kpi.halkSagligi / 5 + s.ist.hazine / 20,
                etki: { halkSagligi: 3, onay: 1, hazine: -4 },
              },
              {
                metin: "Aşı stoğu üç ilde eş zamanlı yetişmedi; bazı merkezler randevu iptal etti.",
                alinti:
                  "İkinci kez randevusu iptal edilen bir hasta yakını, «Gel dediler, gittik, yok dediler» diye sitem etti.",
                skor: (s) => 50 + (64 - s.kpi.halkSagligi) / 4,
                etki: { halkSagligi: 1, onay: -2, hazine: -4 },
              },
            ],
          },
        ],
      },
      {
        id: "ici-guv-1",
        kategori: "İç Güvenlik",
        tur: "OPERASYON",
        bekleme: 2,
        ad: "Şehir Asayiş Operasyonu",
        metin:
          "Emniyet'in gece raporunda aynı cümle art arda tekrarlanıyor: beş kapkaç, iki saat içinde, aynı meydan. Vali'nin masasında iki seçenek var — biri gösterişli, biri sessiz.",
        secenekler: [
          {
            ad: "Geniş ve görünür operasyon",
            sonuclar: [
              {
                metin: "Meydan çevresinde yoğun devriye başlatıldı; kapkaç ihbarları aynı gün sıfıra indi.",
                alinti: "Meydandaki simitçi, «Sonunda birileri bir şey yaptı» diye konuştu.",
                skor: (s) => 50 + s.kollar.guvenlikButcesi / 5,
                etki: { istikrar: 2, onay: 1, hazine: -2 },
              },
              {
                metin:
                  "Operasyon sırasında bir gencin sert şekilde yere bastırılması kayda girdi, görüntü aynı gece yayıldı.",
                alinti: "Gencin lise öğretmeni, «O çocuğu tanırım, kaçacak biri değildi» dedi.",
                skor: (s) => 50 + (62 - s.ist.onay) / 4,
                etki: { istikrar: 1, onay: -2, kuresel: -1, hazine: -2 },
              },
            ],
          },
          {
            ad: "Mahalle bazlı, düşük profilli çalışma",
            sonuclar: [
              {
                metin: "Sessiz çalışma üç haftada meydandaki asayişi düzeltti; kimse operasyondan haberdar olmadı.",
                alinti: "Mahalle bekçisi, «Kimse fark etmedi ama sokak sakinleşti» diye ifade etti.",
                skor: (s) => 50 + s.ist.onay / 6,
                etki: { istikrar: 1, hazine: -1 },
              },
              {
                metin: "Düşük profil yeterli caydırıcılığı sağlayamadı; olaylar başka bir meydana kaydı.",
                alinti: "Yeni meydandaki bir işletme sahibi, «Onlar oradan kalktı, buraya geldi» kaydetti.",
                skor: (s) => 50 + (58 - s.ist.istikrar) / 4,
                etki: { istikrar: -1, hazine: -1 },
              },
            ],
          },
          {
            ad: "Muhalif gösterileri hedef alan özel birim kur",
            riskli: true,
            sonuclar: [
              {
                metin: "Sokak eylemleri hızla dağıtıldı; şehir merkezinde gösteri sayısı belirgin azaldı.",
                alinti:
                  "Birimin çalışmasını öven bir esnaf, «Artık dükkânı açık bırakabiliyorum» dedi — birimin görev tanımından habersiz.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 4,
                etki: { istikrar: 2, onay: -1, supheDegisim: 9 },
              },
              {
                metin: "Birimin bir gösteride kullandığı yöntem kayda girdi; orantısızlık tartışması büyüdü.",
                alinti:
                  "Görüntüde yaralanan bir üniversite öğrencisi, «Sadece pankart açmıştık» sözleriyle anlattı.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3.5,
                etki: { istikrar: 1, onay: -2, kuresel: -1, supheDegisim: 13 },
              },
            ],
          },
        ],
      },
      {
        id: "ici-guv-2",
        kategori: "İç Güvenlik",
        tur: "KANUN",
        buyuk: true,
        ad: "Polis Teşkilatı Reformu",
        metin:
          "Bir kolluk yetkisi tartışması aylardır meclis gündeminde dönüyor: teşkilata daha çok yetki mi, üzerine daha çok denetim mi. İki kanat da metni kendi lehine yazmak istiyor.",
        secenekler: [
          {
            ad: "Yetkileri genişlet, müdahale gücünü artır",
            sonuclar: [
              {
                metin: "Yeni yetkiler yürürlüğe girdi; olaylara müdahale süresi ortalama dört dakika kısaldı.",
                alinti:
                  "Ev soygunu sırasında polisi arayan bir vatandaş, «Telefonu kapatmadan kapıdaydılar» dedi.",
                skor: (s) => 50 + s.ist.istikrar / 5,
                etki: { istikrar: 3, onay: 1, hazine: -3, kuresel: -1 },
              },
              {
                metin: "Genişleyen yetki ilk ayda üç şikâyet dosyasına konu oldu; savcılık inceleme başlattı.",
                alinti:
                  "Şikâyet dilekçesini kaydettiren bir avukat, «Yetki sınırı belirsizleşince böyle oluyor» diye ifade etti.",
                skor: (s) => 50 + (58 - s.ist.onay) / 3.5,
                etki: { istikrar: 2, onay: -2, kuresel: -2, hazine: -3 },
              },
            ],
          },
          {
            ad: "Bağımsız denetim kur, şeffaflığı artır",
            sonuclar: [
              {
                metin: "Bağımsız şikâyet kurulu kuruldu; ilk üç ayda kolluğa yönelik şikâyet sayısı yarıya indi.",
                alinti:
                  "Kurula başvurup sonuç alan bir vatandaş, «İlk kez birileri gerçekten dinledi» diye konuştu.",
                skor: (s) => 50 + s.kollar.hukumetSeffafligi / 5,
                etki: { onay: 2, kuresel: 1, hazine: -2 },
                gecikmeli: { istikrar: 2 },
                gecikmeliMetin: "Denetim kurulunun raporları teşkilat içi uygulamaları değiştirdi; vatandaş güveni yükseldi.",
              },
              {
                metin: "Teşkilat içinde moral bozuldu; bazı birimlerde inisiyatif alma isteksizliği raporlandı.",
                alinti:
                  "On sekiz yıllık bir memur, «Her adımda soru işareti varsa kimse harekete geçmez» diye sitem etti.",
                skor: (s) => 50 + (60 - s.ist.istikrar) / 4,
                etki: { onay: 1, istikrar: -2, hazine: -2 },
              },
            ],
          },
          {
            ad: "Teşkilatı doğrudan kendine bağla",
            riskli: true,
            sonuclar: [
              {
                metin: "Emir komuta tek elde toplandı; talimatlar aynı gün sahaya iniyor artık.",
                alinti:
                  "Yeni düzenden memnun bir birim amiri, «Artık kimseye danışmadan karar veriyorum» dedi.",
                skor: (s) => 50 + s.kollar.partiSadakati / 4,
                etki: { istikrar: 2, koalisyon: 2, supheDegisim: 9 },
              },
              {
                metin: "Kolluğun siyasallaştığı iddiası bir hukuk fakültesi paneline konu oldu.",
                alinti:
                  "Panelde konuşan bir anayasa hukukçusu, «Emir komuta zinciri artık yargıyı değil, sizi gösteriyor» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3.5,
                etki: { istikrar: 1, onay: -2, kuresel: -1, supheDegisim: 14 },
              },
            ],
          },
        ],
      },
      {
        id: "ici-guv-3",
        kategori: "İç Güvenlik",
        tur: "KARARNAME",
        ad: "Uyuşturucu ile Mücadele Programı",
        metin:
          "Bir lise müdürü, okul çevresinde satış yapan kişilerin üç ayda bir değiştiğini söylüyor: «Birini yakalıyoruz, yerine yenisi geçiyor.» Program iki farklı hattı deniyor.",
        secenekler: [
          {
            ad: "Cezaları ağırlaştır, satıcıların üstüne git",
            sonuclar: [
              {
                metin: "Okul çevresi operasyonları sıklaştırıldı; ihbar sayısı iki ayda gözle görülür arttı.",
                alinti: "Kızının okul yolunu artık rahat bıraktığını söyleyen bir baba, «Kapının önünde artık kimse yok» dedi.",
                skor: (s) => 50 + s.kollar.guvenlikButcesi / 6,
                etki: { istikrar: 2, onay: 1, hazine: -3 },
              },
              {
                metin: "Satış noktaları okul çevresinden mahalle aralarına kaydı; şikâyetler yer değiştirdi.",
                alinti:
                  "Yeni bir mahallede endişelenen bir apartman yöneticisi, «Onlar oradan kovuldu, şimdi bize geldi» diye sitem etti.",
                skor: (s) => 50 + (60 - s.ist.istikrar) / 4,
                etki: { istikrar: -1, hazine: -3 },
              },
            ],
          },
          {
            ad: "Tedavi ve rehabilitasyon merkezleri aç",
            sonuclar: [
              {
                metin: "İlk rehabilitasyon merkezi kapasitesinin üzerinde başvuru aldı; bekleme listesi oluştu.",
                alinti:
                  "Oğlunu tedaviye yazdıran bir anne, «İlk kez bir yer gösterdiler, hep 'kendin hallet' dediler» sözleriyle anlattı.",
                skor: (s) => 50 + s.kpi.halkSagligi / 6,
                etki: { halkSagligi: 2, istikrar: 1, hazine: -4 },
                gecikmeli: { halkSagligi: 1, istikrar: 1 },
                gecikmeliMetin: "Merkezlerdeki ilk tedavi grubu programı tamamladı; bölgede tekrar vaka oranı düştü.",
              },
              {
                metin: "Merkez kapasitesi talebi karşılamadı; başvuru yapan bir kısmı sıraya bile giremedi.",
                alinti: "Kapıdan geri çevrilen bir başvurucunun kardeşi, «Altı ay sonrası için tarih verdiler» diye ifade etti.",
                skor: (s) => 50 + (66 - s.kpi.halkSagligi) / 4,
                etki: { halkSagligi: 1, onay: -1, hazine: -4 },
              },
            ],
          },
        ],
      },
    ],
  },

  askeri: {
    k: "askeri",
    ad: "Askeri",
    tamAd: "Milli Savunma Bakanlığı",
    ikon: Shield,
    aciklama:
      "Ülkenin güvenliğinden ve dış dünyadaki ağırlığından sorumludur. Caydırıcılık da, masaya oturmak da buradan yürütülür.",
    kpi: [
      { k: "hazirlik", ad: "Hazırlık" },
      { k: "kuresel", ad: "Küresel" },
    ],
    kollar: [
      { k: "askeriButce", ad: "Askeri Bütçe" },
      { k: "disPolitika", ad: "Dış Politika Sertliği" },
    ],
    kategoriler: ["Savunma", "Diplomasi"],
    eylemler: [
      {
        id: "ask-sav-1",
        kategori: "Savunma",
        tur: "KANUN",
        buyuk: true,
        ad: "Savunma Sanayii Yatırım Yasası",
        metin:
          "Genelkurmay'ın son tedarik raporu tek satırda özetleniyor: kritik parçaların yüzde yetmişi hâlâ ithal. Yasa, bu oranı tersine çevirmeyi vaat ediyor — ama faturası ağır.",
        secenekler: [
          {
            ad: "Devlet eliyle büyük ölçekli sanayi kur",
            sonuclar: [
              {
                metin: "İlk üretim tesisi temeli atıldı; bölgede altı bin kişilik istihdam planlandı.",
                alinti:
                  "Temel atma törenine katılan bir mühendislik öğrencisi, «Mezun olunca yurt dışına gitmeme gerek kalmayabilir» dedi.",
                skor: (s) => 50 + s.ist.hazine / 12 + s.kpi.gsyih / 9,
                etki: { gsyih: 2, hazine: -5, kuresel: -1 },
                gecikmeli: { hazirlik: 3, istihdam: 2 },
                gecikmeliMetin: "İlk üretim hattı devreye girdi; ordu kritik parçaların bir kısmını artık yerli tedarik ediyor.",
              },
              {
                metin: "Yatırımın üçte biri harcandıktan sonra teknoloji transferinde anlaşmazlık çıktı; proje durdu.",
                alinti:
                  "Projeden ayrılan bir yabancı danışman, «Bize verilmesi gereken bilgiyi vermediler, biz de vermedik» diye ifade etti.",
                skor: (s) => 50 + (35 - s.ist.hazine) / 6,
                etki: { hazine: -5, onay: -1, gsyih: -1 },
              },
            ],
          },
          {
            ad: "Yabancı ortaklıkla lisanslı üretime geç",
            sonuclar: [
              {
                metin: "Ortaklık anlaşması imzalandı; ilk parti lisanslı üretim altı ayda başladı.",
                alinti:
                  "Fabrikada göreve başlayan bir teknisyen, «Elimizde artık kendi el kitabımız var» diye konuştu.",
                skor: (s) => 50 + s.ist.kuresel / 5,
                etki: { hazine: -3, kuresel: 2 },
              },
              {
                metin: "Ortak, sözleşmede belirtilen kritik modülü paylaşmadı; üretim montaj seviyesinde kaldı.",
                alinti:
                  "Sözleşmeyi hazırlayan bir hukuk müşaviri, «Maddeyi yazdık ama denetleyecek mekanizmayı koymadık» kaydetti.",
                skor: (s) => 50 + (55 - s.ist.kuresel) / 4,
                etki: { hazine: -3, onay: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "ask-sav-2",
        kategori: "Savunma",
        tur: "KARARNAME",
        ad: "Sınır Güvenlik Hattı",
        metin:
          "Sınır karakolundaki teğmen, son üç aydır aynı raporu tekrarlıyor: kaçak geçiş noktaları artıyor, personel sayısı aynı kalıyor. Karar masanda bekliyor.",
        secenekler: [
          {
            ad: "Fiziki engel ve devriye ağını genişlet",
            sonuclar: [
              {
                metin: "Yeni gözetleme kuleleri ve devriye rotalarıyla sınır hattı iki ayda sıkılaştırıldı.",
                alinti: "Karakol komutanı, «Artık aynı noktadan üç kez geçmeye çalışan olmuyor» diye konuştu.",
                skor: (s) => 50 + s.kollar.askeriButce / 5,
                etki: { hazirlik: 2, istikrar: 1, hazine: -3 },
              },
              {
                metin: "Fiziki engel inşaatı komşu ülkede resmi protesto notasına konu oldu.",
                alinti: "Sınırın öte yakasındaki bir belediye başkanı, «Bize danışılmadı» diye sitem etti.",
                skor: (s) => 50 + (56 - s.ist.kuresel) / 4,
                etki: { hazirlik: 1, kuresel: -2, hazine: -3 },
              },
            ],
          },
          {
            ad: "Teknolojik gözetim sistemine yatır",
            sonuclar: [
              {
                metin: "Sensör ağı devreye girdi; personel ihtiyacı azalırken tespit oranı arttı.",
                alinti: "Kontrol merkezindeki bir operatör, «Artık ekrandan görüyoruz, koşarak gitmiyoruz» dedi.",
                skor: (s) => 50 + s.kpi.gsyih / 6,
                etki: { hazirlik: 2, hazine: -2 },
              },
              {
                metin: "Sistem ilk kış şartlarında beklenen performansı göstermedi; iki bölgede kör nokta oluştu.",
                alinti: "Sahadaki bir teknisyen, «Kar yağınca sensörler yanlış alarm vermeye başladı» diye ifade etti.",
                skor: (s) => 50 + (58 - s.kpi.gsyih) / 4,
                etki: { hazirlik: 1, hazine: -2, onay: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "ask-sav-3",
        kategori: "Savunma",
        tur: "OPERASYON",
        bekleme: 3,
        ad: "Ortak Tatbikat",
        metin:
          "Müttefik ordusundan gelen davet masanda: ortak tatbikat teklifi. Katılım hem hazırlığını sınayacak hem de kimlerin izlediğini hatırlatacak.",
        secenekler: [
          {
            ad: "Geniş katılımlı, görünür bir tatbikat düzenle",
            sonuclar: [
              {
                metin: "Tatbikat planlandığı gibi tamamlandı; ortak komuta koordinasyonu övgüyle değerlendirildi.",
                alinti: "Tatbikata gözlemci gönderen bir müttefik subay, «Bu seviyede bir koordinasyon beklemiyorduk» dedi.",
                skor: (s) => 50 + s.kpi.hazirlik / 5,
                etki: { hazirlik: 2, kuresel: 2, hazine: -2 },
              },
              {
                metin: "Tatbikat sırasında bir iletişim protokolü aksadı; rapor müttefik karargâhına iletildi.",
                alinti: "Koordinasyon subayı, «Radyo frekansı son dakikada değişmişti, herkese ulaşmadı» diye ifade etti.",
                skor: (s) => 50 + (62 - s.kpi.hazirlik) / 4,
                etki: { hazirlik: 1, kuresel: -1, hazine: -2 },
              },
            ],
          },
          {
            ad: "Kendi birliklerinle kapalı tatbikat yap",
            sonuclar: [
              {
                metin: "Kapalı tatbikat eksikleri sessizce ortaya çıkardı; üç birim yeniden eğitime alındı.",
                alinti: "Tatbikatı yöneten kurmay subay, «Kimse izlemezken hatalar daha rahat itiraf ediliyor» kaydetti.",
                skor: (s) => 50 + s.kollar.askeriButce / 5,
                etki: { hazirlik: 2, hazine: -1 },
              },
              {
                metin: "Kapalı kapıların ardında yapılması müttefik çevrelerde mesafe koyma olarak yorumlandı.",
                alinti: "Ortak istihbarat toplantısına katılan bir diplomat, «Bu sefer bizi çağırmadılar» diye sitem etti.",
                skor: (s) => 50 + (56 - s.ist.kuresel) / 4,
                etki: { hazirlik: 1, kuresel: -1, hazine: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "ask-dip-1",
        kategori: "Diplomasi",
        tur: "KANUN",
        ad: "Bölgesel İşbirliği Anlaşması",
        metin:
          "Sınır kapısında kamyon kuyruğu üçüncü güne girdi; şoförler kabinlerinde bekliyor. Masadaki çerçeve metin ticareti, enerjiyi ve güvenliği tek pakete bağlıyor — meclisteki milliyetçi kanat paketin adını duymak bile istemiyor.",
        secenekler: [
          {
            ad: "Kapsamlı anlaşmayı imzala",
            sonuclar: [
              {
                metin: "Anlaşma yürürlüğe girdi; sınır geçiş süresi üç günden dokuz saate indi.",
                alinti:
                  "Kuyrukta bekleyen bir tır şoförü, «Bu yıl bayramı ilk defa evde geçireceğim» dedi.",
                skor: (s) => 50 + s.ist.kuresel / 4.5,
                etki: { kuresel: 3, gsyih: 1, hazine: 2, hazirlik: -1 },
                gecikmeli: { gsyih: 2, istihdam: 1 },
                gecikmeliMetin:
                  "Sınır ticareti hacmi oturdu; iki ilde yeni lojistik merkezleri açıldı.",
              },
              {
                metin: "Anlaşmanın taviz maddeleri kamuoyuna sızdı; egemenlik tartışması meclise taşındı.",
                alinti:
                  "Metni müzakere eden bir diplomat, «O maddeyi biz koymadık, karşılığında ne aldığımız da metinde yazıyor» diye ifade etti.",
                skor: (s) => 50 + (60 - s.ist.onay) / 3.5,
                etki: { kuresel: 2, onay: -3, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Yalnızca ticaret başlığıyla sınırlı tut",
            sonuclar: [
              {
                metin: "Dar kapsamlı metin sessizce imzalandı; kimse egemenlikten söz etmedi.",
                alinti:
                  "Sınır ilçesinde dükkânı olan bir esnaf, «Siyaseti bilmem, malım iki gün erken geliyor» diye konuştu.",
                skor: (s) => 50 + s.kpi.gsyih / 5,
                etki: { kuresel: 2, gsyih: 1, onay: -1 },
              },
              {
                metin: "Ortaklar dar kapsamı yetersiz buldu; güvenlik başlığı masadan kalktı.",
                alinti:
                  "Görüşmeye katılan bir müsteşar, «Bize kapıyı kapatmadılar ama bir daha da çağırmadılar» dedi.",
                skor: (s) => 50 + (58 - s.ist.kuresel) / 4,
                etki: { kuresel: 1, hazirlik: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "ask-dip-2",
        kategori: "Diplomasi",
        tur: "KARARNAME",
        ad: "Büyükelçilik Ağı Genişletmesi",
        metin:
          "Dışişleri'nin masasında bir liste var: temsil edilmeyen on iki ülke. Her biri için ayrı bir misyon açmak mümkün — ama her misyonun bir bütçe kalemi var.",
        secenekler: [
          {
            ad: "Yeni misyonlar aç, diplomat kadrosunu büyüt",
            sonuclar: [
              {
                metin: "Dört yeni büyükelçilik açıldı; ilk resmi ziyaretler takvime girdi.",
                alinti: "Yeni açılan misyonda göreve başlayan bir diplomat, «Burada ilk Türk temsilci benim» diye konuştu.",
                skor: (s) => 50 + s.ist.hazine / 15,
                etki: { kuresel: 2, hazine: -3 },
              },
              {
                metin: "Misyonların ikisinde deneyimli kadro bulunamadı; ilk raporlar gecikmeli geldi.",
                alinti: "Dışişleri'nden bir müsteşar yardımcısı, «Bina hazırdı, insan hazır değildi» diye ifade etti.",
                skor: (s) => 50 + (30 - s.ist.hazine) / 6,
                etki: { kuresel: 1, hazine: -3 },
              },
            ],
          },
          {
            ad: "Mevcut misyonları güçlendir, yenisini açma",
            sonuclar: [
              {
                metin: "Var olan büyükelçiliklere ek personel atandı; raporlama sıklığı iki katına çıktı.",
                alinti: "Bölge masası şefi, «Artık her hafta güncel bilgi geliyor, ay sonunu beklemiyoruz» dedi.",
                skor: (s) => 50 + s.ist.kuresel / 5,
                etki: { kuresel: 1, hazine: -1 },
              },
              {
                metin: "Genişleme olmayınca temsil edilmeyen ülkelerden biri başka bir başkente yakınlaştı.",
                alinti: "Bölgeyi izleyen bir gazeteci, «O ülke artık bizim değil, komşumuzun ortağı» kaydetti.",
                skor: (s) => 50 + (56 - s.ist.kuresel) / 4,
                etki: { kuresel: -1, hazine: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "ask-dip-3",
        kategori: "Diplomasi",
        tur: "OPERASYON",
        bekleme: 4,
        ad: "Uluslararası Zirveye Ev Sahipliği",
        metin:
          "Bölgesel bir zirvenin ev sahipliği masaya geldi. Kabul edersen üç ay boyunca başkent dünyanın gözü önünde olacak — her ayrıntı dahil.",
        secenekler: [
          {
            ad: "Zirveyi üstlen, görkemli bir organizasyon yap",
            sonuclar: [
              {
                metin: "Zirve planlandığı gibi geçti; sonuç bildirisinde ev sahibi ülke olarak öne çıkarıldı.",
                alinti: "Zirveyi izleyen bir yabancı muhabir, «Organizasyon beklediğimizden düzenliydi» diye konuştu.",
                skor: (s) => 50 + s.ist.istikrar / 5 + s.ist.hazine / 20,
                etki: { kuresel: 2, onay: 1, hazine: -3 },
              },
              {
                metin: "Zirve günlerinde şehir merkezinde trafik kilitlendi; yerel esnaf zarar bildirdi.",
                alinti: "Zirve güzergâhındaki bir kafe işletmecisi, «On gün kapımı açan olmadı» diye sitem etti.",
                skor: (s) => 50 + (62 - s.ist.istikrar) / 4,
                etki: { kuresel: 1, onay: -2, hazine: -3 },
              },
            ],
          },
          {
            ad: "Katılımcı ol, ev sahipliğini başkasına bırak",
            sonuclar: [
              {
                metin: "Zirveye normal katılımcı sıfatıyla gidildi; masadaki yerini korudu, maliyet düşük kaldı.",
                alinti: "Heyete katılan bir müsteşar, «Bu sefer arka planda kalmayı tercih ettik» dedi.",
                skor: (s) => 50 + s.ist.kuresel / 5,
                etki: { kuresel: 1, hazine: -1 },
              },
              {
                metin: "Ev sahipliğini üstlenen ülke zirveden görünürlük kazandı; bizim katkımız bildiride tek cümlede geçti.",
                alinti: "Zirve sonrası değerlendirme yazan bir dış politika yazarı, «Masada oturduk ama sesimiz çok kısıktı» kaydetti.",
                skor: (s) => 50 + (58 - s.ist.kuresel) / 4,
                etki: { onay: -1, hazine: -1 },
              },
            ],
          },
        ],
      },
    ],
  },

  yonetim: {
    k: "yonetim",
    ad: "Yönetim",
    tamAd: "Yönetim Başkanlığı",
    ikon: Scale,
    aciklama:
      "Devleti denetleyen ve gerektiğinde olağanüstü yetki kullanan makamdır. Seni koruyan da, hesap soran da burasıdır.",
    kpi: [
      { k: "supheKpi", ad: "Şüphe" },
      { k: "istikrar", ad: "İstikrar" },
    ],
    kollar: [
      { k: "yargiBagimsizligi", ad: "Yargı Bağımsızlığı" },
      { k: "basinDenetimi", ad: "Basın Denetimi" },
    ],
    kategoriler: ["Denetim", "Olağanüstü Yetki"],
    eylemler: [
      {
        id: "yon-den-1",
        kategori: "Denetim",
        tur: "KANUN",
        ad: "Kamu Denetim Kurumu",
        metin:
          "Bir müfettişin hazırladığı rapor üç bakanlıkta sırayla kayboldu, dördüncüsünde ortaya çıktı. Kurulacak denetim kurumu bu tür raporları doğrudan yayımlayacak — seninkiler dahil.",
        secenekler: [
          {
            ad: "Tam bağımsız kurum kur, kendini de denetime aç",
            sonuclar: [
              {
                metin: "Kurum ilk üç ayda dört bakanlık raporunu kesintisiz yayımladı.",
                alinti:
                  "Yıllardır aynı raporları hazırlayan bir müfettiş, «İlk defa yazdığım şey kaybolmadı» dedi.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 5,
                etki: { onay: 2, kuresel: 2, supheDegisim: -18, hazine: -3 },
              },
              {
                metin:
                  "Kurumun ilk incelemesi kabinedeki bir ismi doğrudan hedef aldı; koalisyon ortağı rahatsızlığını yazılı iletti.",
                alinti:
                  "Koalisyon ortağının grup başkanvekili, «Biz bu kurumu kurarken bunu konuşmamıştık» diye sitem etti.",
                skor: (s) => 50 + (60 - s.kollar.hukumetSeffafligi) / 4,
                etki: { onay: 1, koalisyon: -2, supheDegisim: -12, hazine: -3 },
              },
            ],
          },
          {
            ad: "Kurumu başkanlığa bağlı kur, denetimi kontrol altında tut",
            sonuclar: [
              {
                metin: "Kurum kuruldu ve başkanlığa bağlı çalışmaya başladı; ilk rapor kamuya açılmadı.",
                alinti:
                  "Kurumda göreve başlayan bir uzman, «Raporu yazdım, nereye gittiğini bilmiyorum» kaydetti.",
                skor: (s) => 50 + (60 - s.kollar.yargiBagimsizligi) / 5,
                etki: { istikrar: 1, supheDegisim: -5, hazine: -2, kuresel: -1 },
              },
              {
                metin:
                  "«Kendi kendini denetleyen hükümet» başlığı üç gün üst üste manşetlerde kaldı.",
                alinti:
                  "Konuyu yazan bir köşe yazarı, «Denetim kurumu kurdular, denetleyeni de kendileri seçti» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 5,
                etki: { onay: -2, kuresel: -2, supheDegisim: 4, hazine: -2 },
              },
            ],
          },
        ],
      },
      {
        id: "yon-den-2",
        kategori: "Denetim",
        tur: "KARARNAME",
        ad: "Kabine İç Soruşturması",
        metin:
          "Bir bakanlıktaki ihale dosyasında iki imza aynı güne ait ama iki farklı şehirden atılmış. Soruşturmayı sen başlatabilirsin — nereye varacağını sen de bilmiyorsun.",
        secenekler: [
          {
            ad: "Soruşturmayı başlat, çıkanı kamuoyuyla paylaş",
            sonuclar: [
              {
                metin: "Soruşturma sonucunda iki müsteşar görevden alındı; dosya savcılığa gönderildi.",
                alinti:
                  "Görevden alınan ismin yerine gelen bir bürokrat, «Masaya oturduğumda ilk işim eski dosyaları açmak oldu» diye konuştu.",
                skor: (s) => 50 + s.ist.onay / 5,
                etki: { onay: 2, supheDegisim: -15, koalisyon: -1 },
              },
              {
                metin:
                  "Soruşturma koalisyon ortağının atadığı isimlere ulaştı; ortaklık masasında tartışma çıktı.",
                alinti:
                  "Ortağın il başkanı, «Bize danışmadan bizim adamımızı soruşturdular» diye sitem etti.",
                skor: (s) => 50 + (58 - s.koalisyon) / 3,
                etki: { onay: 1, koalisyon: -3, supheDegisim: -10 },
              },
            ],
          },
          {
            ad: "Soruşturmayı içeride tut, sonucu açıklama",
            sonuclar: [
              {
                metin: "İki isim sessizce görevden alındı; hiçbir açıklama yapılmadı.",
                alinti:
                  "Aynı katta çalışan bir memur, «Bir sabah geldik, odası boşaltılmıştı» kaydetti.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 5,
                etki: { istikrar: 1, supheDegisim: -4, onay: -1 },
              },
              {
                metin: "Kapalı yürütülen soruşturmanın tutanakları bir haber sitesine ulaştı.",
                alinti:
                  "Tutanakları yayımlayan gazeteci, «Soruşturma vardı, sonuç yoktu, ceza hiç yoktu» diye ifade etti.",
                skor: (s) => 50 + (60 - s.kollar.basinDenetimi) / 4,
                etki: { onay: -2, supheDegisim: 8 },
              },
            ],
          },
        ],
      },
      {
        id: "yon-den-3",
        kategori: "Denetim",
        tur: "OPERASYON",
        bekleme: 3,
        ad: "Basın Toplantısı",
        metin:
          "Salon hazır, sandalyeler dolu, ilk sıradaki muhabirin elinde katlanmış bir kâğıt var. Kaç soru alacağına henüz karar vermedin.",
        secenekler: [
          {
            ad: "Tüm soruları al, hiçbirini geçiştirme",
            sonuclar: [
              {
                metin: "Toplantı planlanandan kırk dakika uzun sürdü; gündemdeki iddialara tek tek cevap verildi.",
                alinti:
                  "Salondaki bir muhabir, «On yıldır bu salondayım, ilk kez sıra bana geldi» diye konuştu.",
                skor: (s) => 50 + s.kollar.hukumetSeffafligi / 5,
                etki: { onay: 2, supheDegisim: -12, kuresel: 1, istikrar: -1 },
              },
              {
                metin:
                  "Bir soruda verilen rakam kayıtlarla uyuşmadı; o bölüm kesilip günlerce paylaşıldı.",
                alinti:
                  "Kaydı ilk paylaşan bir veri gazetecisi, «Rakamı biz uydurmadık, kürsüde söylendi» diye ifade etti.",
                skor: (s) => 50 + (62 - s.ist.onay) / 4,
                etki: { onay: -2, supheDegisim: -3 },
              },
            ],
          },
          {
            ad: "Kısa açıklama yap, soru alma",
            sonuclar: [
              {
                metin: "Yedi dakikalık açıklama okundu; salon soru sorulmadan boşaltıldı.",
                alinti:
                  "Salondan çıkan bir muhabir, «Metni zaten e-postayla göndermişlerdi» kaydetti.",
                skor: (s) => 50 + s.ist.istikrar / 5,
                etki: { supheDegisim: -5, onay: -1 },
              },
              {
                metin: "Soru alınmaması gündemi büyüttü; ertesi gün aynı konu manşetlere taşındı.",
                alinti:
                  "Bir yayın yönetmeni, «Cevap vermemek de bir cevaptır» sözleriyle anlattı.",
                skor: (s) => 50 + (60 - s.kollar.hukumetSeffafligi) / 4,
                etki: { onay: -2, supheDegisim: 5 },
              },
            ],
          },
        ],
      },
      {
        id: "yon-oly-1",
        kategori: "Olağanüstü Yetki",
        tur: "KARARNAME",
        riskli: true,
        ad: "Olağanüstü Hâl Yetkisi",
        metin:
          "Hukuk müşavirin metni masaya bırakırken tek soru soruyor: «Süre kısmını boş mu bırakalım?» Cevabın, kararnamenin ne kadar süreceğini belirleyecek.",
        secenekler: [
          {
            ad: "Dar kapsamlı ve süreli yetki al",
            sonuclar: [
              {
                metin: "Yetki üç aylık süreyle sınırlandı ve süresi dolduğunda kendiliğinden sona erdi.",
                alinti:
                  "Süreci izleyen bir idare hukukçusu, «Bitiş tarihi yazılmış bir kararname nadirdir» diye konuştu.",
                skor: (s) => 50 + s.ist.istikrar / 5,
                etki: { istikrar: 2, supheDegisim: 6 },
              },
              {
                metin: "Dar kapsam bile barolarca eleştirildi; iki ilde itiraz dilekçesi verildi.",
                alinti:
                  "Dilekçeyi hazırlayan bir baro temsilcisi, «Kapsam dar ama gerekçe hâlâ belirsiz» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 4,
                etki: { istikrar: 1, onay: -2, supheDegisim: 10 },
              },
            ],
          },
          {
            ad: "Geniş ve süresiz yetki al",
            sonuclar: [
              {
                metin: "Kararname süre sınırı olmadan yayımlandı; kararlar artık aynı gün uygulanıyor.",
                alinti:
                  "Bir vali yardımcısı, «Eskiden onay için üç hafta beklerdik, şimdi sabah yazıyoruz öğlen uyguluyoruz» dedi.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 4,
                etki: { istikrar: 2, koalisyon: 2, kuresel: -2, supheDegisim: 14 },
              },
              {
                metin:
                  "Süresiz yetki uluslararası bir hukuk raporuna konu oldu; iki müttefik açıklama yaptı.",
                alinti:
                  "Raporu hazırlayan bir gözlemci, «Olağanüstü olan, olağan hâle gelmiş» kaydetti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3.5,
                etki: { istikrar: 1, onay: -2, kuresel: -3, supheDegisim: 17 },
              },
            ],
          },
        ],
      },
      {
        id: "yon-oly-2",
        kategori: "Olağanüstü Yetki",
        tur: "OPERASYON",
        bekleme: 3,
        riskli: true,
        ad: "Kritik Atama",
        metin:
          "Boşalan üç üst düzey makam için önünde iki liste var. Birinde sınav sıralaması yazıyor, diğerinde telefon numaraları.",
        secenekler: [
          {
            ad: "Liyakate göre ata, tarafsız isimler seç",
            sonuclar: [
              {
                metin: "Atamalar sınav sıralamasına göre yapıldı; üç kurumda işlem süreleri kısaldı.",
                alinti:
                  "Atanan isimlerden biriyle çalışan bir şube müdürü, «Dosyayı bilen biri geldi, fark ediyor» diye konuştu.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 5,
                etki: { istikrar: 1, kuresel: 1, supheDegisim: -8, koalisyon: -1 },
              },
              {
                metin: "Tarafsız isimler bazı talimatları yazılı isteyince süreçler yavaşladı.",
                alinti:
                  "Bir bakanlık kalem müdürü, «Eskiden telefonla hallolurdu, şimdi her şey yazıya döküldü» diye sitem etti.",
                skor: (s) => 50 + (55 - s.kollar.partiSadakati) / 4,
                etki: { koalisyon: -2, supheDegisim: -5, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Kendi adamlarını ata",
            sonuclar: [
              {
                metin: "Üç makam da aynı hafta dolduruldu; talimatlar itirazsız uygulanmaya başladı.",
                alinti:
                  "Atananlardan biriyle çalışan bir uzman, «Artık kimse 'bu mevzuata uymaz' demiyor» dedi.",
                skor: (s) => 50 + s.kollar.partiSadakati / 4,
                etki: { koalisyon: 2, istikrar: 2, supheDegisim: 12 },
              },
              {
                metin: "Üç atamanın da aynı il kökenli olduğu bir haber sitesinde tabloyla yayımlandı.",
                alinti:
                  "Aynı makama üç kez başvurup alınmayan bir aday, «Benim eksiğim neydi, hâlâ bilmiyorum» sözleriyle anlattı.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 4,
                etki: { koalisyon: 1, onay: -2, kuresel: -1, supheDegisim: 15 },
              },
            ],
          },
        ],
      },
      {
        id: "yon-oly-3",
        kategori: "Olağanüstü Yetki",
        tur: "OPERASYON",
        bekleme: 4,
        riskli: true,
        ad: "Gündem Yönetimi",
        metin:
          "Aleyhine dönen bir haber üçüncü gündür manşette. İletişim direktörü iki yol öneriyor: birini duyurursun, diğerini kimse duymaz.",
        secenekler: [
          {
            ad: "Büyük bir icraat duyurusuyla gündemi değiştir",
            sonuclar: [
              {
                metin: "Duyuru aynı akşam bültenleri kapladı; önceki konu iki günde gündemden düştü.",
                alinti:
                  "Duyurulan projenin yapılacağı ilçede oturan bir emekli, «Sonunda buraya da bir şey yapılıyor» diye konuştu.",
                skor: (s) => 50 + s.ist.hazine / 12,
                etki: { onay: 2, hazine: -3, supheDegisim: 3 },
              },
              {
                metin: "Duyurunun bütçesi olmadığı ortaya çıktı; proje takvimi hiçbir yerde kayıtlı değildi.",
                alinti:
                  "Projeyi araştıran bir yerel gazeteci, «Belediyeye sordum, haberleri bile yokmuş» diye ifade etti.",
                skor: (s) => 50 + (20 - s.ist.hazine) / 5,
                etki: { onay: -2, supheDegisim: 7 },
              },
            ],
          },
          {
            ad: "Basına doğrudan müdahale et, haberi düşür",
            sonuclar: [
              {
                metin: "Haber ertesi sabah ana sayfadan kaldırıldı; hiçbir açıklama yapılmadı.",
                alinti:
                  "Haberi hazırlayan muhabirin editörü, «Bana sadece 'bugün olmaz' dendi» kaydetti.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 3.5,
                etki: { onay: 1, istikrar: 1, kuresel: -2, supheDegisim: 16 },
              },
              {
                metin:
                  "Haberin kaldırılma yazışması ekran görüntüsüyle paylaşıldı; uluslararası basın örgütleri açıklama yaptı.",
                alinti:
                  "İstifa eden bir yayın yönetmeni, «Yirmi yıllık meslek hayatımda ilk kez böyle bir yazı aldım» diye sitem etti.",
                skor: (s) => 50 + (65 - s.kollar.basinDenetimi) / 3,
                etki: { onay: -3, kuresel: -3, supheDegisim: 20 },
              },
            ],
          },
        ],
      },
    ],
  },

  siyaset: {
    k: "siyaset",
    ad: "Siyaset",
    tamAd: "Siyaset Ofisi",
    ikon: Landmark,
    aciklama:
      "Bakanlık değil, senin siyaset masandır. Mecliste çoğunluğunu kaybedersen hiçbir kanun geçmez.",
    kpi: [
      { k: "koalisyon", ad: "Koalisyon" },
      { k: "onay", ad: "Onay" },
    ],
    kollar: [
      { k: "partiSadakati", ad: "Parti Sadakati" },
      { k: "hukumetSeffafligi", ad: "Hükümet Şeffaflığı" },
    ],
    kategoriler: ["Parti", "Gizli İşler"],
    eylemler: [
      {
        id: "siy-par-1",
        kategori: "Parti",
        tur: "OPERASYON",
        bekleme: 3,
        ad: "Olağanüstü Parti Kurultayı",
        metin:
          "Grup toplantısında üç vekil arka sırada fısıldaşıp erken çıktı. Kurmayın önerisi net: kurultayı topla, herkesi aynı salona sok, kürsüden konuş.",
        secenekler: [
          {
            ad: "Sert konuşma yap, muhalifleri tasfiye et",
            sonuclar: [
              {
                metin: "Kürsüden üç isim açıkça hedef alındı; salon o gece sessizce dağıldı.",
                alinti: "Salonda oturan bir il başkanı, «Herkes kimin kastedildiğini biliyordu» diye konuştu.",
                skor: (s) => 50 + s.kollar.partiSadakati / 6,
                etki: { koalisyon: 1, onay: -1, istikrar: 1 },
              },
              {
                metin: "Hedef alınan üç isimden ikisi ertesi gün istifa dilekçesini bastığı yerden bağımsız verdi.",
                alinti: "İstifa eden bir vekil, «Kürsüden isim vermek yerine kapıyı gösterebilirlerdi» diye sitem etti.",
                skor: (s) => 50 + (60 - s.ist.onay) / 4,
                etki: { koalisyon: -2, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Uzlaşmacı ton tuttur, herkesi masada tut",
            sonuclar: [
              {
                metin: "Kürsüden hiçbir isim geçmedi; toplantı kucaklayıcı bir dille kapandı.",
                alinti: "Kararsız gruptaki bir vekil, «Bugün için yeter, konuşuruz» dedi.",
                skor: (s) => 50 + s.ist.onay / 6,
                etki: { koalisyon: 1, onay: -1 },
              },
              {
                metin: "Uzlaşmacı ton bazı kesimlerce kararsızlık olarak okundu; salon dağılırken net bir mesaj çıkmadı.",
                alinti: "Toplantıdan çıkan bir muhabir, «Bir saat konuştu, hiçbir şey söylemedi» diye ifade etti.",
                skor: (s) => 50 + (55 - s.ist.istikrar) / 4,
                etki: { onay: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "siy-par-2",
        kategori: "Parti",
        tur: "KARARNAME",
        ad: "Parti Teşkilat Yatırımı",
        metin:
          "İlçe başkanının raporu kısa: bina kirası iki aydır ödenemiyor, üye kaydı masası artık bir sandalyeden ibaret. Merkez bütçesinden pay istiyor.",
        secenekler: [
          {
            ad: "İlçe teşkilatlarına kaynak aktar, sahaya yay",
            sonuclar: [
              {
                metin: "Kırk iki ilçe teşkilatına ödenek aktarıldı; üye kayıt masaları yeniden açıldı.",
                alinti: "Kirası ödenen bir ilçe başkanı, «Artık ışığı kapatmadan çalışabiliyoruz» dedi.",
                skor: (s) => 50 + s.kollar.partiSadakati / 6,
                etki: { koalisyon: 1, onay: 1, hazine: -3 },
              },
              {
                metin: "Kaynağın bir kısmı iki büyük ilçede toplandı; küçük ilçeler yine geride kaldı.",
                alinti: "Payını az bulan bir ilçe sekreteri, «Büyük ilçeye giden bizim üç katımız» diye sitem etti.",
                skor: (s) => 50 + (58 - s.ist.istikrar) / 4,
                etki: { koalisyon: -1, hazine: -3 },
              },
            ],
          },
          {
            ad: "Merkezde profesyonel bir iletişim ekibi kur",
            sonuclar: [
              {
                metin: "İletişim ekibi kuruldu; parti mesajları ilk kez tek elden koordine edildi.",
                alinti: "Yeni ekipte çalışan bir sosyal medya uzmanı, «Artık üç ayrı hesap aynı şeyi yazmıyor» diye konuştu.",
                skor: (s) => 50 + s.ist.onay / 6,
                etki: { onay: 2, hazine: -2 },
              },
              {
                metin: "Merkezi mesajlar taşrada «hazır cevap» gibi algılandı; bazı yerel yöneticiler mesafeli durdu.",
                alinti: "Bir taşra teşkilat sorumlusu, «Ankara'dan gelen metni okuyor gibi hissettim kendimi» kaydetti.",
                skor: (s) => 50 + (62 - s.kollar.hukumetSeffafligi) / 4,
                etki: { onay: 1, koalisyon: -1, hazine: -2 },
              },
            ],
          },
        ],
      },
      {
        id: "siy-par-3",
        kategori: "Parti",
        tur: "OPERASYON",
        bekleme: 4,
        ad: "Milletvekili Transfer Görüşmeleri",
        metin:
          "Muhalefetten iki vekil, kapalı bir görüşmede kapıyı aralık bıraktığını sinyalledi. Sandalye hesabı cazip — ama görüşme masası hiç kapalı kalmıyor.",
        secenekler: [
          {
            ad: "Görüşmeleri yürüt, transferi tamamla",
            sonuclar: [
              {
                metin: "İki vekil grup değiştirdi; koalisyonun meclis aritmetiği güçlendi.",
                alinti: "Transfer olan vekillerden biri, «Burada daha çok iş yapabileceğime karar verdim» dedi.",
                skor: (s) => 50 + s.ist.onay / 5,
                etki: { koalisyon: 3, onay: -2 },
              },
              {
                metin: "Görüşme detayları bir ses kaydıyla ortaya çıktı; hangi tekliflerin konuşulduğu manşet oldu.",
                alinti: "Kaydı yayımlayan gazeteci, «Konuşulanları biz uydurmadık, kaydı dinleyin» diye ifade etti.",
                skor: (s) => 50 + (58 - s.ist.onay) / 3.5,
                etki: { koalisyon: 1, onay: -3, istikrar: -1 },
              },
            ],
          },
          {
            ad: "Reddet, ilkeli duruşu tercih et",
            sonuclar: [
              {
                metin: "Görüşme teklifleri geri çevrildi; karar parti içi toplantıda okundu.",
                alinti: "Toplantıya katılan bir vekil, «Bu sefer masaya oturmadık, iyi de oldu» diye konuştu.",
                skor: (s) => 50 + s.kollar.hukumetSeffafligi / 5,
                etki: { onay: 1, istikrar: 1, koalisyon: -1 },
              },
              {
                metin: "Reddedilen teklif kurmaylar arasında tartışma konusu oldu; bazıları fırsatın kaçırıldığını düşündü.",
                alinti: "Bir kurmay üye, «İki sandalye hazır gibi duruyordu» diye sitem etti.",
                skor: (s) => 50 + (55 - s.kollar.partiSadakati) / 4,
                etki: { koalisyon: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "siy-giz-1",
        kategori: "Gizli İşler",
        tur: "OPERASYON",
        bekleme: 3,
        riskli: true,
        gizli: true,
        ad: "Kamuoyu Yönlendirme Ağı",
        metin:
          "Bir danışman ekranını sana çeviriyor: aynı cümleyi kuran dört yüz hesap, hepsi son iki saatte açılmış. «Bunlar bizim değil» diyor, bir an duruyor, «ama bizim de olabilir.»",
        secenekler: [
          {
            ad: "Ağı kur, gündemi sessizce yönlendir",
            riskli: true,
            sonuclar: [
              {
                metin: "Üç hafta içinde gündem başlıkları hükümet lehine dönmeye başladı; kimse kaynağı sorgulamadı.",
                alinti:
                  "Sabah programında konuşan bir sunucu, «Sonunda halkın sesi duyuluyor» dedi — okuduğu yorumları kimin yazdığını bilmeden.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 4,
                etki: { onay: 2, supheDegisim: 9, hazine: -1 },
              },
              {
                ifsa: true,
                metin: "Bir veri analisti hesap ağını haritalayıp yayımladı; dört yüz hesabın aynı sunucudan yönetildiği görüldü.",
                alinti:
                  "Ağda çalışmış bir üniversite öğrencisi, «Günlüğü doldurup para alıyorduk, ne yazdığımıza bakmıyorduk» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3.5,
                etki: { onay: -3, kuresel: -2, supheDegisim: 13 },
              },
            ],
          },
          {
            ad: "Vazgeç, açık iletişimle yetin",
            sonuclar: [
              {
                metin: "İletişim ekibi kendi adıyla çalışmaya başladı; ilk canlı yayın beklenenin üç katı izlendi.",
                alinti:
                  "Yayını izleyen bir öğretmen, «En azından kimin konuştuğunu biliyorum» diye konuştu.",
                skor: (s) => 50 + s.kollar.hukumetSeffafligi / 5,
                etki: { onay: 1, supheDegisim: -4 },
              },
              {
                metin: "Açık kanal muhalefetin dijital üstünlüğünü kıramadı; tartışmalar aynı yerde kaldı.",
                alinti:
                  "Kampanya ekibinden bir gönüllü, «Biz yüz kişiyiz, karşımızdakiler binlerce» diye sitem etti.",
                skor: (s) => 50 + (60 - s.ist.onay) / 4,
                etki: { onay: -1 },
              },
            ],
          },
        ],
      },
      {
        id: "siy-giz-2",
        kategori: "Gizli İşler",
        tur: "OPERASYON",
        bekleme: 4,
        riskli: true,
        gizli: true,
        ad: "Muhalif Gazeteci Dosyası",
        metin:
          "İstihbarat servisinden gelen zarfta bir gazetecinin özel yazışmaları var. Kimse sana bu zarfı açmanı emretmedi — ama masanda duruyor.",
        secenekler: [
          {
            ad: "Dosyayı kullan, yayını durdur",
            riskli: true,
            sonuclar: [
              {
                metin: "Gazeteci köşesini üç hafta içinde bıraktı; eleştirel yayın o kanalda kesildi.",
                alinti: "Gazetecinin eski editörü, «Neden bıraktığını sormadık, sormamamız gerektiğini biliyorduk» dedi.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 3.5,
                etki: { istikrar: 1, kuresel: -2, supheDegisim: 15 },
              },
              {
                ifsa: true,
                metin: "Gazeteci dosyanın varlığını canlı yayında açıkladı; olay bir basın özgürlüğü örgütünün yıllık raporuna girdi.",
                alinti: "Raporu hazırlayan bir örgüt temsilcisi, «Bu artık tekil bir vaka değil, bir örnek oldu» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3,
                etki: { onay: -2, kuresel: -3, supheDegisim: 22 },
              },
            ],
          },
          {
            ad: "Dosyayı imha et",
            sonuclar: [
              {
                metin: "Zarf açılmadan imha edildi; konu bir daha gündeme gelmedi.",
                alinti: "İstihbarat biriminden bir yetkili, «Bize öyle geldi, biz de öyle yok ettik» kaydetti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 5,
                etki: { supheDegisim: -8 },
              },
              {
                metin: "İmha kararı ekipte tartışıldı; bazı isimler fırsatın boşa harcandığını düşündü.",
                alinti: "Bir güvenlik danışmanı, «Elimize geleni kullanmadık, bu bir zayıflık işareti» diye sitem etti.",
                skor: (s) => 50 + (55 - s.kollar.partiSadakati) / 4,
                etki: { koalisyon: -1, supheDegisim: -5 },
              },
            ],
          },
        ],
      },
      {
        id: "siy-giz-3",
        kategori: "Gizli İşler",
        tur: "KARARNAME",
        riskli: true,
        gizli: true,
        ad: "Seçim Bölgesi Düzenlemesi",
        metin:
          "Seçim haritası masanda; çizim yetkisi kararnameyle sende. Danışmanın gösterdiği iki taslaktan biri «teknik düzenleme» diye sunulacak.",
        secenekler: [
          {
            ad: "Sınırları kendi lehine yeniden çiz",
            riskli: true,
            sonuclar: [
              {
                metin: "Yeni harita yürürlüğe girdi; üç seçim bölgesinde aritmetik belirgin şekilde değişti.",
                alinti: "Haritayı hazırlayan bir teknik danışman, «Kimse dikkat etmedi, sadece sayılara baktı» dedi.",
                skor: (s) => 50 + s.kollar.basinDenetimi / 4,
                etki: { koalisyon: 2, supheDegisim: 14 },
              },
              {
                ifsa: true,
                metin: "Bir üniversite araştırma grubu haritayı analiz edip kasıtlı bölünme tespit etti.",
                alinti: "Araştırmayı yürüten bir akademisyen, «Sınırlar mahalle değil, oy deseni takip ediyor» diye ifade etti.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 3.5,
                etki: { koalisyon: 1, onay: -2, kuresel: -2, supheDegisim: 19 },
              },
            ],
          },
          {
            ad: "Bağımsız komisyona çizdir",
            sonuclar: [
              {
                metin: "Harita bağımsız bir komisyonca hazırlandı; hiçbir itiraz dilekçesi verilmedi.",
                alinti: "Komisyon başkanı, «Kriter nüfustu, başka bir şey değil» diye konuştu.",
                skor: (s) => 50 + s.kollar.yargiBagimsizligi / 5,
                etki: { onay: 1, kuresel: 1, supheDegisim: -9 },
              },
              {
                metin: "Yeni harita bazı bölgelerde beklenmedik biçimde aleyhe çıktı; kurmaylar arasında memnuniyetsizlik vardı.",
                alinti: "Bir seçim stratejisti, «Adil oldu ama bize adil olmadı» kaydetti.",
                skor: (s) => 50 + (55 - s.ist.onay) / 4,
                etki: { koalisyon: -1, supheDegisim: -6 },
              },
            ],
          },
        ],
      },
    ],
  },
};

// Muhalefetin bir adı olsun. Seçim gecesinde karşındaki yalnızca bir yüzde
// olarak duruyordu; oyun boyunca sana karşı hamle yapan da isimsizdi. Tek bir
// isim, hem muhalefet sahnesini hem seçim gecesini somutlaştırıyor — mekanik
// maliyeti sıfır, anlatısal karşılığı yüksek.
//
// Bütçe komisyonu geçmişi bilerek seçildi: muhalefetin ilk hamlesi
// (siy-muh-1) bütçe uzlaşmasıdır, yani karşındaki kendi alanında geliyor.
const MUHALEFET_LIDERI = {
  ad: "Nuray Ergin",
  soyad: "Ergin",
  unvan: "Ana muhalefet lideri",
  arkaPlan:
    "Üç dönem milletvekilliği yaptı, iki yıl bütçe komisyonuna başkanlık etti. Sayıları senden iyi bilir.",
};

// ---------- MUHALEFET HAMLESİ (Doküman Bölüm 15) ----------
// Oyunun en çok dile getirilen tasarım açığı: hiçbir şey oyuncuya karşı
// kendiliğinden hareket etmiyordu. Şüphe göstergesi içsel bir karşı-güçtü
// (oyuncunun kendi riskli hamlelerinin birikimi); bu üçü dışsal karşı-güç —
// meclisteki muhalefetin, oyuncu ne yaparsa yapsın, oyunda tam bir kez
// kendi inisiyatifiyle sahneye çıktığı an.
//
// Eskiden bu üçü Siyaset bölümünde oyuncunun kendi seçtiği sıradan eylemlerdi
// (kategori: "Muhalefet"). İçerik aynen korundu, sadece teslimat şekli
// değişti: artık panelden tıklanmıyorlar, muhalefetKontrol() tarafından
// otomatik tetikleniyorlar — oyuncu onlara gitmiyor, onlar oyuncuya geliyor.
const MUHALEFET_HAMLELERI = [
  {
    id: "siy-muh-1",
    kategori: "Muhalefet",
    tur: "KARARNAME",
    ad: "Muhalefetle Bütçe Uzlaşması",
    metin:
      "Bütçe komisyonunda muhalefetin oyu olmadan sayılar tutmuyor. Grup başkanvekili masaya iki liste koydu: biri taviz, biri şart.",
    secenekler: [
      {
        ad: "Taviz ver, geniş destek al",
        sonuclar: [
          {
            metin: "İki kalemde taviz verildi; bütçe komisyonda geniş oyla onaylandı.",
            alinti: "Muhalefetten bir komisyon üyesi, «Bu sefer gerçekten dinlediler» diye konuştu.",
            skor: (s) => 50 + s.ist.onay / 6,
            etki: { koalisyon: 2, onay: 1, hazine: -3 },
          },
          {
            metin: "Kendi grubundan bazı vekiller tavizleri fazla buldu; grup içi toplantıda gerginlik yaşandı.",
            alinti: "Grup toplantısına katılan bir vekil, «Bu kadar taviz karşılığında ne aldık» diye sitem etti.",
            skor: (s) => 50 + (60 - s.kollar.partiSadakati) / 4,
            etki: { koalisyon: 1, onay: -2, hazine: -3 },
          },
        ],
      },
      {
        ad: "Taviz verme, çoğunlukla geçir",
        sonuclar: [
          {
            metin: "Bütçe taviz verilmeden oylandı; koalisyon oylarıyla kıl payı geçti.",
            alinti: "Oylamayı izleyen bir muhabir, «Salon sessizdi, sonuç belliydi ama gerginlik hissediliyordu» kaydetti.",
            skor: (s) => 50 + s.ist.istikrar / 6,
            etki: { onay: 1, istikrar: 1, koalisyon: -1 },
          },
          {
            metin: "Muhalefet oylamadan çekildi; komisyon tutanağına «tek taraflı bütçe» ibaresi düşüldü.",
            alinti: "Muhalefet grup başkanvekili, «Bizimle değil, bize rağmen geçirdiler» diye ifade etti.",
            skor: (s) => 50 + (50 - s.ist.istikrar) / 4,
            etki: { koalisyon: -1, istikrar: -1 },
          },
        ],
      },
      {
        ad: "Muhalefetin kaynaklarını denetimle kurut",
        riskli: true,
        gizli: true,
        sonuclar: [
          {
            metin: "Muhalefet belediyelerine yönelik mali denetim sıklaştırıldı; itiraz süreleri uzadı.",
            alinti: "Denetim ekibiyle çalışan bir müfettiş, «Talimat geldi, biz de gittik» dedi.",
            skor: (s) => 50 + s.kollar.basinDenetimi / 4,
            etki: { koalisyon: 2, hazine: 1, supheDegisim: 8 },
          },
          {
            ifsa: true,
            metin: "Denetimlerin zamanlaması dikkat çekti; sadece muhalefet belediyelerine yoğunlaştığı tabloyla gösterildi.",
            alinti: "Konuyu araştıran bir gazeteci, «Aynı dönemde bizim belediyelere hiç denetim gitmemiş» diye ifade etti.",
            skor: (s) => 50 + s.kollar.yargiBagimsizligi / 4,
            etki: { koalisyon: 1, onay: -2, supheDegisim: 13 },
          },
        ],
      },
    ],
  },
  {
    id: "siy-muh-2",
    kategori: "Muhalefet",
    tur: "KANUN",
    buyuk: true,
    ad: "Meclis İçtüzük Değişikliği",
    metin:
      "Bir tasarı üç haftadır kürsüde; muhalefetin konuşma süresi dolmuyor. İçtüzüğü değiştirmek elinde — ama bu bir demokrasi tartışmasını da açar.",
    secenekler: [
      {
        ad: "Konuşma sürelerini kısalt, yasama hızlansın",
        sonuclar: [
          {
            metin: "Yeni içtüzük kabul edildi; bekleyen dört tasarı aynı hafta oylamaya girdi.",
            alinti: "Meclis muhabiri bir gazeteci, «Üç haftalık tıkanıklık bir günde açıldı» diye konuştu.",
            skor: (s) => s.koalisyon,
            etki: { koalisyon: 1, istikrar: 1, onay: -2, kuresel: -1 },
          },
          {
            metin: "Muhalefet oturumu terk etti; salonun boş sıraları o akşam haber görüntüsü oldu.",
            alinti: "Salonu terk eden bir muhalefet vekili, «Konuşamıyorsak burada oturmanın anlamı yok» diye ifade etti.",
            skor: (s) => 50 + (60 - s.ist.onay) / 3.5,
            etki: { koalisyon: 1, onay: -3, kuresel: -2, istikrar: -1 },
          },
        ],
      },
      {
        ad: "Uzlaşma komisyonu kur, birlikte yaz",
        sonuclar: [
          {
            metin: "Komisyon iki partiden eşit üyeyle kuruldu; ilk taslak altı haftada ortaklaşa yazıldı.",
            alinti: "Komisyonda yer alan muhalefet vekili, «İlk kez masaya oturup birlikte yazdık» dedi.",
            skor: (s) => 50 + s.kollar.hukumetSeffafligi / 5,
            etki: { istikrar: 2, onay: 1, koalisyon: 1, hazine: -1 },
            gecikmeli: { kuresel: 2 },
            gecikmeliMetin: "Uzlaşmayla kabul edilen içtüzük değişikliği uluslararası parlamento gözlem raporlarında örnek gösterildi.",
          },
          {
            metin: "Komisyon üç toplantı sonra tıkandı; taraflar aynı maddede anlaşamadı.",
            alinti: "Komisyon sözcüsü bir vekil, «Altı hafta harcadık, tek madde bile yazamadık» diye sitem etti.",
            skor: (s) => 50 + (60 - s.koalisyon) / 4,
            etki: { onay: -1, istikrar: -1 },
          },
        ],
      },
    ],
  },
  {
    id: "siy-muh-3",
    kategori: "Muhalefet",
    tur: "OPERASYON",
    bekleme: 4,
    ad: "Erken Seçim Tehdidi",
    metin:
      "Muhalefet üç gündür aynı tasarıyı meclise sokturmuyor. Kurmaylardan biri masaya erken seçim kartını koyuyor: «Blöf de olsa, gündemi değiştirir.»",
    secenekler: [
      {
        ad: "Açıkça tehdit et, muhalefeti geri adıma zorla",
        sonuclar: [
          {
            metin: "Erken seçim çıkışı ertesi gün muhalefeti masaya döndürdü; tıkanan tasarı gündeme alındı.",
            alinti: "Kararı öğrenen bir borsa yorumcusu, «Piyasa önce tedirgin oldu, sonra rahatladı» diye konuştu.",
            skor: (s) => 50 + s.ist.onay / 5,
            etki: { koalisyon: 2, istikrar: 1, kuresel: -1 },
          },
          {
            metin: "Muhalefet çıkışa meydan okudu; üç gün boyunca kur oynaklığı arttı.",
            alinti: "Bir döviz bürosu çalışanı, «Müşteriler sabah farklı, akşam farklı kur soruyordu» kaydetti.",
            skor: (s) => 50 + (62 - s.ist.onay) / 3.5,
            etki: { koalisyon: -1, istikrar: -2, hazine: -2, kuresel: -1 },
          },
        ],
      },
      {
        ad: "Kapalı kapılar ardında pazarlık yap",
        sonuclar: [
          {
            metin: "Kapalı görüşmede iki madde üzerinde anlaşıldı; tasarı sessizce gündeme alındı.",
            alinti: "Görüşmeye katılan bir danışman, «Kimse manşet istemedi, ikimiz de» diye ifade etti.",
            skor: (s) => 50 + s.koalisyon / 6,
            etki: { koalisyon: 1, istikrar: 1, kuresel: -1 },
          },
          {
            metin: "Kapalı pazarlığın tutanağı bir muhalefet vekilince ifşa edildi.",
            alinti: "İfşa eden vekil, «Kapalı kapı arkasında halkın adına konuşulmaz» diye sitem etti.",
            skor: (s) => 50 + (65 - s.kollar.hukumetSeffafligi) / 4,
            etki: { onay: -2, kuresel: -1 },
          },
        ],
      },
    ],
  },
];

// ============================================================
//  MOTOR — saf fonksiyonlar
// ============================================================

const BASLANGIC_KOLLAR = {
  gelirVergisi: 30,
  kurumsalVergi: 22,
  sosyalYardim: 50,
  guvenlikButcesi: 45,
  partiSadakati: 50,
  hukumetSeffafligi: 60,
  askeriButce: 45,
  disPolitika: 55,
  yargiBagimsizligi: 60,
  basinDenetimi: 40,
};

function yeniOyun(secilenVaatler) {
  const kpi = { gsyih: 55, istihdam: 52, halkSagligi: 58, hazirlik: 55 };
  return {
    faz: "panel",
    tur: 1,
    ist: { onay: 58, hazine: 40, istikrar: 60, kuresel: 55, nufuz: 14 },
    kpi,
    koalisyon: 51, // tam olarak yeter sayı — kıl payı çoğunluk
    koalisyonBirikim: 0, // tam sandalyeye ulaşmamış siyasi baskı
    suphe: 0,
    supheGorundu: false, // ilk riskli hamleye kadar panelde gizli
    kisitlamaBitis: 0,   // yetki kısıtlamasının biteceği tur
    kademeGecmisi: [],   // hangi şüphe kademeleri yaşandı
    muhalefetTetiklendi: false, // muhalefet hamlesi oyunda bir kez yaşandı mı
    muhalefetEylemId: null,     // hangi sahne tetiklendi
    kollar: { ...BASLANGIC_KOLLAR },
    onceki: { onay: 58, hazine: 40, istikrar: 60, kuresel: 55, nufuz: 14, koalisyon: 51 },
    nakit: { giren: 0, cikan: 0 }, // son kapanıştan bu yana hazine hareketi
    kolDegisimi: {}, // bu turda kaç puan oynandı
    kullanim: {}, // eylemId → başarıyla uygulandığı tur
    reddedilen: {}, // eylemId → Meclis'ten döndüğü tur
    bekleyenEtkiler: [], // ileride olgunlaşacak etkiler
    bekleyenHaberler: [], // sonraki gazeteye girecek haberler
    belgeler: [], // aktif belgeler
    arsiv: [],
    gunluk: [],
    vaatler: secilenVaatler,
    baslangic: { ...kpi, ...BASLANGIC_KOLLAR },
  };
}

// Etki değerini oyuncuya gösterilecek metne çevirir.
// Hazine para birimiyle, diğer göstergeler düz puan olarak yazılır.
function etkiMetni(anahtar, deger) {
  const isaret = deger > 0 ? "+" : "−";
  const buyukluk = Math.abs(deger);
  if (anahtar === "hazine") return `${ETIKET[anahtar]} ${isaret}$${buyukluk}B`;
  return `${ETIKET[anahtar]} ${isaret}${buyukluk}`;
}

// Çoğu göstergede artı iyidir — ama şüphede tam tersi: şüphenin yükselmesi
// oyuncunun aleyhinedir. Rozet rengi bu yüzden ham işarete değil, sonucun
// oyuncu için iyi olup olmadığına bakmalı. Sayının işareti olduğu gibi kalır
// (şüphe gerçekten 22 puan arttıysa «+22» doğrudur), yalnızca renk düzelir.
const TERS_KUTUP = ["supheDegisim"];
function etkiIyiMi(anahtar, deger) {
  return TERS_KUTUP.includes(anahtar) ? deger < 0 : deger > 0;
}

// Bir hamlenin halka açık olup olmadığı. `gizli`, `riskli` gibi hem eylem hem
// yaklaşım düzeyinde konabilir: Gizli İşler eylemlerinin tamamı gizlidir (dosyayı
// imha etmek de gizli bir iştir), buna karşılık sıradan bir eylemin içindeki tek
// bir kirli yaklaşım da gizli olabilir.
//
// `ifsa` bunu sonuç düzeyinde geri çevirir: iş patladıysa, sızdıysa, canlı yayında
// açıklandıysa artık gizli değildir — gazeteye çıkar. Riskin bedeli zaten budur.
// Alenî otoriter hamleler (sokakta görünen bir özel birim, yayımlanan bir kanun)
// bilerek gizli işaretlenmemiştir; onların yeri gazetedir.
function gizliMi(eylem, secenek, kazanan) {
  const gizliHamle = !!((eylem && eylem.gizli) || (secenek && secenek.gizli));
  return gizliHamle && !(kazanan && kazanan.ifsa);
}

// Para tutarlarını temiz yazar: 2.40000000000000004 → "2.4" · 9.0 → "9"
function paraYaz(n) {
  const y = Math.round(n * 10) / 10;
  return Number.isInteger(y) ? String(y) : y.toFixed(1);
}

function kirp(n) {
  return Math.max(0, Math.min(100, n));
}

// Bir eylemin şu an yapılabilir olup olmadığını belirler.
// KANUN ve KARARNAME tek seferliktir: aynı yasa iki kez çıkarılmaz.
// OPERASYON tekrarlanabilir ama kendi bekleme süresi vardır.
function eylemDurumu(s, eylem) {
  // Kanun imzadan KANUN_YURURLUK tur sonra yürürlüğe girer; belge ömrü son
  // yarıyılın kapanışında bir kez daha ilerler, yani yürürlük turu TOPLAM_TUR+1
  // olan kanun hâlâ yetişir (tur 9 çalışır). Tur 10'da imzalanan kanun ise
  // yetişmez: oyuncu 5 nüfuz harcar, oylamayı kazanır, belgeyi görür ve hiçbir
  // şey olmaz. Bu sessiz kayıp yerine eylem baştan kapatılır.
  if (eylem.tur === "KANUN" && s.tur + KANUN_YURURLUK > TOPLAM_TUR + 1) {
    return {
      acik: false,
      etiket: "Süre yetmez",
      sebep: `Kanun ${KANUN_YURURLUK} yarıyıl sonra yürürlüğe girer; görev süren bitmeden yetişmez.`,
    };
  }

  // Yetki kısıtlaması sürerken yalnızca Meclis onaylı kanunlar işleme girer.
  if (kisitlamaVar(s) && eylem.tur !== "KANUN") {
    return {
      acik: false,
      etiket: `Tur ${s.kisitlamaBitis}`,
      sebep: "Yetkilerin kısıtlı; yalnızca kanun çıkarabilirsin.",
      kisitli: true,
    };
  }

  // Kalıcı durumlar nüfuzdan önce gelir: kullanılmış bir belge, nüfuz düşük diye
  // "Yetersiz nüfuz" etiketi göstermemeli — o etiket düzelebilecek bir durumu anlatır.
  const sonKullanim = s.kullanim[eylem.id];
  if (sonKullanim !== undefined) {
    if (eylem.tur !== "OPERASYON") {
      return { acik: false, etiket: "Kullanıldı", sebep: "Bu belge tek seferliktir." };
    }
    const hazirTur = sonKullanim + (eylem.bekleme || 2);
    if (s.tur < hazirTur) {
      return {
        acik: false,
        etiket: `Tur ${hazirTur}`,
        sebep: `Bu operasyon tur ${hazirTur}'de tekrar yapılabilir.`,
      };
    }
  }

  // Meclis'ten dönen tasarı kaybolmaz; bir süre sonra yeniden sunulabilir.
  const redTuru = s.reddedilen[eylem.id];
  if (redTuru !== undefined) {
    const hazirTur = redTuru + RED_BEKLEME;
    if (s.tur < hazirTur) {
      return {
        acik: false,
        etiket: `Tur ${hazirTur}`,
        sebep: "Meclis'ten dönen tasarı hemen yeniden sunulamaz.",
        reddedildi: true,
      };
    }
  }

  // Nüfuzu yetmeyen eylem tıklanabilir olmamalı; boşuna girip geri çıkmayı önler.
  if (s.ist.nufuz < NUFUZ_MALIYET[eylem.tur]) {
    return {
      acik: false,
      etiket: "Yetersiz nüfuz",
      sebep: "Bu hamle için yeterli siyasi nüfuzun yok.",
      nufuzYok: true,
    };
  }

  return { acik: true };
}

// Etkiyi state'e uygular (yüzdelik olanlar 0–100 arasında kırpılır)
// Bir göstergeyi yükseltmek, yükseldikçe zorlaşır.
// 70'e kadar kazanç tam gelir; sonrası giderek küçülür.
// Yıpranmanın yerini bu tutar: kendiliğinden düşüş yok, ama tavana da yapışılmıyor.
const VERIM_ESIGI = 70;
const AZALAN_VERIM = ["onay", "istikrar", "kuresel", "gsyih", "istihdam", "halkSagligi", "hazirlik"];

function verimKatsayisi(anahtar, mevcut) {
  if (!AZALAN_VERIM.includes(anahtar) || mevcut <= VERIM_ESIGI) return 1;
  return Math.max(0.25, 1 - (mevcut - VERIM_ESIGI) / 40);
}

function etkiUygula(s, etki) {
  const ist = { ...s.ist };
  const kpi = { ...s.kpi };
  let koalisyon = s.koalisyon;
  let suphe = s.suphe || 0;
  let supheGorundu = s.supheGorundu || false;
  const nakit = { ...(s.nakit || { giren: 0, cikan: 0 }) };

  Object.entries(etki).forEach(([k, v]) => {
    if (k === "hazine") {
      // Kasaya giren ve çıkan ayrı ayrı tutulur ki panelde döküm gösterilebilsin.
      const oncekiHazine = ist.hazine;
      ist.hazine = Math.max(0, ist.hazine + v);
      const gercekFark = ist.hazine - oncekiHazine;
      if (gercekFark > 0) nakit.giren += gercekFark;
      else if (gercekFark < 0) nakit.cikan += -gercekFark;
    } else if (k === "koalisyon") {
      koalisyon = Math.max(0, Math.min(TOPLAM_SANDALYE, koalisyon + v));
    } else if (k === "supheDegisim") {
      suphe = Math.max(0, Math.min(SUPHE_AZIL, suphe + v));
      // Şüphe göstergesi ancak ilk kez yükseldiğinde görünür olur.
      if (v > 0) supheGorundu = true;
    } else if (k === "nufuz") {
      ist.nufuz = Math.max(0, Math.min(NUFUZ_TAVAN, ist.nufuz + v));
    } else if (k in ist) {
      ist[k] = kirp(ist[k] + (v > 0 ? v * verimKatsayisi(k, ist[k]) : v));
    } else if (k in kpi) {
      kpi[k] = kirp(kpi[k] + (v > 0 ? v * verimKatsayisi(k, kpi[k]) : v));
    }
  });

  return { ...s, ist, kpi, koalisyon, suphe, supheGorundu, nakit };
}

// Deterministik sonuç: skoru yüksek olan gerçekleşir (Doküman Bölüm 5)
function sonucHesapla(secenek, s) {
  const skorlar = secenek.sonuclar.map((so) => Math.max(1, so.skor(s)));
  const toplam = skorlar.reduce((a, b) => a + b, 0);
  const yuzdeler = skorlar.map((sk) => Math.round((sk / toplam) * 100));
  // En yüksek skorlu sonuç gerçekleşir. Eşitlikte ilk sonuç kazanır.
  // İkiden fazla sonuçlu bir yaklaşım yazılırsa da doğru çalışır.
  let kazananIdx = 0;
  for (let i = 1; i < skorlar.length; i++) {
    if (skorlar[i] > skorlar[kazananIdx]) kazananIdx = i;
  }
  return { yuzdeler, kazananIdx };
}

// Meclis oylaması (Doküman Bölüm 6)
function gerekenOy(eylem) {
  return eylem && eylem.buyuk ? BUYUK_BARAJ : BARAJ;
}

function meclisOyla(s, gereken = BARAJ) {
  const temel = s.koalisyon;
  const sadakatBonus = Math.round((s.kollar.partiSadakati - 50) / 10);
  const onayBonus = Math.round((s.ist.onay - 55) / 10);
  // Mecliste 101 sandalye var; kabul oyu bundan fazla olamaz.
  const toplam = Math.max(0, Math.min(TOPLAM_SANDALYE, temel + sadakatBonus + onayBonus));
  return { temel, sadakatBonus, onayBonus, toplam, gereken, gecti: toplam >= gereken };
}

function aktifBelgeSayisi(s) {
  return s.belgeler.filter((b) => b.durum === "onaylandi" || b.durum === "yururlukte").length;
}

// Vergi geliri (Doküman Bölüm 8)
function vergiGeliri(s) {
  const oran = s.kollar.gelirVergisi * 0.196 + s.kollar.kurumsalVergi * 0.172;
  // Büyüyen ekonomi ve artan istihdam doğrudan vergi gelirine döner.
  // Katsayılar bilerek güçlü: yatırımın geri dönüşü hissedilir olmalı.
  const carpan = 1 + (s.kpi.gsyih - 50) / 60 + (s.kpi.istihdam - 50) / 80;
  return Math.round(oran * carpan * 10) / 10;
}

// Siyasi sermaye durumdan beslenir. Eskiden sabit +6 idi: hiçbir içerik, hiçbir
// gösterge nüfuzu etkilemiyordu — kapalı bir metronomdu ve tur 3'ten sonra
// tavana çarpıp boşa akıyordu. Artık halk desteği ve meclisteki rahatlık hamle
// alanı açar, ikisinin de olmaması eli kolu bağlar.
//
// Başlangıç durumunda (onay 58, koalisyon 51) sonuç bilerek tam 6'dır — mevcut
// denge referansları bu yüzden kaymaz.
function nufuzKazanci(s) {
  const onayKatki = s.ist.onay > 65 ? 2 : s.ist.onay > 55 ? 1 : 0;
  const meclisKatki = s.koalisyon >= BUYUK_BARAJ ? 1 : s.koalisyon >= BARAJ ? 0 : -1;
  // Taban 3, kararname maliyetiyle aynı: siyaseten dibe vurmuş bir başkan bile
  // her yarıyıl en az bir kararname imzalayabilir. Oyun hiçbir durumda oyuncuyu
  // hamlesiz bırakmaz — yalnızca seçeneklerini daraltır.
  return Math.max(3, 5 + onayKatki + meclisKatki);
}

// Tur sonu (Doküman Bölüm 10)
function turSonu(s) {
  let yeni = { ...s, nakit: { giren: 0, cikan: 0 } };
  const rapor = { haberler: [] };
  // Panelde ok işaretleri için: yarıyıl kapanmadan önceki değerler
  const onceki = { ...s.ist, koalisyon: s.koalisyon };

  // 1) Gelirler
  const gelir = vergiGeliri(yeni);
  yeni = etkiUygula(yeni, { hazine: gelir });
  rapor.gelir = gelir;

  // 2) Giderler (kolların tur maliyeti)
  const sosyalGider = Math.round(yeni.kollar.sosyalYardim * 0.089 * 10) / 10;
  const guvenlikGider = Math.round(yeni.kollar.guvenlikButcesi * 0.07 * 10) / 10;
  const askeriGider = Math.round(yeni.kollar.askeriButce * 0.076 * 10) / 10;
  yeni = etkiUygula(yeni, { hazine: -(sosyalGider + guvenlikGider + askeriGider) });
  rapor.gider = Math.round((sosyalGider + guvenlikGider + askeriGider) * 10) / 10;
  rapor.giderKalem = { sosyal: sosyalGider, guvenlik: guvenlikGider, askeri: askeriGider };

  // Kolların istatistiklere etkisi
  const kolEtki = {
    onay:
      (yeni.kollar.sosyalYardim - BASLANGIC_KOLLAR.sosyalYardim) / 14 -
      (yeni.kollar.gelirVergisi - BASLANGIC_KOLLAR.gelirVergisi) / 12 +
      (yeni.kollar.hukumetSeffafligi - BASLANGIC_KOLLAR.hukumetSeffafligi) / 25,
    istikrar:
      (yeni.kollar.guvenlikButcesi - BASLANGIC_KOLLAR.guvenlikButcesi) / 14 +
      (yeni.kollar.disPolitika - BASLANGIC_KOLLAR.disPolitika) / 22,
    // Yumuşak dış politika itibarı besler, sert duruş yıpratır.
    kuresel:
      (BASLANGIC_KOLLAR.disPolitika - yeni.kollar.disPolitika) / 16 +
      (yeni.kollar.yargiBagimsizligi - BASLANGIC_KOLLAR.yargiBagimsizligi) / 30,
    hazirlik: (yeni.kollar.askeriButce - BASLANGIC_KOLLAR.askeriButce) / 12,
  };

  // Bağımsız yargı ve özgür basın şüpheyi hızlandırır; denetim altına almak yavaşlatır.
  const supheHizi =
    (yeni.kollar.yargiBagimsizligi - BASLANGIC_KOLLAR.yargiBagimsizligi) / 30 -
    (yeni.kollar.basinDenetimi - BASLANGIC_KOLLAR.basinDenetimi) / 30;
  // Şüphe zamanla yatışır — ama yalnızca dosya henüz ağırlaşmadıysa.
  // Yetki kısıtlaması eşiğini geçtiyse kendiliğinden kapanmaz; oyuncunun
  // denetim eylemleriyle aktif olarak temizlemesi gerekir.
  if (yeni.suphe > 0 && yeni.suphe < SUPHE_KISITLAMA) {
    const yatisma = Math.max(0, 1.5 - supheHizi);
    yeni = { ...yeni, suphe: Math.max(0, yeni.suphe - yatisma) };
    rapor.supheYatisma = Math.round(yatisma * 10) / 10;
  }
  // Yuvarlama yalnızca gösterim içindir. Eskiden yuvarlanmış değer UYGULANIYORDU
  // ve bu bir ölü bölge yaratıyordu: böleni 22-30 olan kollarda (dış politika,
  // şeffaflık, yargı, basın) 3 puandan küçük oynatmalar 0.0'a yuvarlanıp yok
  // oluyordu — oyuncu puan başına 2 nüfuz ödeyip hiçbir şey almıyordu. Artık
  // ham değer işliyor; her puanın karşılığı var.
  rapor.kolEtki = {
    onay: Math.round(kolEtki.onay * 10) / 10,
    istikrar: Math.round(kolEtki.istikrar * 10) / 10,
    kuresel: Math.round(kolEtki.kuresel * 10) / 10,
    hazirlik: Math.round(kolEtki.hazirlik * 10) / 10,
  };
  yeni = etkiUygula(yeni, kolEtki);

  // 3) Yıpranma — hiçbir hükümet yerinde sayarak ayakta kalamaz.
  //    Oyunun varsayılan gidişatı düşüştür; oyuncunun işi bununla savaşmaktır.
  const buTurYipranma = yipranmaHesapla(yeni.ist);
  yeni = etkiUygula(yeni, buTurYipranma);
  rapor.yipranma = buTurYipranma;

  // 4) Nüfuz yenilenmesi
  const nufuz = nufuzKazanci(yeni);
  yeni = etkiUygula(yeni, { nufuz });
  rapor.nufuz = nufuz;

  // Bu yarıyıl yapılan operasyonlar gazeteye düşer
  (yeni.bekleyenHaberler || []).forEach((h) => rapor.haberler.push(h));

  // 5a) Olgunlaşan gecikmeli etkiler
  const bekleyen = [];
  (yeni.bekleyenEtkiler || []).forEach((b) => {
    if (yeni.tur + 1 >= b.tur) {
      yeni = etkiUygula(yeni, b.etki);
      rapor.haberler.push({
        tip: "gecikmeli",
        ad: b.kaynak,
        belgeTuru: b.gizli ? "GİZLİ" : "SONUÇ",
        metin: b.metin,
        etki: b.etki,
        gizli: !!b.gizli,
      });
    } else {
      bekleyen.push(b);
    }
  });

  // 5) Belge ömrü ilerlemesi (Doküman Bölüm 4)
  const gelecekTur = yeni.tur + 1;
  const belgeler = [];
  const arsiv = [...yeni.arsiv];

  yeni.belgeler.forEach((b) => {
    if (b.durum === "onaylandi" && gelecekTur >= b.yururlukTuru) {
      yeni = etkiUygula(yeni, b.etki);
      if (b.gecikmeli) {
        bekleyen.push({
          tur: gelecekTur + ETKI_GECIKMESI,
          kaynak: b.ad,
          metin: b.gecikmeliMetin || "Düzenlemenin asıl etkisi şimdi hissedildi.",
          etki: b.gecikmeli,
          gizli: !!b.gizli,
        });
      }
      // Gizli bir kararnamede belgenin kendisi resmen yayımlanır — Resmî Gazete
      // satırı kalsın diye `belgeTuru` korunur; gizlenen, işin ne olduğunu anlatan
      // haber metnidir. Kuru resmî kayıt açıkta, anlatı kapalı zarfta.
      rapor.haberler.push({
        tip: "yururluk",
        ad: b.ad,
        belgeTuru: b.tur,
        metin: b.sonucMetni,
        alinti: b.alinti,
        oyToplam: b.oyToplam,
        oyGereken: b.oyGereken,
        etki: b.etki,
        gizli: !!b.gizli,
      });
      if (b.tamamlanmaTuru) belgeler.push({ ...b, durum: "yururlukte" });
      else arsiv.push({ ...b, durum: "tamamlandi" });
    } else if (b.durum === "yururlukte" && gelecekTur >= b.tamamlanmaTuru) {
      yeni = etkiUygula(yeni, b.etki);
      rapor.haberler.push({
        tip: "tamamlanma",
        ad: b.ad,
        belgeTuru: b.tur,
        metin: "Program tamamlandı; etkisi ikinci kez hissedildi.",
        etki: b.etki,
        gizli: !!b.gizli,
      });
      arsiv.push({ ...b, durum: "tamamlandi" });
    } else {
      belgeler.push(b);
    }
  });

  // 6) Koalisyon kayması
  // Sandalye kesirli olmaz. Baskı arka planda birikir; ancak tam bir sandalyeye
  // ulaşınca meclis aritmetiği değişir.
  //
  // Koalisyon üç kaynaktan beslenir: halk desteği, parti sadakati ve verilen
  // sözlerin tutulup tutulmadığı. Üçü de ihmal edilirse meclis çoğunluğu erir.
  const tutulmayanVaat =
    gelecekTur > VAAT_BASKI_TURU
      ? (yeni.vaatler || []).filter((vid) => {
          const v = VAATLER.find((x) => x.id === vid);
          return v && !vaatDurumu(v, yeni).tutuldu;
        }).length
      : 0;
  const kayma =
    (yeni.ist.onay - KOALISYON_ESIGI) / 12 +
    (yeni.kollar.partiSadakati - 50) / 22 -
    tutulmayanVaat * VAAT_BASKI_KAYMA;
  rapor.vaatBaskisi = tutulmayanVaat;
  const birikim = (yeni.koalisyonBirikim || 0) + kayma;
  const sandalyeDegisimi = Math.trunc(birikim);
  const yeniKoalisyon = Math.max(
    0,
    Math.min(TOPLAM_SANDALYE, Math.round(yeni.koalisyon) + sandalyeDegisimi)
  );
  rapor.koalisyonKayma = sandalyeDegisimi;

  rapor.tur = yeni.tur;

  // Kaymadan sonraki sandalye sayısı artık state'in kendisine yazılır. Eskiden
  // yalnızca yerel bir değişkende tutuluyordu ve return'de state'in üstüne
  // basılıyordu; bu yüzden şüphe kademelerinin koalisyon cezası (−2 / −3)
  // sessizce kayboluyordu — yalnızca onay cezası işliyordu.
  yeni = { ...yeni, koalisyon: yeniKoalisyon };

  // Yarıyıl kapanışında şüphe kademesi tetiklendi mi?
  const sonrakiTur = yeni.tur + 1;
  const kademe = kademeKontrol({ ...yeni, tur: sonrakiTur });
  if (kademe) {
    yeni = etkiUygula(yeni, kademe.etki);
    rapor.kademe = kademe;
    if (kademe.kisitla) {
      yeni = { ...yeni, kisitlamaBitis: sonrakiTur + KISITLAMA_SURESI };
    }
    yeni = {
      ...yeni,
      kademeGecmisi: [...(yeni.kademeGecmisi || []), kademe.kademe],
    };
  }

  // Gazete, kademe cezaları uygulandıktan SONRAKİ tabloyu göstermeli; aksi halde
  // kademe turunda kağıt ile panel farklı sayılar yazar.
  rapor.durum = {
    onay: yeni.ist.onay,
    istikrar: yeni.ist.istikrar,
    kuresel: yeni.ist.kuresel,
    hazine: yeni.ist.hazine,
    koalisyon: yeni.koalisyon,
  };
  // Manşet seçimi eşiğin GEÇİLDİĞİ anı yakalayabilsin diye yarıyıl başındaki
  // tablo da rapora yazılır.
  rapor.oncekiDurum = onceki;

  // Görevden alınmıyorsa, muhalefetin oyunda tam bir kez sahneye çıkıp
  // çıkmayacağı bu turun kapanışında kontrol edilir.
  const oyunBittiMi = kademe && kademe.oyunBitti;
  const muhalefetId = oyunBittiMi ? null : muhalefetKontrol(yeni, gelecekTur);

  return {
    ...yeni,
    belgeler,
    bekleyenEtkiler: bekleyen,
    bekleyenHaberler: [],
    arsiv,
    onceki,
    koalisyonBirikim: birikim - sandalyeDegisimi,
    tur: gelecekTur,
    kolDegisimi: {},
    gunluk: rapor,
    muhalefetTetiklendi: yeni.muhalefetTetiklendi || !!muhalefetId,
    muhalefetEylemId: muhalefetId || yeni.muhalefetEylemId || null,
    faz: oyunBittiMi
      ? "azil"
      : muhalefetId
      ? "muhalefet"
      : gelecekTur > TOPLAM_TUR
      ? "secim"
      : "panel",
  };
}

// Gazetenin manşetini oyunun o anki durumundan seçer.
// Önce kriz, sonra büyük haber, en son sakin gündem.
function mansetSec(rapor) {
  const d = rapor.durum;
  // Şüphe kademesi her şeyin önüne geçer.
  if (rapor.kademe)
    return { baslik: rapor.kademe.baslik, spot: rapor.kademe.metin, agir: true };

  // Kriz manşetleri DURUM değil OLAY bildirir: yalnızca eşiğin geçildiği
  // yarıyılda basılır. Eskiden koşul doğru kaldığı sürece her tur aynı manşet
  // tekrarlanıyordu — koalisyon barajın altına bir kez düşünce oyunun geri
  // kalanında gazete başka hiçbir şey yazmıyordu.
  const o = rapor.oncekiDurum || {};
  const yeniGecti = (simdi, once, esik) => simdi < esik && !(once < esik);

  if (yeniGecti(d.onay, o.onay, 35))
    return { baslik: "SOKAK HÜKÜMETE SIRTINI DÖNÜYOR", spot: "Onay oranı kritik eşiğin altına indi; kabine sarsıntıda.", agir: true };
  if (yeniGecti(d.koalisyon, o.koalisyon, BARAJ))
    return { baslik: "MECLİS ÇOĞUNLUĞU KAYBEDİLDİ", spot: "Koalisyon barajın altına düştü. Artık her tasarı parti sadakatine ve halk desteğine kalmış durumda.", agir: true };
  if (yeniGecti(d.hazine, o.hazine, 10))
    return { baslik: "HAZİNE DİP SEVİYEDE", spot: "Kasadaki daralma yeni harcamaların önünü kesiyor.", agir: true };
  if (yeniGecti(d.istikrar, o.istikrar, 40))
    return { baslik: "DÜZEN ÇÖZÜLÜYOR", spot: "Asayiş ve kamu düzeni göstergeleri hızla geriliyor.", agir: true };

  // Gizli işler manşet olamaz — halk onları bilmiyor.
  const acikHaberler = rapor.haberler.filter((h) => !h.gizli);

  const yururluge = acikHaberler.find((h) => h.tip === "yururluk");
  if (yururluge)
    return {
      baslik: yururluge.ad.toUpperCase() + " YÜRÜRLÜKTE",
      spot: yururluge.metin,
      alinti: yururluge.alinti,
      kullanilan: yururluge,
      agir: false,
    };

  const operasyon = acikHaberler.find((h) => h.tip === "operasyon");
  if (operasyon)
    return {
      baslik: operasyon.ad.toUpperCase(),
      spot: operasyon.metin,
      alinti: operasyon.alinti,
      kullanilan: operasyon,
      agir: false,
    };

  const biten = acikHaberler.find((h) => h.tip === "tamamlanma");
  if (biten)
    return {
      baslik: biten.ad.toUpperCase() + " TAMAMLANDI",
      spot: biten.metin,
      alinti: biten.alinti,
      kullanilan: biten,
      agir: false,
    };

  if (d.onay > 70)
    return { baslik: "HÜKÜMETE DESTEK ZİRVEDE", spot: "Kamuoyu araştırmaları hükümet lehine güçlü bir tablo çiziyor.", agir: false };

  return { baslik: "GÜNDEM SAKİN", spot: "Bu yarıyılda kayda değer bir gelişme yaşanmadı. Bekleyiş sürüyor.", agir: false };
}

// Sandık bilançosu: kaç kişi oy kullanabildi, kaçı gitti, kaç oy geçerli sayıldı.
// Katılım ülkenin durumuna bağlıdır — kaos varsa insanlar sandığa daha az gider.
function sandikBilancosu(s) {
  const katilimOrani = Math.max(
    64,
    Math.min(92, 78 + (s.ist.istikrar - 50) / 5 + (s.ist.onay - 50) / 10)
  );
  const gecersizOrani = Math.max(1.4, Math.min(5, 2 + (100 - s.ist.istikrar) / 40));

  const sandigaGiden = Math.round((SECMEN * katilimOrani) / 100);
  const gecersizOy = Math.round((sandigaGiden * gecersizOrani) / 100);
  const gecerliOy = sandigaGiden - gecersizOy;

  return {
    nufus: NUFUS,
    secmenOlmayan: NUFUS - SECMEN,
    kayitliSecmen: SECMEN,
    katilimOrani,
    sandigaGiden,
    sandigaGitmeyen: SECMEN - sandigaGiden,
    gecersizOrani,
    gecersizOy,
    gecerliOy,
  };
}

// Şüphe kademeleri: soruşturma → yetki kısıtlaması → görevden alınma.
// Her kademe bir kez yaşanır; oyun ancak en üst kademede biter.
function kademeKontrol(s) {
  const yasananlar = s.kademeGecmisi || [];

  if (s.suphe >= SUPHE_AZIL && !yasananlar.includes("azil")) {
    return {
      kademe: "azil",
      baslik: "GÖREVDEN ALINDIN",
      metin:
        "Yönetim Başkanlığı'nın raporu Meclis'e sunuldu. Görevine son verildi ve hakkında yargı süreci başlatıldı.",
      etki: {},
      oyunBitti: true,
    };
  }

  if (s.suphe >= SUPHE_KISITLAMA && !yasananlar.includes("kisitlama")) {
    return {
      kademe: "kisitlama",
      baslik: "YETKİLERİN KISITLANDI",
      metin: `Yönetim Başkanlığı yetkilerini askıya aldı. ${KISITLAMA_SURESI} yarıyıl boyunca kararname ve operasyon çıkaramazsın; yalnızca Meclis onaylı kanunlar işleme girer.`,
      etki: { onay: -3, koalisyon: -3 },
      kisitla: true,
    };
  }

  if (s.suphe >= SUPHE_SORUSTURMA && !yasananlar.includes("sorusturma")) {
    return {
      kademe: "sorusturma",
      baslik: "HAKKINDA SORUŞTURMA AÇILDI",
      metin:
        "Yönetim Başkanlığı bir ön inceleme başlattı. Henüz bir yaptırım yok — ama dosya artık açık.",
      etki: { onay: -3, koalisyon: -2 },
    };
  }

  return null;
}

// Yetki kısıtlaması sürüyor mu?
function kisitlamaVar(s) {
  return (s.kisitlamaBitis || 0) > s.tur;
}

// Muhalefet hamlesi: dışsal karşı-güç (Doküman Bölüm 15).
// Şüphe göstergesi gizliydi çünkü içsel bir dosyaydı; bu üç eşik panelde
// zaten açık olan hazine/koalisyon/onay üzerine kurulu — gizli bir gösterge
// eklemek yerine oyuncunun zaten izlediği sayılara bağlandı. Oyunda tam bir
// kez tetiklenir: göstergelerden biri gerçekten eşiği geçerse hemen, hiçbiri
// geçmezse MUHALEFET_ZORLA_TUR'da en zayıf olan üzerinden zorla.
const MUHALEFET_HAZINE_ESIGI = 15;
const MUHALEFET_KOALISYON_ESIGI = 45;
const MUHALEFET_ONAY_ESIGI = 45;
const MUHALEFET_ZORLA_TUR = 9;

function muhalefetKontrol(s, gelecekTur) {
  if (s.muhalefetTetiklendi) return null;
  if (gelecekTur < 3 || gelecekTur > TOPLAM_TUR) return null;

  // Her göstergeyi kendi eşiğine oranlayarak karşılaştırılabilir hale getirir;
  // 1'in altı, o göstergenin eşiği geçtiği anlamına gelir.
  const durumlar = [
    { id: "siy-muh-1", oran: s.ist.hazine / MUHALEFET_HAZINE_ESIGI },
    { id: "siy-muh-2", oran: s.koalisyon / MUHALEFET_KOALISYON_ESIGI },
    { id: "siy-muh-3", oran: s.ist.onay / MUHALEFET_ONAY_ESIGI },
  ];

  const kritik = durumlar.filter((d) => d.oran < 1);
  if (kritik.length > 0) {
    kritik.sort((a, b) => a.oran - b.oran);
    return kritik[0].id;
  }

  if (gelecekTur >= MUHALEFET_ZORLA_TUR) {
    return [...durumlar].sort((a, b) => a.oran - b.oran)[0].id;
  }

  return null;
}

// Seçim (Doküman Bölüm 11)
// Muhalefetin sadık bir tabanı vardır; oy oranı göstergelerin doğrudan ortalaması değildir.
// Seçim, nötr bir noktadan (57) yukarı ya da aşağı sapma olarak hesaplanır.
const SECIM_NOTR = 57;
const SECIM_EGIM = 0.85;
// Vaadin kendi ödülü/cezası yoksa kullanılan varsayılan.
const VAAT_ODUL = 8;
const VAAT_CEZA = 6;

// Bir vaadin tutulunca kazandırdığı, tutulmayınca kaybettirdiği puan.
const vaatOdul = (v) => (v && v.odul != null ? v.odul : VAAT_ODUL);
const vaatCeza = (v) => (v && v.ceza != null ? v.ceza : VAAT_CEZA);

function secimHesapla(s) {
  const performans = s.ist.onay * 0.55 + s.ist.istikrar * 0.25 + s.ist.kuresel * 0.2;
  const temel = 50 + (performans - SECIM_NOTR) * SECIM_EGIM;
  const vaatDurum = s.vaatler.map((vid) => {
    const v = VAATLER.find((x) => x.id === vid);
    const d = vaatDurumu(v, s);
    return { ...v, ...d };
  });
  const vaatPuan = vaatDurum.reduce((a, v) => a + (v.tutuldu ? vaatOdul(v) : -vaatCeza(v)), 0);
  const oy = Math.max(0, Math.min(100, temel + vaatPuan));
  return { performans, temel, vaatDurum, vaatPuan, oy, kazandi: oy > 50 };
}

// Görev süresinin nasıl kapandığı. Eskiden tek bir ayrım vardı — seçildin ya da
// kaybettin — ve şüphe izlencesi anlatısal karşılığını hiç almıyordu: temiz
// yönetip %52 ile kazanmak, yetkileri askıya alınmışken %52 ile kazanmakla
// aynı ekranı veriyordu. Artık iki eksen okunuyor: sandık ve arkanda bıraktığın
// dosya. `mansetSec` gibi öncelik sıralıdır — en özel koşul en üstte.
//
// Görevden alınma (azil) burada yoktur; onun kendi ekranı var ve oyun orada
// zaten bitmiştir.
function finalKarti(s, r) {
  const gecmis = s.kademeGecmisi || [];
  const kisitlandi = gecmis.includes("kisitlama");
  const sorusturuldu = gecmis.includes("sorusturma");
  const L = MUHALEFET_LIDERI.soyad;

  if (r.kazandi) {
    // Dosya, sandıktan önce gelir: nasıl kazandığın ne kadar kazandığından önemli.
    if (kisitlandi)
      return {
        kod: "karanlik-zafer",
        baslik: "Kazandın, dosya kapanmadı",
        metin: `Görev süren yenilendi ama yetkilerinin bir dönem askıya alındığı tutanakta duruyor. ${L} yenilgiyi kabul ederken kürsüde tek bir cümle kurdu: «Bu dosya bizimle bitmiyor.»`,
        ton: "karanlik",
      };
    if (sorusturuldu)
      return {
        kod: "golgeli-zafer",
        baslik: "Gölgede kalan zafer",
        metin: `Sandık seni doğruladı, ama hakkında açılan soruşturmanın dosyası kapanmadı. Zaferin ilk günü, kutlamadan çok açıklamayla geçti.`,
        ton: "golgeli",
      };
    if (r.oy >= 60)
      return {
        kod: "ezici-zafer",
        baslik: "Ezici çoğunlukla yeniden seçildin",
        metin: `Sonuç tartışmaya yer bırakmadı. ${L} sonuçları sandık kapanmadan kabul etti; muhalefet grubu gece yarısından önce dağıldı.`,
        ton: "parlak",
      };
    if (r.oy <= 52)
      return {
        kod: "kil-payi-zafer",
        baslik: "Kıl payı kazandın",
        metin: `Fark birkaç puan. Beş yıl daha görevdesin, ama bu sonuç bir yetki değil bir uyarı — ${L} sandık başında bekleyen kalabalığa «Bu bitmedi» dedi.`,
        ton: "solgun",
      };
    return {
      kod: "temiz-zafer",
      baslik: "Yeniden seçildin",
      metin: `Görev süren yenilendi ve arkanda açık bir dosya kalmadı. Devir teslim yok; masandaki işler kaldığı yerden devam ediyor.`,
      ton: "parlak",
    };
  }

  if (kisitlandi)
    return {
      kod: "karanlik-yenilgi",
      baslik: "Hem koltuğu hem dosyayı bıraktın",
      metin: `Seçimi kaybettin ve yetkilerinin askıya alındığı dönem tutanakta kaldı. Görevi devralan ekip, ilk iş olarak o dosyayı istedi.`,
      ton: "karanlik",
    };
  if (sorusturuldu)
    return {
      kod: "golgeli-yenilgi",
      baslik: "Seçimi kaybettin, soruşturma sürüyor",
      metin: `Sandık kararını verdi. Hakkındaki inceleme ise görevin bitmesiyle kapanmıyor — dosya yeni yönetime devredildi.`,
      ton: "karanlik",
    };
  if (r.oy >= 47)
    return {
      kod: "kil-payi-yenilgi",
      baslik: "Kıl payı kaybettin",
      metin: `Birkaç puan yetmedi. ${L} kürsüye çıktığında salonun yarısı hâlâ senin adını sayıyordu.`,
      ton: "solgun",
    };
  if (r.oy < 40)
    return {
      kod: "agir-yenilgi",
      baslik: "Ağır bir yenilgi",
      metin: `Sonuç tartışmasız. Beş yıl boyunca imzaladığın her belge bu gece yeniden konuşuluyor — hiçbiri lehine değil.`,
      ton: "karanlik",
    };
  return {
    kod: "yenilgi",
    baslik: "Seçimi kaybettin",
    metin: `Görev süren doldu ve sandık başkasını işaret etti. Devir teslim için üç hafta var.`,
    ton: "solgun",
  };
}

// ============================================================
//  KAYIT KATMANI
// ============================================================

const KAYIT_ANAHTARI = "the-directive:kayit";
const KAYIT_SURUMU = 1;

function depoVar() {
  return typeof window !== "undefined" && !!window.localStorage;
}

// Kayıttan dönerken geri yüklenebilen ekranlar: yalnızca tamamen `durum`dan
// çizilenler. Muhalefet hamlesi bu listede olmak zorunda — oyunda bir kez gelir
// ve eskiden kaydedip çıkan oyuncu onu tamamen kaybediyordu, çünkü devam her
// zaman panele dönüyordu. Gizli dosya da aynı sebeple burada.
const DEVAM_FAZLARI = ["panel", "gunluk", "gizli", "muhalefet"];

async function kayitYaz(durum, uiFaz) {
  if (!depoVar()) return false;
  try {
    window.localStorage.setItem(
      KAYIT_ANAHTARI,
      JSON.stringify({ surum: KAYIT_SURUMU, tarih: Date.now(), durum, uiFaz })
    );
    return true;
  } catch (hata) {
    console.error("Kayıt yazılamadı:", hata);
    return false;
  }
}

async function kayitOku() {
  if (!depoVar()) return null;
  try {
    const ham = window.localStorage.getItem(KAYIT_ANAHTARI);
    if (!ham) return null;
    const paket = JSON.parse(ham);
    // Sürüm uyuşmuyorsa eski kayıt kullanılamaz.
    if (paket.surum !== KAYIT_SURUMU || !paket.durum) return null;
    return paket;
  } catch (hata) {
    // Bozuk/okunamayan kayıt olabilir; bu normaldir.
    return null;
  }
}

async function kayitSil() {
  if (!depoVar()) return;
  try {
    window.localStorage.removeItem(KAYIT_ANAHTARI);
  } catch (hata) {
    /* zaten yoksa sorun değil */
  }
}

// ============================================================
//  ARAYÜZ BİLEŞENLERİ
// ============================================================

// Bir göstergenin son yarıyıl kapanışından bu yana değişimi.
function Degisim({ fark, taban, yuzdeGoster }) {
  if (!fark || Math.abs(fark) < 0.05) return null;
  const artis = fark > 0;
  const Ok = artis ? TrendingUp : TrendingDown;
  const renk = artis ? C.arti : C.eksi;
  const miktar = Math.abs(Math.round(fark));
  if (miktar < 1) return null; // yuvarlanınca sıfır kalıyorsa gösterme
  const yuzde =
    yuzdeGoster && taban ? Math.abs(Math.round((fark / taban) * 100)) : null;

  return (
    <span
      className="mono inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded"
      style={{
        fontSize: 10,
        color: renk,
        background: artis ? "rgba(61,220,132,.11)" : "rgba(229,85,90,.11)",
        whiteSpace: "nowrap",
      }}
    >
      <Ok size={11} strokeWidth={2.4} />
      {artis ? "+" : "−"}{miktar}
      {yuzde !== null && yuzde > 0 && <span style={{ opacity: 0.75 }}>%{yuzde}</span>}
    </span>
  );
}

// Kampanya sözlerinin canlı takibi — seçimde ±30 puan buna bağlı.
function VaatTakip({ s }) {
  return (
    <div className="kutu p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="mono" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.1em" }}>
          KAMPANYA SÖZLERİN
        </span>
        <span className="mono" style={{ fontSize: 9, color: C.sonuk }}>
          SEÇİMDE{" "}
          {s.vaatler.reduce((a, vid) => {
            const v = VAATLER.find((x) => x.id === vid);
            return a + vaatOdul(v) + vaatCeza(v);
          }, 0)}{" "}
          PUAN
        </span>
      </div>

      {s.vaatler.map((vid, i) => {
        const v = VAATLER.find((x) => x.id === vid);
        const d = vaatDurumu(v, s);
        const renk = d.tutuldu ? C.arti : C.pirinc;
        const dolgu = Math.max(0, Math.min(100, d.simdi));
        const isaret = Math.max(0, Math.min(100, d.hedef));

        return (
          <div key={vid} style={{ marginTop: i > 0 ? 16 : 0 }}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="sans font-semibold" style={{ fontSize: 12.5, color: "#F2F4F8", lineHeight: 1.35 }}>
                {v.ad}
              </span>
              <span
                className="mono px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  fontSize: 9,
                  color: renk,
                  background: d.tutuldu ? "rgba(61,220,132,.12)" : "rgba(201,162,39,.12)",
                }}
              >
                {d.tutuldu ? `+${vaatOdul(v)}` : `−${vaatCeza(v)}`}
              </span>
            </div>

            <div className="h-1.5 rounded-full overflow-hidden relative mb-1.5" style={{ background: "#1C2436" }}>
              <div className="h-full rounded-full cizgi" style={{ width: `${dolgu}%`, background: renk }} />
              <div
                className="absolute top-0 bottom-0"
                style={{ left: `${isaret}%`, width: 2, background: "#F2F4F8", opacity: 0.75 }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="mono" style={{ fontSize: 10, color: C.sonuk }}>
                {v.kisa} {Math.round(d.simdi)} · hedef {d.tersine ? "altı" : ""} {Math.round(d.hedef)}
              </span>
              <span className="mono" style={{ fontSize: 10, color: renk }}>
                {d.tutuldu ? "tutuluyor" : d.tersine ? "hedefin üstünde" : `${Math.ceil(d.hedef - d.simdi)} puan kaldı`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GenisOlcek({ ikon: Ikon, ad, deger, renk, altMetin, esik, fark, tavan = 100 }) {
  const oran = Math.max(0, Math.min(100, (deger / tavan) * 100));
  return (
    <div className="kutu p-4 mb-2.5">
      <div className="flex items-end justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Ikon size={14} style={{ color: renk }} />
          <span className="mono" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.12em" }}>
            {ad}
          </span>
          <Degisim fark={fark} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="sans font-bold tabular-nums" style={{ fontSize: 24, color: renk, lineHeight: 1 }}>
            {Math.round(deger)}
          </span>
          <span className="mono" style={{ fontSize: 11, color: C.sonuk }}>/{tavan}</span>
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden relative" style={{ background: "#1C2436" }}>
        <div className="h-full rounded-full cizgi" style={{ width: `${oran}%`, background: renk }} />
        {esik !== undefined && (
          <div className="absolute top-0 bottom-0" style={{ left: `${(esik / tavan) * 100}%`, width: 2, background: "#F2F4F8", opacity: 0.7 }} />
        )}
      </div>

      {altMetin && (
        <div className="sans mt-2.5" style={{ fontSize: 12.5, color: C.solgun, lineHeight: 1.5 }}>
          {altMetin}
        </div>
      )}
    </div>
  );
}

function IstatistikKutu({ tanim, deger, fark, taban, nakit }) {
  const Ikon = tanim.ikon;
  const dusuk = !tanim.para && deger <= 25;
  const orta = !tanim.para && deger > 25 && deger <= 45;
  const renk = dusuk ? C.eksi : orta ? "#E0A33C" : C.pirinc;
  return (
    <div className="kutu p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Ikon size={12} style={{ color: C.pirinc }} />
        <span className="mono" style={{ fontSize: 9, color: C.solgun, letterSpacing: "0.08em" }}>
          {tanim.ad.toUpperCase()}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span className="sans font-bold" style={{ fontSize: 20, color: dusuk ? C.eksi : "#F2F4F8" }}>
          {tanim.para ? `$${Math.round(deger)}B` : Math.round(deger)}
        </span>
        {!tanim.para && <Degisim fark={fark} taban={taban} />}
      </div>
      {!tanim.para && (
        <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: "#1C2436" }}>
          <div
            className="h-full rounded-full cizgi"
            style={{ width: `${Math.max(0, Math.min(100, deger))}%`, background: renk }}
          />
        </div>
      )}

      {tanim.para && nakit && (nakit.giren > 0 || nakit.cikan > 0) && (() => {
        const net = Math.round(nakit.giren) - Math.round(nakit.cikan);
        const fazla = net > 0;
        const denk = net === 0;
        const Ok = fazla ? TrendingUp : TrendingDown;
        const netRenk = denk ? C.solgun : fazla ? C.arti : C.eksi;

        return (
          <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${C.kenar}` }}>
            <div
              className="flex items-center gap-1 px-1.5 py-1 rounded"
              style={{
                background: denk
                  ? "rgba(139,147,167,.10)"
                  : fazla
                  ? "rgba(61,220,132,.11)"
                  : "rgba(229,85,90,.11)",
              }}
            >
              {!denk && <Ok size={11} strokeWidth={2.4} style={{ color: netRenk, flexShrink: 0 }} />}
              <span className="mono tabular-nums font-semibold" style={{ fontSize: 10.5, color: netRenk }}>
                {denk ? "" : fazla ? "+" : "−"}${Math.abs(net)}B
              </span>
              <span className="mono" style={{ fontSize: 9, color: netRenk, opacity: 0.8 }}>
                {denk ? "denk bütçe" : fazla ? "fazla" : "açık"}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function KolAyari({ kol, deger, oynanan, onDegis, nufuz }) {
  // Sıfıra doğru gitmek her zaman serbesttir (geri alma), uzaklaşmak nüfuz ister.
  const artamaz = oynanan >= 5 || deger >= 100 || (oynanan >= 0 && nufuz < KOL_MALIYET);
  const azalamaz = oynanan <= -5 || deger <= 0 || (oynanan <= 0 && nufuz < KOL_MALIYET);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="sans" style={{ fontSize: 12, color: C.solgun }}>{kol.ad}</span>
          {oynanan !== 0 && (
            <span
              className="mono px-1.5 py-0.5 rounded"
              style={{
                fontSize: 9,
                color: oynanan > 0 ? C.arti : C.eksi,
                background: oynanan > 0 ? "rgba(61,220,132,.12)" : "rgba(229,85,90,.12)",
              }}
            >
              {oynanan > 0 ? "+" : ""}{oynanan}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDegis(-5)}
            disabled={azalamaz}
            className="kol-btn"
            aria-label={`${kol.ad} azalt`}
          >
            <Minus size={12} />
          </button>
          <span className="sans font-semibold tabular-nums" style={{ fontSize: 13, color: "#F2F4F8", minWidth: 34, textAlign: "center" }}>
            %{deger}
          </span>
          <button
            onClick={() => onDegis(5)}
            disabled={artamaz}
            className="kol-btn"
            aria-label={`${kol.ad} artır`}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1C2436" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${deger}%`, background: C.pirinc }} />
      </div>
    </div>
  );
}

function BelgeRozeti({ tur }) {
  const stil = {
    KANUN: { renk: "#6C97E8", ikon: FileText },
    KARARNAME: { renk: C.pirinc, ikon: Scroll },
    OPERASYON: { renk: C.eksi, ikon: Zap },
  }[tur];
  const Ikon = stil.ikon;
  return (
    <span
      className="mono inline-flex items-center gap-1 px-2 py-0.5 rounded"
      style={{ fontSize: 9, color: stil.renk, border: `1px solid ${stil.renk}`, letterSpacing: "0.06em" }}
    >
      <Ikon size={9} /> {tur}
    </span>
  );
}

// ============================================================
//  ANA BİLEŞEN
// ============================================================

export default function TheDirective() {
  const [faz, setFaz] = useState("yukleniyor");
  const [kayit, setKayit] = useState(null);
  const [kayitZamani, setKayitZamani] = useState(null);
  const [menuAcik, setMenuAcik] = useState(false);
  const [bolumSekme, setBolumSekme] = useState("eylemler");
  const [iptalAdayi, setIptalAdayi] = useState(null);
  const [secilen, setSecilen] = useState([]);
  const [s, setS] = useState(null);
  const [bolumK, setBolumK] = useState(null);
  const [eylemId, setEylemId] = useState(null);
  const [secenekIdx, setSecenekIdx] = useState(null);
  const [sonuc, setSonuc] = useState(null);
  const [oylama, setOylama] = useState(null);
  const [muhalefetSonuc, setMuhalefetSonuc] = useState(null);

  const bolum = bolumK ? BOLUMLER[bolumK] : null;
  const eylem = bolum ? bolum.eylemler.find((e) => e.id === eylemId) : null;

  // Açılışta kayıtlı oyun var mı diye bakılır.
  useEffect(() => {
    let iptal = false;
    kayitOku().then((paket) => {
      if (iptal) return;
      setKayit(paket);
      setFaz(paket ? "acilis" : "vaatler");
    });
    return () => {
      iptal = true;
    };
  }, []);

  // Oyun ilerledikçe sessizce kaydedilir; dönem bitince kayıt silinir.
  useEffect(() => {
    if (!s) return;
    if (faz === "yukleniyor" || faz === "acilis" || faz === "vaatler") return;
    if (faz === "secim" || faz === "azil") {
      kayitSil();
      return;
    }
    let iptal = false;
    kayitYaz(s, faz).then((oldu) => {
      if (!iptal && oldu) setKayitZamani(Date.now());
    });
    return () => {
      iptal = true;
    };
  }, [s, faz]);

  function basla() {
    kayitSil();
    setKayit(null);
    setS(yeniOyun(secilen));
    setFaz("panel");
  }

  // Oyunu kaydedip ana menüye döner; ilerleme korunur.
  async function anaMenuyeDon() {
    setMenuAcik(false);
    await kayitYaz(s, faz);
    setKayit({ surum: KAYIT_SURUMU, tarih: Date.now(), durum: s, uiFaz: faz });
    setFaz("acilis");
  }

  // Görevi tamamen bırakır: kayıt silinir, sıfırdan başlanır.
  function goreviBirak() {
    setMenuAcik(false);
    yenidenBasla();
  }

  function kayittanDevam() {
    if (!kayit) return;
    setS(kayit.durum);
    setFaz(DEVAM_FAZLARI.includes(kayit.uiFaz) ? kayit.uiFaz : "panel");
  }

  function yenidenBasla() {
    kayitSil();
    setKayit(null);
    setKayitZamani(null);
    setS(null);
    setSecilen([]);
    setBolumK(null);
    setEylemId(null);
    setSecenekIdx(null);
    setSonuc(null);
    setOylama(null);
    setIptalAdayi(null);
    setBolumSekme("eylemler");
    setFaz("vaatler");
  }

  function vaatSec(id) {
    setSecilen((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? p : [...p, id]
    );
  }

  function kolOynat(kolK, delta) {
    setS((prev) => {
      const oynanan = prev.kolDegisimi[kolK] || 0;
      const yeniOynanan = oynanan + delta;

      // Tur başına net ±5 puan sınırı
      if (Math.abs(yeniOynanan) > 5) return prev;

      const hedef = kirp(prev.kollar[kolK] + delta);
      if (hedef === prev.kollar[kolK]) return prev; // 0/100 sınırına dayandı

      // Kararı geri almak bedelsizdir; harcanan nüfuz iade edilir.
      const geriAliyor = Math.abs(yeniOynanan) < Math.abs(oynanan);
      if (!geriAliyor && prev.ist.nufuz < KOL_MALIYET) return prev;

      return {
        ...prev,
        kollar: { ...prev.kollar, [kolK]: hedef },
        kolDegisimi: { ...prev.kolDegisimi, [kolK]: yeniOynanan },
        ist: {
          ...prev.ist,
          nufuz: geriAliyor
            ? Math.min(NUFUZ_TAVAN, prev.ist.nufuz + KOL_MALIYET)
            : prev.ist.nufuz - KOL_MALIYET,
        },
      };
    });
  }

  function eylemUygula() {
    const secenek = eylem.secenekler[secenekIdx];
    const maliyet = NUFUZ_MALIYET[eylem.tur];
    if (!eylemDurumu(s, eylem).acik) return;
    if (s.ist.nufuz < maliyet) return;
    if (eylem.tur !== "OPERASYON" && aktifBelgeSayisi(s) >= KAPASITE) return;

    let yeni = etkiUygula(s, { nufuz: -maliyet });
    const h = sonucHesapla(secenek, s);
    const kazanan = secenek.sonuclar[h.kazananIdx];
    const gizli = gizliMi(eylem, secenek, kazanan);

    if (eylem.tur === "KANUN") {
      const oy = meclisOyla(yeni, gerekenOy(eylem));
      setOylama(oy);
      if (oy.gecti) {
        // Kabul edilen kanun tek seferliktir.
        yeni = { ...yeni, kullanim: { ...yeni.kullanim, [eylem.id]: yeni.tur } };
        yeni = etkiUygula(yeni, { nufuz: KANUN_IADE });
        yeni = {
          ...yeni,
          belgeler: [
            ...yeni.belgeler,
            {
              anahtar: `${eylem.id}-${yeni.tur}`,
              eylemId: eylem.id,
              ad: eylem.ad,
              tur: eylem.tur,
              etki: kazanan.etki,
              sonucMetni: kazanan.metin,
              alinti: kazanan.alinti,
              gecikmeli: kazanan.gecikmeli,
              gecikmeliMetin: kazanan.gecikmeliMetin,
              gizli,
              oyToplam: oy.toplam,
              oyGereken: oy.gereken,
              durum: "onaylandi",
              yururlukTuru: yeni.tur + KANUN_YURURLUK,
              tamamlanmaTuru: yeni.tur + KANUN_TAMAMLANMA,
            },
          ],
        };
      } else {
        // Reddedilen tasarı yanmaz; birkaç tur sonra yeniden sunulabilir.
        yeni = { ...yeni, reddedilen: { ...yeni.reddedilen, [eylem.id]: yeni.tur } };
        yeni = etkiUygula(yeni, { nufuz: -4 });
      }
      setSonuc({ ...h, kazanan, gecti: oy.gecti });
    } else if (eylem.tur === "KARARNAME") {
      setOylama(null);
      yeni = {
        ...yeni,
        kullanim: { ...yeni.kullanim, [eylem.id]: yeni.tur },
        belgeler: [
          ...yeni.belgeler,
          {
            anahtar: `${eylem.id}-${yeni.tur}`,
            eylemId: eylem.id,
            ad: eylem.ad,
            tur: eylem.tur,
            etki: kazanan.etki,
            sonucMetni: kazanan.metin,
            alinti: kazanan.alinti,
            gecikmeli: kazanan.gecikmeli,
            gecikmeliMetin: kazanan.gecikmeliMetin,
            gizli,
            durum: "onaylandi",
            yururlukTuru: yeni.tur + 1,
            tamamlanmaTuru: null,
          },
        ],
      };
      setSonuc({ ...h, kazanan, gecti: true });
    } else {
      setOylama(null);
      yeni = etkiUygula(yeni, kazanan.etki);
      const haberKuyrugu = [
        ...(yeni.bekleyenHaberler || []),
        {
          tip: "operasyon",
          ad: eylem.ad,
          // Gizli iş Resmî Gazete filtresine zaten takılmaz; ayrı bir belge türü
          // vermek onu gazetenin hiçbir bölümüne düşmez hale getirir.
          belgeTuru: gizli ? "GİZLİ" : "OPERASYON",
          metin: kazanan.metin,
          alinti: kazanan.alinti,
          etki: kazanan.etki,
          gizli,
        },
      ];
      const kuyruk = kazanan.gecikmeli
        ? [
            ...(yeni.bekleyenEtkiler || []),
            {
              tur: yeni.tur + ETKI_GECIKMESI,
              kaynak: eylem.ad,
              metin: kazanan.gecikmeliMetin || "Operasyonun asıl etkisi şimdi hissedildi.",
              etki: kazanan.gecikmeli,
              gizli,
            },
          ]
        : yeni.bekleyenEtkiler || [];
      yeni = {
        ...yeni,
        bekleyenEtkiler: kuyruk,
        bekleyenHaberler: haberKuyrugu,
        kullanim: { ...yeni.kullanim, [eylem.id]: yeni.tur },
        arsiv: [...yeni.arsiv, { anahtar: `${eylem.id}-${yeni.tur}`, ad: eylem.ad, tur: eylem.tur, durum: "tamamlandi" }],
      };
      setSonuc({ ...h, kazanan, gecti: true });
    }

    setS(yeni);
    setFaz(eylem.tur === "KANUN" ? "oylama" : "sonuc");
  }

  function belgeIptal(anahtar) {
    setIptalAdayi(null);
    setS((prev) => {
      // Yürürlüğe girmiş belge de, henüz girmemiş olan da geri çekilebilir.
      // Aksi halde aynı turda açılan belgeler kapasiteyi doldurup kilitliyordu.
      const b = prev.belgeler.find((x) => x.anahtar === anahtar);
      if (!b) return prev;
      let yeni = { ...prev, belgeler: prev.belgeler.filter((x) => x.anahtar !== anahtar) };
      yeni = etkiUygula(yeni, { nufuz: -2, onay: -3 });
      return yeni;
    });
  }

  function turuBitir() {
    const yeni = turSonu(s);
    setS(yeni);
    if (yeni.faz === "azil") setFaz("azil");
    else setFaz(yeni.faz === "secim" ? "secim" : "gunluk");
  }

  // Muhalefet hamlesine oyuncunun tepkisi. Nüfuz harcanmaz — bu oyuncunun
  // başlattığı bir eylem değil, muhalefetin oyuncuya dayattığı bir an.
  function muhalefetSecenekSec(secenekIdx) {
    const muhalefetEylem = MUHALEFET_HAMLELERI.find((m) => m.id === s.muhalefetEylemId);
    if (!muhalefetEylem) return;
    const secenek = muhalefetEylem.secenekler[secenekIdx];
    const h = sonucHesapla(secenek, s);
    const kazanan = secenek.sonuclar[h.kazananIdx];
    let yeni = etkiUygula(s, kazanan.etki);
    const kuyruk = kazanan.gecikmeli
      ? [
          ...(yeni.bekleyenEtkiler || []),
          {
            tur: yeni.tur + ETKI_GECIKMESI,
            kaynak: muhalefetEylem.ad,
            metin: kazanan.gecikmeliMetin || "Uzlaşmanın asıl etkisi şimdi hissedildi.",
            etki: kazanan.gecikmeli,
            gizli: gizliMi(muhalefetEylem, secenek, kazanan),
          },
        ]
      : yeni.bekleyenEtkiler || [];
    yeni = { ...yeni, bekleyenEtkiler: kuyruk };
    setS(yeni);
    setMuhalefetSonuc({ secenekIdx, kazanan });
  }

  // ---------- AÇILIŞ ----------
  if (faz === "yukleniyor") {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center px-6">
          <Landmark size={30} style={{ color: C.pirinc }} className="mb-4 nabiz" />
          <div className="mono" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.2em" }}>
            DOSYALAR AÇILIYOR
          </div>
        </div>
      </Kabuk>
    );
  }

  if (faz === "acilis" && kayit) {
    const k = kayit.durum;
    const t = takvim(k.tur);
    const gecenGun = Math.floor((Date.now() - kayit.tarih) / 86400000);
    const zamanMetni =
      gecenGun === 0 ? "bugün" : gecenGun === 1 ? "dün" : `${gecenGun} gün önce`;

    return (
      <Kabuk>
        <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-5 py-10">
          <div className="mono mb-2" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
            CUMHURBAŞKANLIĞI ARŞİVİ
          </div>
          <h1 className="sans font-extrabold mb-6" style={{ fontSize: 32, color: "#F2F4F8", letterSpacing: "-0.02em" }}>
            The Directive
          </h1>

          <div className="kutu p-5 mb-3" style={{ borderColor: C.pirinc }}>
            <div className="mono mb-3" style={{ fontSize: 9.5, color: C.pirinc, letterSpacing: "0.12em" }}>
              YARIM KALAN GÖREV
            </div>
            <div className="sans font-bold mb-1" style={{ fontSize: 24, color: "#F2F4F8", lineHeight: 1.1 }}>
              {t.yil}
            </div>
            <div className="mono mb-4" style={{ fontSize: 11, color: C.solgun, letterSpacing: "0.06em" }}>
              {t.donem.toUpperCase()} · {k.tur}. YARIYIL / {TOPLAM_TUR}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                ["Onay", Math.round(k.ist.onay)],
                ["İstikrar", Math.round(k.ist.istikrar)],
                ["Hazine", `$${Math.round(k.ist.hazine)}B`],
              ].map(([ad, deger]) => (
                <div key={ad}>
                  <div className="mono" style={{ fontSize: 9, color: C.sonuk, letterSpacing: "0.08em" }}>
                    {ad.toUpperCase()}
                  </div>
                  <div className="sans font-bold" style={{ fontSize: 16, color: "#F2F4F8" }}>
                    {deger}
                  </div>
                </div>
              ))}
            </div>

            <div className="mono mb-4" style={{ fontSize: 10, color: C.sonuk }}>
              Son kaydedilme: {zamanMetni}
            </div>

            <button onClick={kayittanDevam} className="btn-ana w-full py-3.5 rounded-lg">
              Göreve devam et
            </button>
          </div>

          <button
            onClick={() => { setKayit(null); setFaz("vaatler"); }}
            className="btn-ikincil w-full py-3 rounded-lg"
          >
            Yeni göreve başla
          </button>
          <div className="mono mt-2 text-center" style={{ fontSize: 10, color: C.sonuk, lineHeight: 1.5 }}>
            Yeni göreve başlarsan yarım kalan dosya silinir.
          </div>
        </div>
      </Kabuk>
    );
  }

  // ---------- VAAT SEÇİMİ ----------
  if (faz === "vaatler") {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto px-5 pt-12 pb-10">
          <div className="mono mb-2" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
            KAMPANYA DOSYASI
          </div>
          <h1 className="sans font-extrabold mb-1" style={{ fontSize: 34, color: "#F2F4F8", letterSpacing: "-0.02em" }}>
            The Directive
          </h1>
          <p className="sans mb-8" style={{ fontSize: 13, color: C.solgun, lineHeight: 1.6 }}>
            Beş yıllık görev süren başlıyor. Halka iki söz vereceksin — dönem sonunda
            bu sözler tutuldu mu diye bakılacak ve seçim sonucunu doğrudan etkileyecek.
          </p>

          <div className="mono mb-3" style={{ fontSize: 10, color: secilen.length === 2 ? C.arti : C.solgun, letterSpacing: "0.1em" }}>
            {secilen.length}/2 SEÇİLDİ
          </div>

          <div className="flex flex-col gap-2.5 mb-8">
            {VAATLER.map((v) => {
              const aktif = secilen.includes(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => vaatSec(v.id)}
                  className="kutu p-4 text-left flex items-start gap-3 transition-colors"
                  style={{ borderColor: aktif ? C.pirinc : C.kenar }}
                >
                  <div className="flex-1">
                    <div className="sans font-semibold mb-1" style={{ fontSize: 14, color: "#F2F4F8" }}>
                      {v.ad}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: C.sonuk, letterSpacing: "0.04em" }}>
                      {v.kategori.toUpperCase()} · {v.kosulMetni}
                    </div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ borderColor: aktif ? C.pirinc : C.sonuk, background: aktif ? C.pirinc : "transparent" }}
                  >
                    {aktif && <Check size={12} style={{ color: C.zemin }} />}
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={basla} disabled={secilen.length !== 2} className="btn-ana w-full py-3.5 rounded-lg">
            Göreve başla
          </button>
        </div>
      </Kabuk>
    );
  }

  // ---------- GÖREVDEN ALINMA ----------
  if (faz === "azil") {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-5 py-10">
          <Scale size={38} style={{ color: C.eksi }} className="mb-5" />
          <div className="mono mb-2" style={{ fontSize: 10, color: C.eksi, letterSpacing: "0.2em" }}>
            YÖNETİM BAŞKANLIĞI KARARI
          </div>
          <h1 className="sans font-extrabold mb-4" style={{ fontSize: 30, color: C.eksi, lineHeight: 1.15 }}>
            Görevden alındın
          </h1>
          <p className="sans mb-6" style={{ fontSize: 13.5, color: C.solgun, lineHeight: 1.65 }}>
            Yönetim Başkanlığı'nın raporu Meclis'e sunuldu. Görevine son verildi ve
            hakkında yargı süreci başlatıldı. Görev sürenin {s.tur - 1}. yarıyılında
            koltuğunu kaybettin.
          </p>

          <div className="kutu p-5 mb-3">
            <div className="mono mb-3" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.1em" }}>
              DOSYADA NE VAR
            </div>
            <Satir ad="Şüphe düzeyi" deger={Math.round(s.suphe)} renk={C.eksi} />
            <Satir ad="Yürürlükteki belgen" deger={s.belgeler.length} />
            <Satir ad="Tamamlanan belgen" deger={s.arsiv.length} />
            <div className="border-t my-2.5" style={{ borderColor: C.kenar }} />
            <Satir ad="Halkın onayı" deger={Math.round(s.ist.onay)} />
            <Satir ad="Ülkenin istikrarı" deger={Math.round(s.ist.istikrar)} />
          </div>

          <div className="mono mb-5 px-1" style={{ fontSize: 11, color: C.sonuk, lineHeight: 1.6 }}>
            Yönetim Başkanlığı yarı bağımsız çalışır. Denetim eylemleriyle şüpheyi
            düşürebilir, yargı ve basın kollarını ayarlayarak birikme hızını
            değiştirebilirsin.
          </div>

          <button onClick={yenidenBasla} className="btn-ana w-full py-3.5 rounded-lg inline-flex items-center justify-center gap-2">
            <RotateCcw size={15} /> Yeniden başla
          </button>
        </div>
      </Kabuk>
    );
  }

  // ---------- SEÇİM SONUCU ----------
  if (faz === "secim") {
    return <SecimEkrani s={s} onYeniden={yenidenBasla} />;
  }

  // ---------- TUR GÜNLÜĞÜ ----------
  // Gazeteden sonra sırasıyla: gizli dosya (varsa) → muhalefet hamlesi (varsa) → panel.
  const gizliHaberler = ((s.gunluk && s.gunluk.haberler) || []).filter((h) => h.gizli);
  const gunlukSonrasi = () =>
    gizliHaberler.length > 0 ? "gizli" : s.faz === "muhalefet" ? "muhalefet" : "panel";

  if (faz === "gunluk") {
    return <Gazete rapor={s.gunluk} sonrakiTur={s.tur} onDevam={() => setFaz(gunlukSonrasi())} />;
  }

  // ---------- GİZLİ DOSYA ----------
  if (faz === "gizli" && gizliHaberler.length > 0) {
    return (
      <GizliDosya
        haberler={gizliHaberler}
        onDevam={() => setFaz(s.faz === "muhalefet" ? "muhalefet" : "panel")}
      />
    );
  }

  // ---------- MUHALEFET HAMLESİ ----------
  if (faz === "muhalefet") {
    const muhalefetEylem = MUHALEFET_HAMLELERI.find((m) => m.id === s.muhalefetEylemId);
    if (muhalefetEylem) {
      return (
        <MuhalefetHamlesi
          eylem={muhalefetEylem}
          s={s}
          sonuc={muhalefetSonuc}
          onSecenekSec={muhalefetSecenekSec}
          onDevam={() => {
            setMuhalefetSonuc(null);
            setFaz("panel");
          }}
        />
      );
    }
  }

  // ---------- MECLİS OYLAMASI (animasyonlu) ----------
  if (faz === "oylama" && eylem && oylama) {
    return <MeclisOylamasi eylem={eylem} oylama={oylama} onDevam={() => setFaz("sonuc")} />;
  }

  // ---------- EYLEM SONUCU (KAĞIT KATMANI) ----------
  if (faz === "sonuc" && eylem && sonuc) {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto px-4 pt-8 pb-10">
          <div className="kagit p-6 mb-4 relative overflow-hidden">
            <div
              className="damga sans font-extrabold absolute"
              style={{
                color: sonuc.gecti ? C.damga : C.sonuk,
                border: `3px solid ${sonuc.gecti ? C.damga : C.sonuk}`,
                top: 18, right: 14, padding: "3px 10px", borderRadius: 6,
                fontSize: 15, letterSpacing: "0.06em",
              }}
            >
              {eylem.tur === "KANUN" ? (sonuc.gecti ? "KABUL" : "RED") : "İMZALANDI"}
            </div>

            <div className="mono mb-3" style={{ fontSize: 9, color: C.damga, letterSpacing: "0.15em" }}>
              {eylem.tur} · TUR {s.tur}
            </div>
            <h2 className="mono font-bold mb-4" style={{ fontSize: 17, color: C.murekkep }}>
              {eylem.ad}
            </h2>

            {oylama && (
              <div className="mb-4 pb-4" style={{ borderBottom: `1px solid #C9BE9E` }}>
                <div className="mono mb-2" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.12em" }}>
                  MECLİS OYLAMASI
                </div>
                <KagitSatir ad="Koalisyon" deger={Math.round(oylama.temel)} />
                <KagitSatir ad="Parti sadakati" deger={oylama.sadakatBonus >= 0 ? `+${oylama.sadakatBonus}` : oylama.sadakatBonus} />
                <KagitSatir ad="Halk desteği" deger={oylama.onayBonus >= 0 ? `+${oylama.onayBonus}` : oylama.onayBonus} />
                <KagitSatir ad="Toplam oy" deger={oylama.toplam} kalin />
                <KagitSatir ad="Geçmek için" deger={oylama.gereken ?? BARAJ} />
              </div>
            )}

            {(!oylama || oylama.gecti) && (
              <>
                <div className="mono mb-2" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.12em" }}>
                  SONUÇ
                </div>
                <p className="mono mb-4" style={{ fontSize: 13, color: C.murekkep, lineHeight: 1.65 }}>
                  {sonuc.kazanan.metin}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Object.entries(sonuc.kazanan.etki).map(([k, v]) => (
                    <span
                      key={k}
                      className="mono px-2 py-1 rounded"
                      style={{
                        fontSize: 10,
                        background: etkiIyiMi(k, v) ? "rgba(45,110,70,0.14)" : "rgba(155,47,42,0.12)",
                        color: etkiIyiMi(k, v) ? "#2D6E46" : C.damga,
                      }}
                    >
                      {etkiMetni(k, v)}
                    </span>
                  ))}
                </div>
                <div className="mono" style={{ fontSize: 10, color: "#6B6250", lineHeight: 1.6 }}>
                  {eylem.tur === "KANUN" && `Yürürlük: tur ${s.tur + KANUN_YURURLUK} · Tamamlanma: tur ${s.tur + KANUN_TAMAMLANMA}`}
                  {eylem.tur === "KARARNAME" && `Yürürlük: tur ${s.tur + 1}`}
                  {eylem.tur === "OPERASYON" && "Anında uygulandı"}
                </div>
              </>
            )}

            {oylama && !oylama.gecti && (
              <p className="mono" style={{ fontSize: 13, color: C.murekkep, lineHeight: 1.65 }}>
                Tasarı barajı geçemedi. Meclis'ten döndü, hiçbir etkisi olmadı — üstelik
                bu başarısızlık siyasi itibarına mal oldu.
              </p>
            )}
          </div>

          <button
            onClick={() => { setFaz("bolum"); setSonuc(null); setOylama(null); setSecenekIdx(null); }}
            className="btn-ikincil w-full py-3 rounded-lg"
          >
            {bolum.ad}'e dön
          </button>
        </div>
      </Kabuk>
    );
  }

  // ---------- EYLEM DETAYI (KAĞIT KATMANI) ----------
  if (faz === "eylem" && eylem) {
    const maliyet = NUFUZ_MALIYET[eylem.tur];
    const nufuzYetersiz = s.ist.nufuz < maliyet;
    const kapasiteDolu = eylem.tur !== "OPERASYON" && aktifBelgeSayisi(s) >= KAPASITE;

    return (
      <Kabuk>
        <div className="max-w-md mx-auto px-4 pt-6 pb-10">
          <button onClick={() => { setFaz("bolum"); setSecenekIdx(null); }} className="btn-ikincil px-3 py-1.5 rounded-lg mb-4 inline-flex items-center gap-1.5" style={{ fontSize: 12 }}>
            <ArrowLeft size={13} /> {bolum.ad}
          </button>

          <div className="kagit p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="mono" style={{ fontSize: 9, color: C.damga, letterSpacing: "0.15em" }}>
                {eylem.tur} · {eylem.kategori.toUpperCase()}
              </div>
              <div className="mono" style={{ fontSize: 9, color: "#6B6250" }}>
                NÜFUZ −{maliyet}
              </div>
            </div>
            <h2 className="mono font-bold mb-3" style={{ fontSize: 18, color: C.murekkep, lineHeight: 1.3 }}>
              {eylem.ad}
            </h2>
            <p className="mono mb-5" style={{ fontSize: 13, color: "#3A3527", lineHeight: 1.65 }}>
              {eylem.metin}
            </p>

            <div className="mono mb-3" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.12em" }}>
              YAKLAŞIMINI SEÇ
            </div>

            <div className="flex flex-col gap-3">
              {eylem.secenekler.map((sec, i) => {
                const h = sonucHesapla(sec, s);
                const acik = secenekIdx === i;
                return (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden"
                    style={{ border: `1px solid ${acik ? C.damga : "#C9BE9E"}` }}
                  >
                    <button onClick={() => setSecenekIdx(acik ? null : i)} className="w-full text-left p-3">
                      <span className="mono font-semibold" style={{ fontSize: 13, color: C.murekkep }}>
                        {sec.ad}
                      </span>
                    </button>
                    {acik && (
                      <div className="px-3 pb-3">
                        {sec.sonuclar.map((so, j) => {
                          const kazanir = h.kazananIdx === j;
                          return (
                            <div key={j} className="flex gap-2.5 mb-2.5">
                              <span
                                className="mono font-bold px-1.5 py-0.5 rounded self-start"
                                style={{
                                  fontSize: 11,
                                  minWidth: 40,
                                  textAlign: "center",
                                  color: kazanir ? "#FFF" : "#6B6250",
                                  background: kazanir ? C.damga : "rgba(0,0,0,0.06)",
                                }}
                              >
                                %{h.yuzdeler[j]}
                              </span>
                              <span className="mono flex-1" style={{ fontSize: 11.5, color: kazanir ? C.murekkep : "#7A7260", lineHeight: 1.5 }}>
                                {so.metin}
                              </span>
                            </div>
                          );
                        })}
                        <div className="mono mt-2 pt-2" style={{ fontSize: 10, color: "#6B6250", borderTop: "1px dashed #C9BE9E" }}>
                          Yüksek yüzdeli sonuç gerçekleşir. Yüzdeler ülkenin mevcut
                          durumundan hesaplanır — durumu değiştirirsen sonuç da değişir.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {kapasiteDolu && (
            <div className="kutu p-3 mb-3 mono" style={{ fontSize: 11, color: C.eksi }}>
              Bürokratik kapasite dolu ({KAPASITE}/{KAPASITE}). Bu belgeyi açabilmek için
              panelden açık dosyalardan birini geri çekmen gerekiyor. Operasyonlar bu
              sınıra tabi değildir.
            </div>
          )}

          <button
            onClick={eylemUygula}
            disabled={secenekIdx === null || nufuzYetersiz || kapasiteDolu}
            className="btn-ana w-full py-3.5 rounded-lg"
          >
            {nufuzYetersiz
              ? `Nüfuz yetersiz (${maliyet} gerekli)`
              : eylem.tur === "KANUN"
              ? "Meclis'e gönder"
              : eylem.tur === "KARARNAME"
              ? "Kararnameyi imzala"
              : "Operasyonu başlat"}
          </button>
        </div>
      </Kabuk>
    );
  }

  // ---------- BÖLÜM EKRANI ----------
  if (faz === "bolum" && bolum) {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto px-4 pt-6 pb-10">
          <button onClick={() => setFaz("panel")} className="btn-ikincil px-3 py-1.5 rounded-lg mb-4 inline-flex items-center gap-1.5" style={{ fontSize: 12 }}>
            <ArrowLeft size={13} /> Panel
          </button>

          <h1 className="sans font-bold" style={{ fontSize: 26, color: "#F2F4F8" }}>
            {bolum.ad}
          </h1>
          <div className="mono mb-4" style={{ fontSize: 11, color: C.pirinc, letterSpacing: "0.08em" }}>
            {bolum.tamAd.toUpperCase()}
          </div>

          <div className="kutu p-4 mb-5">
            <p className="sans" style={{ fontSize: 12.5, color: C.solgun, lineHeight: 1.65 }}>
              {bolum.aciklama}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {bolum.kpi.map((k) => {
              const deger =
                k.k === "koalisyon"
                  ? s.koalisyon
                  : k.k === "supheKpi"
                  ? s.suphe
                  : s.kpi[k.k] ?? s.ist[k.k];
              return (
                <div key={k.k} className="kutu p-4">
                  <div
                    className="sans font-bold"
                    style={{
                      fontSize: 28,
                      color:
                        k.k === "supheKpi"
                          ? deger >= SUPHE_SORUSTURMA
                            ? C.eksi
                            : C.arti
                          : deger >= 50
                          ? C.arti
                          : C.eksi,
                    }}
                  >
                    {Math.round(deger)}
                  </div>
                  <div className="mono mt-1" style={{ fontSize: 9, color: C.solgun, letterSpacing: "0.08em" }}>
                    {k.ad.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 mb-5">
            {[
              { k: "eylemler", ad: "Eylemler", ikon: FileText, sayi: bolum.eylemler.length },
              { k: "kollar", ad: "Politika Kolları", ikon: SlidersHorizontal, sayi: bolum.kollar.length },
            ].map((t) => {
              const Ikon = t.ikon;
              const aktif = bolumSekme === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setBolumSekme(t.k)}
                  className="sekme flex-1 py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5"
                  style={{
                    background: aktif ? C.pirinc : "transparent",
                    borderColor: aktif ? C.pirinc : C.kenar,
                    color: aktif ? "#14100A" : C.solgun,
                  }}
                >
                  <Ikon size={13} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{t.ad}</span>
                  <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{t.sayi}</span>
                </button>
              );
            })}
          </div>

          {bolumSekme === "kollar" && (
            <>
              <div className="kutu p-4 mb-4">
                <div className="mono mb-4" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.1em" }}>
                  İNCE AYAR
                </div>
                {bolum.kollar.map((kol) => (
                  <KolAyari
                    key={kol.k}
                    kol={kol}
                    deger={s.kollar[kol.k]}
                    oynanan={s.kolDegisimi[kol.k] || 0}
                    nufuz={s.ist.nufuz}
                    onDegis={(d) => kolOynat(kol.k, d)}
                  />
                ))}
              </div>
              <div className="kutu p-4">
                <div className="mono mb-2" style={{ fontSize: 9.5, color: C.sonuk, letterSpacing: "0.12em" }}>
                  MEVZUAT NOTU
                </div>
                <div className="sans" style={{ fontSize: 12, color: C.sonuk, lineHeight: 1.7 }}>
                  Politika oranları, yürürlükteki mevzuat çerçevesinde Cumhurbaşkanlığı
                  tasarrufuyla belirlenir. Sınırlı düzeltmeler idari kararla uygulanır;
                  kapsamlı değişiklikler ancak kanunla hüküm altına alınabilir.
                </div>
              </div>
            </>
          )}

          {bolumSekme === "eylemler" && (
            <>
              {bolum.kategoriler.map((kat) => (
                <div key={kat} className="mb-5">
                  <div className="mono mb-2.5" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.12em" }}>
                    {kat.toUpperCase()}
                  </div>
                  {bolum.eylemler
                    .filter((e) => e.kategori === kat)
                    .map((e) => {
                      const d = eylemDurumu(s, e);
                      return (
                        <button
                          key={e.id}
                          onClick={() => { if (d.acik) { setEylemId(e.id); setSecenekIdx(null); setFaz("eylem"); } }}
                          disabled={!d.acik}
                          className="kutu p-4 w-full text-left mb-2.5"
                          style={{ opacity: d.acik ? 1 : 0.45 }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="sans font-semibold" style={{ fontSize: 14, color: "#F2F4F8" }}>
                              {e.ad}
                            </span>
                            {!d.acik && (
                              <span
                                className="mono px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ fontSize: 9, color: C.sonuk, border: `1px solid ${C.kenar}` }}
                              >
                                {d.etiket}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <BelgeRozeti tur={e.tur} />
                            {e.riskli && (
                              <span
                                className="mono px-1.5 py-0.5 rounded"
                                style={{ fontSize: 9, color: C.eksi, border: `1px solid ${C.eksi}` }}
                              >
                                RİSKLİ
                              </span>
                            )}
                            {e.buyuk && (
                              <span
                                className="mono px-1.5 py-0.5 rounded"
                                style={{ fontSize: 9, color: C.pirinc, border: `1px solid ${C.pirinc}` }}
                              >
                                BÜYÜK KANUN · {BUYUK_BARAJ} OY
                              </span>
                            )}
                            <span className="mono" style={{ fontSize: 10, color: C.sonuk }}>
                              {e.tur === "OPERASYON" ? `${e.bekleme} tur bekleme` : "tek seferlik"} · nüfuz {NUFUZ_MALIYET[e.tur]}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </>
          )}
        </div>
      </Kabuk>
    );
  }

  // ---------- ANA PANEL ----------
  return (
    <Kabuk>
      <div className="max-w-md mx-auto px-4 pt-8 pb-28">
        <div className="mb-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="mono mb-1" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
                THE DIRECTIVE
              </div>
              <div className="sans font-bold" style={{ fontSize: 27, color: "#F2F4F8", lineHeight: 1.05 }}>
                {takvim(s.tur).yil}
              </div>
              <div className="mono" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.14em" }}>
                {takvim(s.tur).donem.toUpperCase()}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="mono text-right" style={{ fontSize: 9, color: C.sonuk, lineHeight: 1.7 }}>
                GÖREV SÜRESİ<br />
                <span style={{ color: C.solgun }}>{Math.ceil(s.tur / 2)}. YIL</span>
              </div>
              <button
                onClick={() => setMenuAcik(true)}
                className="menu-btn"
                aria-label="Menüyü aç"
              >
                <Menu size={17} />
              </button>
            </div>
          </div>

          <div className="flex gap-1" aria-label={`Görev süresi: ${s.tur}. yarıyıl / ${TOPLAM_TUR}`}>
            {Array.from({ length: TOPLAM_TUR }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: 3,
                  background:
                    i === s.tur - 1 ? C.pirinc : i < s.tur - 1 ? "#5C4A1E" : "#1C2436",
                }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {ISTATISTIKLER.slice(0, 4).map((t) => (
            <IstatistikKutu
              key={t.k}
              tanim={t}
              deger={s.ist[t.k]}
              fark={s.ist[t.k] - s.onceki[t.k]}
              taban={s.onceki[t.k]}
              nakit={t.para ? s.nakit : undefined}
            />
          ))}
        </div>
        <div className="mb-6">
          <GenisOlcek
            ikon={Zap}
            ad="NÜFUZ"
            deger={s.ist.nufuz}
            tavan={NUFUZ_TAVAN}
            fark={s.ist.nufuz - s.onceki.nufuz}
            renk={s.ist.nufuz <= 20 ? C.eksi : C.pirinc}
            altMetin="Hamle yapma gücün."
          />
          {s.supheGorundu && (
            <GenisOlcek
              ikon={Eye}
              ad="ŞÜPHE"
              deger={s.suphe}
              renk={s.suphe >= SUPHE_KISITLAMA ? C.eksi : s.suphe >= SUPHE_SORUSTURMA ? "#E0A33C" : C.solgun}
              esik={SUPHE_SORUSTURMA}
              altMetin={
                s.suphe >= SUPHE_KISITLAMA
                  ? "Yönetim Başkanlığı üstüne geliyor. Bu gidişle görevden alınırsın."
                  : s.suphe >= SUPHE_SORUSTURMA
                  ? "Hakkında dosya açıldı. Denetim eylemleriyle şüpheyi düşürebilirsin."
                  : "Riskli hamlelerin kaydediliyor."
              }
            />
          )}

          <GenisOlcek
            ikon={Landmark}
            ad="KOALİSYON"
            deger={s.koalisyon}
            tavan={TOPLAM_SANDALYE}
            fark={s.koalisyon - s.onceki.koalisyon}
            renk={s.koalisyon >= BARAJ ? C.arti : C.eksi}
            esik={BARAJ}
            altMetin={
              s.koalisyon >= BARAJ
                ? `Mecliste ${Math.round(s.koalisyon)} sandalyen var, çoğunluk sende.`
                : "Çoğunluğu kaybettin. Kanun geçirmek artık parti sadakatine ve halk desteğine bağlı."
            }
          />
        </div>

        <VaatTakip s={s} />

        <div className="mono mb-3" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.1em" }}>
          BÖLÜMLER
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {Object.values(BOLUMLER).map((b) => {
            const Ikon = b.ikon;
            return (
              <button
                key={b.k}
                onClick={() => { setBolumK(b.k); setFaz("bolum"); }}
                className="kutu p-4 flex flex-col items-start text-left"
                style={{ minHeight: 118 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-auto"
                  style={{ background: "rgba(201,162,39,0.12)" }}
                >
                  <Ikon size={18} style={{ color: C.pirinc }} />
                </div>
                <div className="sans font-semibold mt-3" style={{ fontSize: 15, color: "#F2F4F8" }}>
                  {b.ad}
                </div>
                <div className="mono" style={{ fontSize: 9.5, color: C.sonuk, lineHeight: 1.3 }}>
                  {b.tamAd}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-1">
          <span className="mono" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.1em" }}>
            AÇIK DOSYALAR
          </span>
          <span
            className="mono px-1.5 py-0.5 rounded"
            style={{
              fontSize: 10,
              color: aktifBelgeSayisi(s) >= KAPASITE ? C.eksi : C.sonuk,
              background: aktifBelgeSayisi(s) >= KAPASITE ? "rgba(229,85,90,.12)" : "transparent",
            }}
          >
            {aktifBelgeSayisi(s)}/{KAPASITE}
          </span>
        </div>
        <div className="mono mb-3" style={{ fontSize: 10, color: C.sonuk, lineHeight: 1.5 }}>
          {aktifBelgeSayisi(s) >= KAPASITE
            ? "Bürokrasi doldu. Yeni kanun veya kararname için açık dosyalardan birini geri çekmelisin."
            : `Devlet aynı anda en fazla ${KAPASITE} büyük işi yürütebilir. Operasyonlar bu sayıya girmez.`}
        </div>

        {s.belgeler.length === 0 && s.arsiv.length === 0 && (
          <div className="kutu p-4 mono" style={{ fontSize: 11, color: C.sonuk }}>
            Henüz açık dosya yok. Bir bölüme gir ve ilk belgeni imzala.
          </div>
        )}

        {s.belgeler.map((b) => (
          <div key={b.anahtar} className="kutu p-3 mb-2.5 flex items-center gap-3">
            <div className="flex-1">
              <div className="sans font-semibold mb-1" style={{ fontSize: 13, color: "#F2F4F8" }}>{b.ad}</div>
              <div className="mono" style={{ fontSize: 10, color: C.sonuk }}>
                {b.durum === "onaylandi"
                  ? `Yürürlük: tur ${b.yururlukTuru}`
                  : `Tamamlanma: tur ${b.tamamlanmaTuru}`}
              </div>
            </div>
            <button onClick={() => setIptalAdayi(b)} className="kol-btn" aria-label={`${b.ad} geri çek`}>
              <X size={13} />
            </button>
          </div>
        ))}

        {s.arsiv.length > 0 && (
          <div className="kutu p-3 mt-2 flex items-center gap-2">
            <Archive size={13} style={{ color: C.sonuk }} />
            <span className="mono" style={{ fontSize: 11, color: C.sonuk }}>
              Arşivde {s.arsiv.length} tamamlanmış belge
            </span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3" style={{ background: `linear-gradient(to top, ${C.zemin} 70%, transparent)` }}>
        <div className="max-w-md mx-auto">
          <button onClick={turuBitir} className="btn-ana w-full py-3.5 rounded-lg">
            Sonraki yarıyıla geç
          </button>
          {kayitZamani && (
            <div className="mono mt-2 text-center" style={{ fontSize: 9, color: C.sonuk, letterSpacing: "0.08em" }}>
              ✓ İLERLEMEN KAYDEDİLDİ
            </div>
          )}
        </div>
      </div>
      {menuAcik && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
          style={{ background: "rgba(5,8,14,.78)" }}
          onClick={() => setMenuAcik(false)}
        >
          <div className="kutu p-5 w-full max-w-md modal-gir" onClick={(e) => e.stopPropagation()}>
            <div className="mono mb-1" style={{ fontSize: 9.5, color: C.pirinc, letterSpacing: "0.14em" }}>
              CUMHURBAŞKANLIĞI
            </div>
            <h3 className="sans font-bold mb-1" style={{ fontSize: 20, color: "#F2F4F8" }}>
              {takvim(s.tur).yil} · {takvim(s.tur).donem}
            </h3>
            <div className="mono mb-5" style={{ fontSize: 11, color: C.sonuk }}>
              {s.tur}. yarıyıl / {TOPLAM_TUR} · ilerlemen otomatik kaydediliyor
            </div>

            <button
              onClick={() => setMenuAcik(false)}
              className="btn-ana w-full py-3.5 rounded-lg mb-2.5"
            >
              Göreve dön
            </button>

            <button
              onClick={anaMenuyeDon}
              className="btn-ikincil w-full py-3 rounded-lg mb-2.5 inline-flex items-center justify-center gap-2"
            >
              <Home size={14} /> Kaydet ve ana menüye dön
            </button>

            <button
              onClick={goreviBirak}
              className="btn-ikincil w-full py-3 rounded-lg inline-flex items-center justify-center gap-2"
              style={{ color: C.eksi, borderColor: "rgba(229,85,90,.35)" }}
            >
              <Power size={14} /> Görevi bırak
            </button>
            <div className="mono mt-2 text-center" style={{ fontSize: 10, color: C.sonuk, lineHeight: 1.5 }}>
              Görevi bırakırsan bu dosya silinir ve sıfırdan başlarsın.
            </div>
          </div>
        </div>
      )}

      {iptalAdayi && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
          style={{ background: "rgba(5,8,14,.78)" }}
          onClick={() => setIptalAdayi(null)}
        >
          <div className="kutu p-5 w-full max-w-md modal-gir" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: C.eksi }} />
              <span className="mono" style={{ fontSize: 10, color: C.eksi, letterSpacing: "0.12em" }}>
                BELGEYİ GERİ ÇEK
              </span>
            </div>

            <h3 className="sans font-bold mb-2" style={{ fontSize: 17, color: "#F2F4F8" }}>
              {iptalAdayi.ad}
            </h3>
            <p className="sans mb-4" style={{ fontSize: 13, color: C.solgun, lineHeight: 1.6 }}>
              {iptalAdayi.durum === "yururlukte"
                ? `Bu belge tur ${iptalAdayi.tamamlanmaTuru}'de tamamlanacak ve etkisini bir kez
                   daha verecekti. Geri çekersen o kazanç iptal olur — şimdiye kadar verdiği
                   etki ise geri alınmaz.`
                : `Bu belge tur ${iptalAdayi.yururlukTuru}'de yürürlüğe girecekti. Geri çekersen
                   hiç yürürlüğe girmez; bugüne kadar bir etkisi olmadı.`}
            </p>

            <div className="kutu p-3 mb-4" style={{ background: "rgba(229,85,90,.07)", borderColor: "rgba(229,85,90,.3)" }}>
              <div className="mono mb-2" style={{ fontSize: 9, color: C.solgun, letterSpacing: "0.1em" }}>
                GERİ ÇEKMENİN BEDELİ
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="mono px-2 py-1 rounded" style={{ fontSize: 10, background: "rgba(229,85,90,.14)", color: C.eksi }}>
                  Nüfuz −2
                </span>
                <span className="mono px-2 py-1 rounded" style={{ fontSize: 10, background: "rgba(229,85,90,.14)", color: C.eksi }}>
                  Onay −3
                </span>
                <span className="mono px-2 py-1 rounded" style={{ fontSize: 10, background: "rgba(229,85,90,.14)", color: C.eksi }}>
                  {iptalAdayi.durum === "yururlukte"
                    ? "Tamamlanma bonusu iptal"
                    : "Belge hiç yürürlüğe girmez"}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setIptalAdayi(null)} className="btn-ikincil flex-1 py-3 rounded-lg">
                Vazgeç
              </button>
              <button onClick={() => belgeIptal(iptalAdayi.anahtar)} className="btn-tehlike flex-1 py-3 rounded-lg">
                Geri çek
              </button>
            </div>
          </div>
        </div>
      )}
    </Kabuk>
  );
}

// ---------- SEÇİM EKRANI (animasyonlu) ----------

// Final kartının tonunu renge çevirir.
const FINAL_RENK = {
  parlak: C.arti,
  solgun: C.pirinc,
  golgeli: "#E0A33C",
  karanlik: C.eksi,
};

function SecimEkrani({ s, onYeniden }) {
  const r = secimHesapla(s);
  const final = finalKarti(s, r);
  const [asama, setAsama] = useState("sandik"); // sandik → sayim → sonuc
  const [acilan, setAcilan] = useState(0); // açılan sandık oranı 0–1

  const azHareket =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Erken sandıklar taşradan gelir: taşra istikrarı ödüllendirir, şehir onayı.
  // Bu yüzden ilk sonuçlar gerçek değerden sapar ve sayım ilerledikçe oturur.
  const erkenSapma = Math.max(-11, Math.min(11, (s.ist.istikrar - s.ist.onay) / 1.4));

  useEffect(() => {
    if (azHareket) {
      setAcilan(1);
      setAsama("sonuc");
      return;
    }
    const t = setTimeout(() => setAsama("sayim"), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (asama !== "sayim") return;
    const sure = 11000;
    const basla = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - basla) / sure);
      setAcilan(1 - Math.pow(1 - t, 1.5)); // baştan dengeli, sonlara doğru yavaşlar
      if (t >= 1) {
        clearInterval(id);
        setTimeout(() => setAsama("sonuc"), 500);
      }
    }, 40);
    return () => clearInterval(id);
  }, [asama]);

  // O anki oy dağılımı — sayım geçerli oylar üzerinden ilerler
  const bilanco = sandikBilancosu(s);
  const sapma = erkenSapma * Math.pow(1 - acilan, 2);
  const benimYuzde = Math.max(0, Math.min(100, r.oy + sapma));
  const sayilanOy = Math.round(bilanco.gecerliOy * acilan);
  const benimOy = Math.round((sayilanOy * benimYuzde) / 100);
  const rakipOy = sayilanOy - benimOy;
  const rakipYuzde = 100 - benimYuzde;
  const ondeyim = benimYuzde >= 50;

  const bicim = (n) => n.toLocaleString("tr-TR");

  // ---- Sandık açılış ekranı ----
  if (asama === "sandik") {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center px-6">
          <Vote size={38} style={{ color: C.pirinc }} className="mb-5 nabiz" />
          <div className="mono mb-2 text-center" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
            BEŞ YIL DOLDU
          </div>
          <h1 className="sans font-extrabold text-center mb-3" style={{ fontSize: 26, color: "#F2F4F8" }}>
            Sandıklar açılıyor
          </h1>
          <p className="sans text-center" style={{ fontSize: 13, color: C.solgun, lineHeight: 1.6, maxWidth: 290 }}>
            Sandıklar kapandı, sayım başlıyor. Beş yıllık görev sürenin hesabı bu gece veriliyor.
          </p>
        </div>
      </Kabuk>
    );
  }

  return (
    <Kabuk>
      <div className="max-w-md mx-auto px-5 pt-12 pb-10">
        <div className="mono mb-2" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
          {asama === "sayim" ? "OYLAR SAYILIYOR" : "RESMÎ SONUÇ"}
        </div>

        <h1
          className="sans font-extrabold mb-6"
          style={{
            fontSize: asama === "sonuc" ? 26 : 30,
            minHeight: 40,
            lineHeight: 1.15,
            color: asama === "sonuc" ? FINAL_RENK[final.ton] : "#F2F4F8",
          }}
        >
          {asama === "sayim" ? "Sonuçlar geliyor…" : final.baslik}
        </h1>

        {/* Tek kart: sayım + sonuç */}
        <div className="kutu p-5 mb-3">
          {/* Açılan sandık */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="mono" style={{ fontSize: 9.5, color: C.solgun, letterSpacing: "0.12em" }}>
              AÇILAN SANDIK
            </span>
            <span className="mono tabular-nums" style={{ fontSize: 11, color: "#F2F4F8" }}>
              %{Math.round(acilan * 100)}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden mb-5" style={{ background: "#1C2436" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${acilan * 100}%`, background: C.sandik, transition: "width .18s linear" }}
            />
          </div>

          {/* Sen vs Muhalefet */}
          <div className="flex items-stretch justify-between mb-4">
            <div style={{ flex: 1 }}>
              <div className="mono mb-1" style={{ fontSize: 9, color: C.pirinc, letterSpacing: "0.12em" }}>
                SEN
              </div>
              <div className="sans font-extrabold tabular-nums" style={{ fontSize: 36, color: ondeyim ? C.arti : "#F2F4F8", lineHeight: 1 }}>
                %{benimYuzde.toFixed(1)}
              </div>
              <div className="mono tabular-nums mt-1" style={{ fontSize: 11, color: C.solgun }}>
                {bicim(benimOy)}
              </div>
            </div>

            <div className="w-px mx-3" style={{ background: C.kenar }} />

            <div style={{ flex: 1, textAlign: "right" }}>
              <div className="mono mb-1" style={{ fontSize: 9, color: C.solgun, letterSpacing: "0.12em" }}>
                {MUHALEFET_LIDERI.ad.toUpperCase()}
              </div>
              <div className="sans font-extrabold tabular-nums" style={{ fontSize: 36, color: !ondeyim ? C.eksi : "#8B93A7", lineHeight: 1 }}>
                %{rakipYuzde.toFixed(1)}
              </div>
              <div className="mono tabular-nums mt-1" style={{ fontSize: 11, color: C.solgun }}>
                {bicim(rakipOy)}
              </div>
            </div>
          </div>

          <div className="h-3 rounded-full overflow-hidden relative flex" style={{ background: "#1C2436" }}>
            <div style={{ width: `${benimYuzde}%`, background: ondeyim ? C.arti : C.pirinc, transition: "background-color .4s ease" }} />
            <div style={{ width: `${rakipYuzde}%`, background: !ondeyim ? C.eksi : "#39435C", transition: "background-color .4s ease" }} />
            <div className="absolute top-0 bottom-0" style={{ left: "50%", width: 2, background: "#F2F4F8", opacity: 0.75 }} />
          </div>
          <div className="mono mt-2 text-center" style={{ fontSize: 9, color: C.sonuk }}>
            kazanmak için %50
          </div>
        </div>

        {/* Sandık bilançosu — sade */}
        <div className="kutu p-4 mb-3">
          <div className="mono mb-2.5" style={{ fontSize: 9.5, color: C.solgun, letterSpacing: "0.12em" }}>
            SANDIK
          </div>
          <Satir ad="Geçerli oy" deger={bicim(Math.round(bilanco.gecerliOy * acilan))} />
          <Satir ad="Geçersiz ve boş" deger={bicim(Math.round(bilanco.gecersizOy * acilan))} renk={C.eksi} />
          <Satir ad="Sandığa gitmeyen" deger={bicim(Math.round(bilanco.sandigaGitmeyen * acilan))} renk={C.sonuk} />
          {asama === "sonuc" && (
            <div className="mono mt-2.5 pt-2.5" style={{ fontSize: 10, color: C.sonuk, lineHeight: 1.5, borderTop: `1px solid ${C.kenar}` }}>
              {bicim(bilanco.kayitliSecmen)} kayıtlı seçmen · katılım %{bilanco.katilimOrani.toFixed(1)}.
              Düzen bozuldukça insanlar sandığa daha az gidiyor.
            </div>
          )}
        </div>

        {asama === "sonuc" && (
          <div className="acilir">
            {/* Görev süresinin nasıl kapandığı — sandık ve arkanda kalan dosya birlikte */}
            <div
              className="kutu p-4 mb-3"
              style={{ borderColor: FINAL_RENK[final.ton], background: "rgba(255,255,255,.015)" }}
            >
              <div className="mono mb-2" style={{ fontSize: 9.5, color: FINAL_RENK[final.ton], letterSpacing: "0.12em" }}>
                GÖREV SÜRESİ KAPANDI
              </div>
              <p className="sans" style={{ fontSize: 13, color: C.solgun, lineHeight: 1.7 }}>
                {final.metin}
              </p>
            </div>

            <div className="kutu p-4 mb-3">
              <div className="mono mb-2.5" style={{ fontSize: 9.5, color: C.solgun, letterSpacing: "0.12em" }}>
                OYUNU NE BELİRLEDİ
              </div>
              <Satir ad="Halkın onayı" deger={Math.round(s.ist.onay)} />
              <Satir ad="Ülkenin istikrarı" deger={Math.round(s.ist.istikrar)} />
              <Satir ad="Dış itibar" deger={Math.round(s.ist.kuresel)} />
              <div className="border-t my-2.5" style={{ borderColor: C.kenar }} />
              <Satir
                ad="Görev karnen"
                deger={`%${Math.round(r.temel)}`}
                renk={r.temel >= 50 ? C.arti : C.eksi}
              />
              <div className="border-t my-2.5" style={{ borderColor: C.kenar }} />
              {r.vaatDurum.map((v) => (
                <Satir
                  key={v.id}
                  ad={`${v.tutuldu ? "✓" : "✗"} ${v.ad}`}
                  deger={v.tutuldu ? `+${vaatOdul(v)}` : `−${vaatCeza(v)}`}
                  renk={v.tutuldu ? C.arti : C.eksi}
                />
              ))}
            </div>

            <div className="mono mb-5 px-1" style={{ fontSize: 11, color: C.sonuk, lineHeight: 1.6 }}>
              Beş yılda {s.arsiv.length} belge tamamlandı, {s.belgeler.length} belge yürürlükte kaldı.
              Koalisyon {Math.round(s.koalisyon)} sandalyeyle kapandı.
            </div>

            <button onClick={onYeniden} className="btn-ana w-full py-3.5 rounded-lg inline-flex items-center justify-center gap-2">
              <RotateCcw size={15} /> Yeniden oyna
            </button>
          </div>
        )}
      </div>
    </Kabuk>
  );
}

// ---------- MECLİS OYLAMASI ----------

// 100 sandalyeyi yarım daire şeklinde dizer (gerçek meclis oturma düzeni).
const MECLIS_DUZENI = (() => {
  const siralar = [
    { n: 15, r: 52 },
    { n: 17, r: 72 },
    { n: 20, r: 92 },
    { n: 23, r: 112 },
    { n: 26, r: 132 },
  ];
  const cx = 155, cy = 152;
  const koltuklar = [];
  siralar.forEach(({ n, r }) => {
    for (let i = 0; i < n; i++) {
      const aci = (180 - ((i + 0.5) * 180) / n) * (Math.PI / 180);
      koltuklar.push({ x: cx + r * Math.cos(aci), y: cy - r * Math.sin(aci) });
    }
  });
  // soldan sağa sırala ki sayım düzenli aksın
  return koltuklar.sort((a, b) => a.x - b.x);
})();

// i. koltuk kabul oyu mu veriyor? Kabuller sandalyelere eşit dağıtılır,
// böylece sayım boyunca iki sayaç birlikte yükselir ve sonuç sona kadar merakta kalır.
function kabulMu(i, kabulSayisi) {
  return (
    Math.floor(((i + 1) * kabulSayisi) / TOPLAM_SANDALYE) >
    Math.floor((i * kabulSayisi) / TOPLAM_SANDALYE)
  );
}

// Muhalefetin oyunda tam bir kez sahneye çıktığı an. Oyuncunun kendi seçtiği
// bir eylem değil — panel akışının dışından, kağıt katmanının aynı görsel
// dilini kullanarak araya giren zorunlu bir sahne.
function MuhalefetHamlesi({ eylem, s, sonuc, onSecenekSec, onDevam }) {
  if (sonuc) {
    const { kazanan } = sonuc;
    return (
      <Kabuk>
        <div className="max-w-md mx-auto px-4 pt-8 pb-10">
          <div className="kagit p-6 mb-4 relative overflow-hidden">
            <div
              className="damga sans font-extrabold absolute"
              style={{
                color: C.damga,
                border: `3px solid ${C.damga}`,
                top: 18, right: 14, padding: "3px 10px", borderRadius: 6,
                fontSize: 15, letterSpacing: "0.06em",
              }}
            >
              MUHALEFET
            </div>

            <div className="mono mb-3" style={{ fontSize: 9, color: C.damga, letterSpacing: "0.15em" }}>
              MUHALEFET HAMLESİ · TUR {s.tur}
            </div>
            <h2 className="mono font-bold mb-4" style={{ fontSize: 17, color: C.murekkep }}>
              {eylem.ad}
            </h2>

            <div className="mono mb-2" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.12em" }}>
              SONUÇ
            </div>
            <p className="mono mb-4" style={{ fontSize: 13, color: C.murekkep, lineHeight: 1.65 }}>
              {kazanan.metin}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(kazanan.etki).map(([k, v]) => (
                <span
                  key={k}
                  className="mono px-2 py-1 rounded"
                  style={{
                    fontSize: 10,
                    background: etkiIyiMi(k, v) ? "rgba(45,110,70,0.14)" : "rgba(155,47,42,0.12)",
                    color: etkiIyiMi(k, v) ? "#2D6E46" : C.damga,
                  }}
                >
                  {etkiMetni(k, v)}
                </span>
              ))}
            </div>
          </div>

          <button onClick={onDevam} className="btn-ana w-full py-3.5 rounded-lg">
            Panele dön
          </button>
        </div>
      </Kabuk>
    );
  }

  return (
    <Kabuk>
      <div className="max-w-md mx-auto px-4 pt-6 pb-10">
        <div className="kutu p-3 mb-4" style={{ background: "rgba(229,85,90,.08)", borderColor: "rgba(229,85,90,.35)" }}>
          <div className="mono flex items-center gap-1.5" style={{ fontSize: 9, color: C.eksi, letterSpacing: "0.14em" }}>
            <AlertTriangle size={12} /> MUHALEFET HAMLESİ
          </div>
        </div>

        <div className="kagit p-6 mb-4">
          <div className="mono mb-3" style={{ fontSize: 9, color: C.damga, letterSpacing: "0.15em" }}>
            TUR {s.tur} · MUHALEFET İNİSİYATİFİ
          </div>
          <h2 className="mono font-bold mb-3" style={{ fontSize: 18, color: C.murekkep, lineHeight: 1.3 }}>
            {eylem.ad}
          </h2>
          <p className="mono mb-4" style={{ fontSize: 13, color: "#3A3527", lineHeight: 1.65 }}>
            {eylem.metin}
          </p>

          {/* Karşındakinin bir adı var: hamleyi kimin yaptığı belli olsun. */}
          <div
            className="mono mb-5 pl-3"
            style={{ fontSize: 11.5, color: "#6B6250", lineHeight: 1.6, borderLeft: `2px solid ${C.damga}` }}
          >
            {MUHALEFET_LIDERI.unvan} <strong style={{ color: C.murekkep }}>{MUHALEFET_LIDERI.ad}</strong>.{" "}
            {MUHALEFET_LIDERI.arkaPlan}
          </div>

          <div className="mono mb-3" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.12em" }}>
            NASIL KARŞILIK VERİYORSUN?
          </div>

          <div className="flex flex-col gap-3">
            {eylem.secenekler.map((sec, i) => {
              const h = sonucHesapla(sec, s);
              return (
                <button
                  key={i}
                  onClick={() => onSecenekSec(i)}
                  className="rounded-lg overflow-hidden text-left p-3"
                  style={{ border: `1px solid #C9BE9E` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mono font-semibold" style={{ fontSize: 13, color: C.murekkep }}>
                      {sec.ad}
                    </span>
                    {sec.riskli && (
                      <span
                        className="mono px-1.5 py-0.5 rounded"
                        style={{ fontSize: 9, color: C.eksi, border: `1px solid ${C.eksi}` }}
                      >
                        RİSKLİ
                      </span>
                    )}
                  </div>
                  {sec.sonuclar.map((so, j) => {
                    const kazanir = h.kazananIdx === j;
                    return (
                      <div key={j} className="flex gap-2.5 mb-1.5">
                        <span
                          className="mono font-bold px-1.5 py-0.5 rounded self-start"
                          style={{
                            fontSize: 11, minWidth: 40, textAlign: "center",
                            color: kazanir ? "#FFF" : "#6B6250",
                            background: kazanir ? C.damga : "rgba(0,0,0,0.06)",
                          }}
                        >
                          %{h.yuzdeler[j]}
                        </span>
                        <span className="mono flex-1" style={{ fontSize: 11.5, color: kazanir ? C.murekkep : "#7A7260", lineHeight: 1.5 }}>
                          {so.metin}
                        </span>
                      </div>
                    );
                  })}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Kabuk>
  );
}

function MeclisOylamasi({ eylem, oylama, onDevam }) {
  const kabulHedef = Math.max(0, Math.min(TOPLAM_SANDALYE, Math.round(oylama.toplam)));
  const gereken = oylama.gereken ?? BARAJ;
  const [sayilan, setSayilan] = useState(0);
  const [asama, setAsama] = useState("giris"); // giris → sayim → sonuc

  const azHareket =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (azHareket) {
      setSayilan(TOPLAM_SANDALYE);
      setAsama("sonuc");
      return;
    }
    const t = setTimeout(() => setAsama("sayim"), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (asama !== "sayim") return;
    const sure = 6000;
    const basla = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - basla) / sure);
      setSayilan(Math.round(TOPLAM_SANDALYE * (1 - Math.pow(1 - t, 1.6))));
      if (t >= 1) {
        clearInterval(id);
        setTimeout(() => setAsama("sonuc"), 500);
      }
    }, 40);
    return () => clearInterval(id);
  }, [asama]);

  let kabul = 0;
  for (let i = 0; i < sayilan; i++) if (kabulMu(i, kabulHedef)) kabul++;
  const ret = sayilan - kabul;
  const gecerDurumda = kabul >= gereken;

  if (asama === "giris") {
    return (
      <Kabuk>
        <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center px-6">
          <Landmark size={38} style={{ color: C.pirinc }} className="mb-5 nabiz" />
          <div className="mono mb-2 text-center" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
            GENEL KURUL
          </div>
          <h1 className="sans font-extrabold text-center mb-3" style={{ fontSize: 24, color: "#F2F4F8", lineHeight: 1.25 }}>
            {eylem.ad}
          </h1>
          <p className="sans text-center" style={{ fontSize: 13, color: C.solgun, lineHeight: 1.6, maxWidth: 280 }}>
            Tasarı kürsüye getirildi. Oylama başlıyor…
          </p>
        </div>
      </Kabuk>
    );
  }

  return (
    <Kabuk>
      <div className="max-w-md mx-auto px-5 pt-10 pb-10">
        <div className="mono mb-2" style={{ fontSize: 10, color: C.pirinc, letterSpacing: "0.2em" }}>
          {asama === "sayim" ? "OYLAR KULLANILIYOR" : "OYLAMA SONUCU"}
        </div>
        <h1 className="sans font-bold mb-5" style={{ fontSize: 19, color: "#F2F4F8", lineHeight: 1.3 }}>
          {eylem.ad}
        </h1>

        {/* Meclis salonu */}
        <div className="kutu p-4 mb-3">
          <svg viewBox="0 0 310 165" className="w-full" style={{ display: "block" }}>
            {MECLIS_DUZENI.map((k, i) => {
              const dolu = i < sayilan;
              const evet = kabulMu(i, kabulHedef);
              return (
                <circle
                  key={i}
                  cx={k.x}
                  cy={k.y}
                  r={4.2}
                  fill={dolu ? (evet ? C.arti : C.eksi) : "#1E2739"}
                  opacity={dolu ? 1 : 0.75}
                />
              );
            })}
            {/* kürsü */}
            <rect x={143} y={144} width={24} height={7} rx={2} fill={C.pirinc} opacity={0.85} />
          </svg>
        </div>

        {/* Sayaçlar */}
        <div className="kutu p-5 mb-3">
          <div className="flex items-stretch justify-between mb-4">
            <div style={{ flex: 1 }}>
              <div className="mono mb-1" style={{ fontSize: 9, color: C.arti, letterSpacing: "0.12em" }}>
                KABUL
              </div>
              <div className="sans font-extrabold tabular-nums" style={{ fontSize: 38, color: C.arti, lineHeight: 1 }}>
                {kabul}
              </div>
            </div>
            <div className="w-px mx-3" style={{ background: C.kenar }} />
            <div style={{ flex: 1, textAlign: "right" }}>
              <div className="mono mb-1" style={{ fontSize: 9, color: C.eksi, letterSpacing: "0.12em" }}>
                RET
              </div>
              <div className="sans font-extrabold tabular-nums" style={{ fontSize: 38, color: C.eksi, lineHeight: 1 }}>
                {ret}
              </div>
            </div>
          </div>

          <div className="h-2.5 rounded-full overflow-hidden relative flex" style={{ background: "#1C2436" }}>
            <div style={{ width: `${(kabul / TOPLAM_SANDALYE) * 100}%`, background: C.arti }} />
            <div style={{ width: `${(ret / TOPLAM_SANDALYE) * 100}%`, background: C.eksi }} />
            <div className="absolute top-0 bottom-0" style={{ left: `${(gereken / TOPLAM_SANDALYE) * 100}%`, width: 2, background: "#F2F4F8", opacity: 0.8 }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="mono" style={{ fontSize: 9, color: C.sonuk }}>
              {sayilan}/{TOPLAM_SANDALYE} oy kullanıldı
            </span>
            <span className="mono" style={{ fontSize: 9, color: gecerDurumda ? C.arti : C.sonuk }}>
              ▲ geçmek için {gereken}
            </span>
          </div>
        </div>

        {asama === "sonuc" && (
          <div className="acilir">
            <div
              className="kutu p-5 mb-3 text-center"
              style={{ borderColor: oylama.gecti ? C.arti : C.eksi }}
            >
              <div className="sans font-extrabold" style={{ fontSize: 24, color: oylama.gecti ? C.arti : C.eksi }}>
                {oylama.gecti ? "Tasarı kabul edildi" : "Tasarı reddedildi"}
              </div>
              <div className="mono mt-2" style={{ fontSize: 11, color: C.solgun, lineHeight: 1.5 }}>
                {oylama.gecti
                  ? "Kanunlaşma süreci başladı, iki tur sonra yürürlüğe girecek."
                  : "Tasarı Meclis'ten döndü. Hiçbir etkisi olmayacak."}
              </div>
            </div>

            <div className="kutu p-4 mb-4">
              <div className="mono mb-3" style={{ fontSize: 10, color: C.solgun, letterSpacing: "0.1em" }}>
                OY HESABI
              </div>
              <Satir ad="Koalisyon sandalyesi" deger={Math.round(oylama.temel)} />
              <Satir
                ad="Parti sadakati"
                deger={oylama.sadakatBonus >= 0 ? `+${oylama.sadakatBonus}` : oylama.sadakatBonus}
                renk={oylama.sadakatBonus >= 0 ? C.arti : C.eksi}
              />
              <Satir
                ad="Halk desteği"
                deger={oylama.onayBonus >= 0 ? `+${oylama.onayBonus}` : oylama.onayBonus}
                renk={oylama.onayBonus >= 0 ? C.arti : C.eksi}
              />
              <div className="border-t my-2" style={{ borderColor: C.kenar }} />
              <Satir ad="Toplam kabul oyu" deger={oylama.toplam} />
            </div>

            <button onClick={onDevam} className="btn-ana w-full py-3.5 rounded-lg">
              Belgeyi gör
            </button>
          </div>
        )}
      </div>
    </Kabuk>
  );
}

// ---------- GAZETE (TUR RAPORU) ----------

// Resmî Gazete'de her belgenin bir numarası olur. Ada göre sabit üretilir.
function belgeNumarasi(ad, tur) {
  let h = 0;
  for (let i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) % 997;
  return tur === "KANUN" ? 7100 + (h % 900) : 40 + (h % 160);
}

// Resmî dilde belge başlığı.
function resmiBaslik(ad, tur) {
  return tur === "KANUN" ? `${ad} Hakkında Kanun` : `${ad} Kararnamesi`;
}

// Gazetenin karşılığı: halkın okumadığı dosya. Gazete o yarıyılda ülkenin
// neyi bildiğini yazar, bu ekran ne olduğunu. İkisinin arasındaki fark,
// gizli iş yapan bir yönetimin asıl bedelidir — şüphe göstergesi o farkı sayar.
function GizliDosya({ haberler, onDevam }) {
  return (
    <Kabuk>
      <div className="max-w-md mx-auto px-4 pt-8 pb-10">
        <div className="kagit p-6 mb-4 relative overflow-hidden">
          <div
            className="damga sans font-extrabold absolute"
            style={{
              color: C.damga,
              border: `3px solid ${C.damga}`,
              top: 18, right: 14, padding: "3px 10px", borderRadius: 6,
              fontSize: 15, letterSpacing: "0.06em",
            }}
          >
            GİZLİ
          </div>

          <div className="mono mb-1" style={{ fontSize: 9, color: C.damga, letterSpacing: "0.15em" }}>
            CUMHURBAŞKANLIĞI · TASNİF DIŞI
          </div>
          <h2 className="mono font-bold mb-1" style={{ fontSize: 17, color: C.murekkep }}>
            Kapalı Dosya
          </h2>
          <p className="mono mb-5" style={{ fontSize: 11, color: "#6B6250", lineHeight: 1.6 }}>
            Bu sayfadakiler basına yansımadı. Kayıt yalnızca senin masanda tutuluyor.
          </p>

          {haberler.map((h, i) => (
            <div
              key={i}
              className="mb-4 pb-4"
              style={{ borderBottom: i < haberler.length - 1 ? "1px dashed #C9BE9E" : "none" }}
            >
              <div className="mono mb-1.5" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.12em" }}>
                {h.belgeTuru === "GİZLİ" ? "KAYIT" : h.belgeTuru} · {h.ad.toUpperCase()}
              </div>
              <p className="mono mb-2" style={{ fontSize: 13, color: C.murekkep, lineHeight: 1.65 }}>
                {h.metin}
              </p>
              {h.alinti && (
                <p
                  className="mono mb-2 pl-3"
                  style={{ fontSize: 11.5, color: "#6B6250", lineHeight: 1.6, borderLeft: `2px solid ${C.damga}`, fontStyle: "italic" }}
                >
                  {h.alinti}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {Object.entries(h.etki || {}).map(([k, v]) => (
                  <span
                    key={k}
                    className="mono px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: 9.5,
                      background: etkiIyiMi(k, v) ? "rgba(45,110,70,.13)" : "rgba(155,47,42,.11)",
                      color: etkiIyiMi(k, v) ? "#2D6E46" : C.damga,
                    }}
                  >
                    {etkiMetni(k, v)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onDevam} className="btn-ana w-full py-3.5 rounded-lg">
          Dosyayı kapat
        </button>
      </div>
    </Kabuk>
  );
}

function Gazete({ rapor, sonrakiTur, onDevam }) {
  const manset = mansetSec(rapor);
  const net = rapor.gelir - rapor.gider;

  // Manşete çıkan haber aşağıda tekrarlanmaz. Gizli işler hiç girmez: gazete
  // yalnızca halkın bildiğini yazar, kalanı Gizli Dosya'da durur.
  const digerHaberler = rapor.haberler.filter((h) => h !== manset.kullanilan && !h.gizli);
  // Resmî Gazete yalnızca yayımlanan belgeleri listeler; operasyonlar girmez.
  // Gizli bir kararname burada kalır — belge resmen yayımlanmıştır, gizlenen
  // yalnızca ne işe yaradığıdır.
  const resmiKayitlar = rapor.haberler.filter(
    (h) => h.belgeTuru === "KANUN" || h.belgeTuru === "KARARNAME"
  );

  const EtkiRozet = ({ etki }) => (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(etki || {}).map(([k, v]) => (
        <span
          key={k}
          className="mono px-1.5 py-0.5 rounded"
          style={{
            fontSize: 9.5,
            background: etkiIyiMi(k, v) ? "rgba(45,110,70,.13)" : "rgba(155,47,42,.11)",
            color: etkiIyiMi(k, v) ? "#2D6E46" : C.damga,
          }}
        >
          {etkiMetni(k, v)}
        </span>
      ))}
    </div>
  );

  return (
    <Kabuk>
      <div className="max-w-md mx-auto px-3 pt-6 pb-10">
        <div className="kagit p-5">
          {/* Künye */}
          <div className="text-center pb-3" style={{ borderBottom: `3px double ${C.murekkep}` }}>
            <div className="mono" style={{ fontSize: 8.5, color: "#6B6250", letterSpacing: "0.28em" }}>
              BAĞIMSIZ · GÜNLÜK
            </div>
            <h1
              className="gazete-ad"
              style={{ fontSize: 33, color: C.murekkep, lineHeight: 1.05, margin: "3px 0 5px" }}
            >
              Başkent Günlüğü
            </h1>
            <div className="mono" style={{ fontSize: 9, color: "#6B6250", letterSpacing: "0.1em" }}>
              {takvim(rapor.tur).kapanis.toUpperCase()} · SAYI {rapor.tur}
            </div>
            <div className="mono" style={{ fontSize: 8.5, color: "#8A8069", letterSpacing: "0.14em", marginTop: 2 }}>
              {takvim(rapor.tur).donem.toUpperCase()} SONA ERDİ
            </div>
          </div>

          {/* Manşet */}
          <div className="py-4" style={{ borderBottom: `1px solid #C3B99A` }}>
            {manset.agir && (
              <div
                className="mono inline-block px-1.5 py-0.5 rounded mb-2"
                style={{ fontSize: 8.5, color: "#FFF", background: C.damga, letterSpacing: "0.12em" }}
              >
                SON DAKİKA
              </div>
            )}
            <h2
              className="gazete-manset"
              style={{ fontSize: manset.agir ? 25 : 22, color: C.murekkep, lineHeight: 1.15, marginBottom: 7 }}
            >
              {manset.baslik}
            </h2>
            <p className="mono" style={{ fontSize: 12, color: "#3A3527", lineHeight: 1.6 }}>
              {manset.spot}
            </p>
            {manset.alinti && (
              <p
                className="mono"
                style={{
                  fontSize: 11.5,
                  color: "#2E2A20",
                  lineHeight: 1.6,
                  marginTop: 8,
                  paddingLeft: 10,
                  borderLeft: `2px solid ${C.damga}`,
                  fontStyle: "italic",
                }}
              >
                {manset.alinti}
              </p>
            )}
          </div>

          {/* İç haberler */}
          {digerHaberler.length > 0 && (
            <div className="py-4" style={{ borderBottom: `1px solid #C3B99A` }}>
              <div className="mono mb-3" style={{ fontSize: 8.5, color: "#6B6250", letterSpacing: "0.18em" }}>
                GÜNÜN DİĞER HABERLERİ
              </div>
              {digerHaberler.map((h, i) => (
                <div key={i} style={{ marginBottom: i < digerHaberler.length - 1 ? 14 : 0 }}>
                  <div className="gazete-alt" style={{ fontSize: 14.5, color: C.murekkep, lineHeight: 1.25, marginBottom: 3 }}>
                    {h.ad}
                  </div>
                  <p className="mono" style={{ fontSize: 11.5, color: "#4A4536", lineHeight: 1.55 }}>
                    {h.metin}
                  </p>
                  {h.alinti && (
                    <p
                      className="mono"
                      style={{
                        fontSize: 11.5,
                        color: "#2E2A20",
                        lineHeight: 1.6,
                        marginTop: 7,
                        paddingLeft: 9,
                        borderLeft: `2px solid ${C.damga}`,
                        fontStyle: "italic",
                      }}
                    >
                      {h.alinti}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resmî kayıt — gazetecilik değil, mevzuat dili */}
          {resmiKayitlar.length > 0 && (
            <div className="py-4" style={{ borderBottom: `1px solid #C3B99A` }}>
              <div className="flex items-baseline justify-between mb-3">
                <span className="mono" style={{ fontSize: 8.5, color: "#6B6250", letterSpacing: "0.18em" }}>
                  RESMÎ GAZETE'DEN
                </span>
                <span className="mono" style={{ fontSize: 8.5, color: "#8A8069" }}>
                  SAYI {32000 + rapor.tur * 137}
                </span>
              </div>

              {resmiKayitlar.map((h, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: i < resmiKayitlar.length - 1 ? 12 : 0,
                    paddingBottom: i < resmiKayitlar.length - 1 ? 12 : 0,
                    borderBottom: i < resmiKayitlar.length - 1 ? "1px dotted #C9BE9E" : "none",
                  }}
                >
                  <div className="mono" style={{ fontSize: 9.5, color: C.damga, letterSpacing: "0.08em", marginBottom: 2 }}>
                    {h.belgeTuru} NO. {belgeNumarasi(h.ad, h.belgeTuru)}
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: C.murekkep, lineHeight: 1.55, marginBottom: 4 }}>
                    {h.belgeTuru === "KANUN"
                      ? `${h.ad} kanun teklifi Meclis'ten ${
                          h.oyGereken && h.oyGereken > BARAJ ? "nitelikli çoğunlukla" : "çoğunlukla"
                        } geçti.`
                      : `${h.ad} kararnamesi Cumhurbaşkanlığınca imzalandı.`}
                    {h.oyToplam ? ` ${h.oyToplam}/${TOPLAM_SANDALYE}` : ""}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "#7A7260", lineHeight: 1.5 }}>
                    Yürürlük tarihi: {takvim(rapor.tur).kapanis}
                    {h.tip === "tamamlanma" && " · uygulama tamamlandı"}
                  </div>
                  <EtkiRozet etki={h.etki} />
                </div>
              ))}
            </div>
          )}

          {/* Bütçe köşesi */}
          <div className="py-4" style={{ borderBottom: `1px solid #C3B99A` }}>
            <div className="mono mb-2.5" style={{ fontSize: 8.5, color: "#6B6250", letterSpacing: "0.18em" }}>
              BÜTÇE KÖŞESİ
            </div>
            <KagitSatir ad="Gelirler" deger={`+$${paraYaz(rapor.gelir)}B`} />
            <KagitSatir ad="Giderler" deger={`−$${paraYaz(rapor.gider)}B`} />
            <div style={{ borderTop: "1px solid #C9BE9E", marginTop: 5, paddingTop: 5 }}>
              <KagitSatir ad="Kasaya kalan" deger={`${net >= 0 ? "+" : "−"}$${paraYaz(Math.abs(net))}B`} kalin />
            </div>
            <div className="mono mt-2" style={{ fontSize: 10, color: "#7A7260", lineHeight: 1.5 }}>
              Sosyal yardım ${paraYaz(rapor.giderKalem.sosyal)}B · güvenlik ${paraYaz(rapor.giderKalem.guvenlik)}B ·
              savunma ${paraYaz(rapor.giderKalem.askeri)}B.
              Siyasi nüfuz {rapor.nufuz} puan tazelendi.
            </div>
          </div>

          {(rapor.yipranma.onay !== 0 || rapor.koalisyonKayma !== 0) && (
            <div className="py-4">
              <div className="mono mb-2" style={{ fontSize: 8.5, color: "#6B6250", letterSpacing: "0.18em" }}>
                GÖZLEMCİ NOTU
              </div>
              <p className="mono mb-2.5" style={{ fontSize: 11.5, color: "#4A4536", lineHeight: 1.6 }}>
                {rapor.yipranma.onay !== 0
                  ? "Hiçbir hükümet yerinde sayarak ayakta kalamaz. Bu yarıyılda halkın sabrı, kamu düzeni ve dış itibar kendiliğinden bir miktar geriledi."
                  : rapor.koalisyonKayma > 0
                  ? "Kulislerde hava hükümetten yana döndü; bağımsız vekiller saf değiştirdi."
                  : "Kulislerde hoşnutsuzluk büyüyor; koalisyondan kopanlar oldu."}
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  ["Halkın desteği", rapor.yipranma.onay],
                  ["Kamu düzeni", rapor.yipranma.istikrar],
                  ["Dış itibar", rapor.yipranma.kuresel],
                ]
                  .filter(([, v]) => v !== 0)
                  .map(([ad, v]) => (
                    <span
                      key={ad}
                      className="mono px-1.5 py-0.5 rounded"
                      style={{ fontSize: 9.5, background: "rgba(155,47,42,.11)", color: C.damga }}
                    >
                      {ad} {v}
                    </span>
                  ))}
                {rapor.koalisyonKayma !== 0 && (
                  <span
                    className="mono px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: 9.5,
                      background: rapor.koalisyonKayma > 0 ? "rgba(45,110,70,.13)" : "rgba(155,47,42,.11)",
                      color: rapor.koalisyonKayma > 0 ? "#2D6E46" : C.damga,
                    }}
                  >
                    Meclis sandalyesi {rapor.koalisyonKayma > 0 ? "+" : ""}{rapor.koalisyonKayma}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={onDevam} className="btn-ana w-full py-3.5 rounded-lg mt-4">
          {takvim(sonrakiTur).donem} {takvim(sonrakiTur).yil}
        </button>
      </div>
    </Kabuk>
  );
}

// ---------- YARDIMCI BİLEŞENLER ----------

function Satir({ ad, deger, renk }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="sans" style={{ fontSize: 12, color: C.solgun }}>{ad}</span>
      <span className="sans font-semibold tabular-nums" style={{ fontSize: 13, color: renk || "#F2F4F8" }}>{deger}</span>
    </div>
  );
}

function KagitSatir({ ad, deger, kalin }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="mono" style={{ fontSize: 11.5, color: "#5C5545" }}>{ad}</span>
      <span className="mono tabular-nums" style={{ fontSize: kalin ? 14 : 12, fontWeight: kalin ? 700 : 500, color: C.murekkep }}>
        {deger}
      </span>
    </div>
  );
}

function Kabuk({ children }) {
  return (
    <div className="min-h-screen w-full" style={{ background: C.zemin }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap');
        .sans { font-family: 'Inter', system-ui, sans-serif; }
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .gazete-ad {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900; letter-spacing: -0.015em;
        }
        .gazete-manset {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 800; letter-spacing: -0.01em;
        }
        .gazete-alt {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 700;
        }

        .kutu {
          background: ${C.panel};
          border: 1px solid ${C.kenar};
          border-radius: 12px;
          transition: border-color .15s ease, transform .1s ease;
        }
        button.kutu:active { transform: scale(.99); }

        .kagit {
          background-color: ${C.kagit};
          background-image: repeating-linear-gradient(
            135deg, rgba(31,27,20,.028) 0 1px, transparent 1px 9px
          );
          border-radius: 4px;
          box-shadow: 0 18px 40px rgba(0,0,0,.5);
        }

        .btn-ana {
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          background: ${C.pirinc}; color: #14100A;
          transition: opacity .15s ease, transform .1s ease;
        }
        .btn-ana:active { transform: scale(.985); }
        .btn-ana:disabled { opacity: .32; }

        .btn-ikincil {
          font-family: 'Inter', sans-serif; font-weight: 500; font-size: 13px;
          background: transparent; border: 1px solid ${C.kenar}; color: #F2F4F8;
          transition: background .15s ease;
        }
        .btn-ikincil:active { background: ${C.panel}; }

        .menu-btn {
          width: 36px; height: 36px; border-radius: 9px;
          border: 1px solid ${C.kenar}; color: ${C.solgun};
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s ease, color .15s ease;
        }
        .menu-btn:hover { border-color: ${C.pirinc}; color: ${C.pirinc}; }
        .menu-btn:active { transform: scale(.96); }

        .kol-btn {
          width: 26px; height: 26px; border-radius: 6px;
          border: 1px solid ${C.kenar}; color: ${C.solgun};
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s ease, color .15s ease;
        }
        .kol-btn:hover:not(:disabled) { border-color: ${C.pirinc}; color: ${C.pirinc}; }
        .kol-btn:disabled { opacity: .28; }

        button:focus-visible, .kutu:focus-visible {
          outline: 2px solid ${C.pirinc}; outline-offset: 2px;
        }

        .damga { opacity: .92; transform: rotate(-9deg); }
        @media (prefers-reduced-motion: no-preference) {
          .damga { animation: damgaVur .45s cubic-bezier(.34,1.56,.64,1) both; }
          .modal-gir { animation: modalGir .28s cubic-bezier(.2,.9,.3,1) both; }
          .acilir { animation: acil .5s ease both; }
          .nabiz { animation: nabizAt 1.6s ease-in-out infinite; }
          .cizgi { transition: width .5s ease, background-color .3s ease; }
        }
        @keyframes damgaVur {
          0%   { opacity: 0; transform: scale(2.6) rotate(-22deg); }
          65%  { opacity: .92; }
          100% { opacity: .92; transform: scale(1) rotate(-9deg); }
        }
        @keyframes modalGir {
          0%   { opacity: 0; transform: translateY(28px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes acil {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes nabizAt {
          0%,100% { opacity: .55; transform: scale(1); }
          50%     { opacity: 1;   transform: scale(1.08); }
        }

        .sekme {
          font-family: 'Inter', sans-serif;
          border: 1px solid ${C.kenar};
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }
        .sekme:active { transform: scale(.99); }

        .btn-tehlike {
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          background: ${C.eksi}; color: #14100A;
          transition: opacity .15s ease, transform .1s ease;
        }
        .btn-tehlike:active { transform: scale(.985); }
      `}</style>
      {children}
    </div>
  );
}
