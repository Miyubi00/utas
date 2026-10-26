import { Entry, ThreadPost } from '../types';

export const INITIAL_ENTRIES: Entry[] = [
  {
    id: 'entry-1',
    title: 'Secangkir Kopi dan Rinai Hujan di Tepi Jendela',
    slug: 'secangkir-kopi-dan-rinai-hujan',
    mood: 'Tenang',
    tags: ['Hujan', 'Buku & Kopi', 'Renungan'],
    cover_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    is_pinned: true,
    status: 'published',
    entry_date: '2026-10-24',
    content: `Sore tadi, langit kota meredup lebih lekas dari biasanya. Awan kelabu berarak pelan, mengantar tetes-tetes air pertama yang bergeming menyentuh kaca jendela kamar. 

Ada kehangatan yang sulit digambarkan saat aroma tanah basah—*petrichor*—menyelinap lewat celah ventilasi, berbaur dengan uap kopi tubruk yang baru saja kuseduh tanpa gula.

> "Waktu berjalan sekehendak hatinya, namun secangkir kopi hangat selalu tahu bagaimana cara mengajak kita memperlambat degup."

Di meja kayu jati yang sudah menua ini, aku membiarkan jemariku membuka kembali halaman-halaman buku tua yang kertasnya mulai menguning. Setiap coretan pensil di tepian halaman terasa seperti surat kabar dari masa lalu, mengingatkanku bahwa lelah dan ragu adalah bagian tak terpisahkan dari menjadi manusia.

Beberapa hal yang kusyukuri petang ini:
* Suara gemerisik dedaunan basah di pekarangan
* Keheningan yang tak lagi terasa menakutkan
* Kesempatan untuk duduk diam dan bernapas panjang

Malam nanti mungkin udara akan semakin dingin. Namun untuk saat ini, sudut ruangan ini sudah cukup menjadi suaka bagi benak yang ingin jeda sejenak dari hiruk-pikuk dunia.`,
    created_at: '2026-10-24T17:30:00Z',
    updated_at: '2026-10-24T17:30:00Z',
  },
  {
    id: 'entry-2',
    title: 'Aroma Kertas Usang dan Toko Buku Tua di Ujung Gang',
    slug: 'aroma-kertas-usang-toko-buku-tua',
    mood: 'Nostalgia',
    tags: ['Buku & Kopi', 'Kilas Balik', 'Keseharian'],
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
    is_pinned: true,
    status: 'published',
    entry_date: '2026-10-18',
    content: `Langkah kakiku membawaku kembali ke toko buku bekas di ujung gang Pasar Senen. Tempat ini nyaris tidak berubah selama sepuluh tahun terakhir: tumpukan buku sastra klasik yang menjulang hampir menyentuh langit-langit, kipas angin dinding yang berderit teratur, dan aroma khas selulosa tua yang menenangkan.

Penjualnya, seorang kakek berkacamata tebal, tersenyum samar saat melihatku memilih sebundel kumpulan puisi terbitan tahun 80-an.

> "Buku-buku ini tidak pernah kesepian," katanya lirih, "mereka hanya sabar menunggu pembaca yang tepat untuk singgah."

Kata-kata itu terngiang sepanjang perjalanan pulang. Berapa banyak dari kita yang sedang menunggu waktu yang tepat, belajar bersabar dalam penantian, sembari mematangkan apa yang sedang kita rawat di dalam dada?`,
    created_at: '2026-10-18T16:15:00Z',
    updated_at: '2026-10-18T16:15:00Z',
  },
  {
    id: 'entry-3',
    title: 'Tentang Langkah Kaki yang Pelan dan Menikmati Petang',
    slug: 'langkah-kaki-yang-pelan',
    mood: 'Reflektif',
    tags: ['Renungan', 'Perjalanan'],
    cover_url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=80',
    is_pinned: false,
    status: 'published',
    entry_date: '2026-10-12',
    content: `Kita terbiasa hidup dalam perlombaan yang tak pernah jelas garis akhirnya. Siapa yang paling lekas tiba, siapa yang paling padat agendanya, siapa yang paling bising prestasinya.

Namun petang tadi, saat berjalan kaki menyusuri trotoar berhias guguran bunga angsana, aku memilih mematikan notifikasi ponsel. Aku memperhatikan bagaimana matahari terbenam membiaskan semburat jingga dan tembaga di kaki cakrawala.

Ternyata tidak ada yang tertinggal saat kita melangkah pelan. Yang ada justru kita mulai bisa melihat bunga-bunga kecil yang mekar di sela trotoar, senyum ramah penjaja penganan sore, dan rasa syukur yang sederhana: kita masih ada di sini, utuh.`,
    created_at: '2026-10-12T18:00:00Z',
    updated_at: '2026-10-12T18:00:00Z',
  },
  {
    id: 'entry-4',
    title: 'Catatan Singkat Menjelang Tengah Malam',
    slug: 'catatan-singkat-menjelang-tengah-malam',
    mood: 'Damai',
    tags: ['Malam', 'Keseharian'],
    cover_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    is_pinned: false,
    status: 'published',
    entry_date: '2026-10-05',
    content: `Jam dinding menunjukkan pukul sebelas lewat seperempat. Rumah sudah sunyi. Suara jangkrik di halaman belakang terdengar bersahut-sahutan mengiringi desau angin malam.

Kututup jurnal ini dengan satu doa kecil: semoga esok kita diberi lapang dada untuk menerima hal-hal yang di luar kendali kita, dan cukup keteguhan untuk merawat kebaikan yang ada di genggaman kita.`,
    created_at: '2026-10-05T23:15:00Z',
    updated_at: '2026-10-05T23:15:00Z',
  },
];

export const INITIAL_THREADS: ThreadPost[] = [
  {
    id: 'thread-1',
    parent_id: null,
    content: 'Ada ketenangan aneh saat lampu-lampu jalan mulai menyala satu per satu di senja hari. Seakan kota sedang berbisik bahwa hari telah selesai, dan kita berhak meletakkan beban sejenak.',
    images: [],
    status: 'published',
    is_pinned: true,
    created_at: '2026-10-25T17:45:00Z',
    replies: [
      {
        id: 'thread-1-1',
        parent_id: 'thread-1',
        content: 'Bahkan suara deru kendaraan di kejauhan kini terdengar seperti dengung ritmis yang menemani jeda.',
        images: [],
        status: 'published',
        is_pinned: false,
        created_at: '2026-10-25T17:52:00Z',
      },
      {
        id: 'thread-1-2',
        parent_id: 'thread-1',
        content: 'Semoga malam ini membawa lelap yang pulas untuk siapa pun yang seharian memikul lelah sendirian di balik senyumnya.',
        images: [],
        status: 'published',
        is_pinned: false,
        created_at: '2026-10-25T18:05:00Z',
      },
    ],
  },
  {
    id: 'thread-2',
    parent_id: null,
    content: 'Kadang yang kita butuhkan bukanlah jawaban atas segala kegelisahan, melainkan secangkir teh melati hangat dan kesediaan untuk mendengarkan isi hati kita sendiri tanpa menghakimi.',
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'],
    status: 'published',
    is_pinned: false,
    created_at: '2026-10-23T16:20:00Z',
    replies: [
      {
        id: 'thread-2-1',
        parent_id: 'thread-2',
        content: 'Benar. Terlalu banyak kebisingan di luar sana yang kerap membuat kita lupa cara bernapas lega dan merasa cukup.',
        images: [],
        status: 'published',
        is_pinned: false,
        created_at: '2026-10-23T16:32:00Z',
      },
    ],
  },
  {
    id: 'thread-3',
    parent_id: null,
    content: 'Menulis jurnal bukan tentang menyusun kata-kata puitis untuk dibaca orang lain, melainkan keberanian berbicara jujur kepada diri sendiri di atas selembar kertas bisu.',
    images: [],
    status: 'published',
    is_pinned: false,
    created_at: '2026-10-20T21:10:00Z',
    replies: [],
  },
];
