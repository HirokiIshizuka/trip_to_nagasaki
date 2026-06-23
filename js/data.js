// 長崎・雲仙 旅行ルートシミュレーター
// スポットデータ（座標は概算。実際の出発前にナビでご確認ください）
//
// category: food（グルメ）, history（歴史・文化）, nature（自然・絶景）, onsen（温泉）, hotel（宿）
// duration: 目安の滞在時間（分）

const HOTEL_ID = "kai-unzen";

const POIS = [
  // ===== 交通拠点 =====
  {
    id: "nagasaki-airport",
    name: "長崎空港",
    category: "transit",
    area: "大村市",
    lat: 32.9168, lng: 129.9142,
    duration: 30,
    desc: "大村湾に浮かぶ海上空港。到着後はレンタカー受け取りなど。長崎市内まで車で約50分（長崎自動車道経由）。この30分は荷物受け取り＋レンタカー手続きの目安です。",
    tags: ["出発地", "レンタカー", "空港"]
  },

  // ===== 宿（拠点）=====
  {
    id: "kai-unzen",
    name: "星野リゾート 界 雲仙",
    category: "hotel",
    area: "雲仙",
    lat: 32.7339, lng: 130.2622,
    duration: 0,
    desc: "今回の拠点。雲仙温泉街の中にある温泉旅館。チェックインは通常15:00、チェックアウトは12:00。1日目はここを目指し、2日目はここから出発する想定です。",
    tags: ["拠点", "温泉旅館"]
  },

  // ===== 長崎市内 =====
  {
    id: "glover",
    name: "グラバー園",
    category: "history",
    area: "長崎市",
    lat: 32.7341, lng: 129.8707,
    duration: 90,
    desc: "幕末〜明治の洋館が並ぶ国指定重要文化財。長崎港を見下ろす丘の上で眺めも良い。大浦天主堂とセットで回るのが定番。",
    tags: ["世界遺産関連", "洋館", "絶景"]
  },
  {
    id: "oura",
    name: "大浦天主堂",
    category: "history",
    area: "長崎市",
    lat: 32.7345, lng: 129.8703,
    duration: 40,
    desc: "現存する日本最古の木造ゴシック様式教会で国宝。世界文化遺産「長崎と天草地方の潜伏キリシタン関連遺産」の構成資産。",
    tags: ["国宝", "世界遺産"]
  },
  {
    id: "peace-park",
    name: "平和公園",
    category: "history",
    area: "長崎市",
    lat: 32.7736, lng: 129.8632,
    duration: 40,
    desc: "平和祈念像で知られる公園。原爆資料館・爆心地公園と徒歩圏内でまとめて巡れる。",
    tags: ["平和学習"]
  },
  {
    id: "atomic-museum",
    name: "長崎原爆資料館",
    category: "history",
    area: "長崎市",
    lat: 32.7727, lng: 129.8636,
    duration: 60,
    desc: "被爆の実相を伝える資料館。平和公園のすぐ近く。じっくり見学したい場所。",
    tags: ["平和学習", "資料館"]
  },
  {
    id: "dejima",
    name: "出島",
    category: "history",
    area: "長崎市",
    lat: 32.7438, lng: 129.8736,
    duration: 60,
    desc: "江戸時代の対外貿易の窓口だった人工島を復元。当時の建物や暮らしを再現展示。",
    tags: ["復元史跡"]
  },
  {
    id: "meganebashi",
    name: "眼鏡橋",
    category: "history",
    area: "長崎市",
    lat: 32.7459, lng: 129.8806,
    duration: 30,
    desc: "日本最古級の石造アーチ橋。水面に映る姿が眼鏡に見える。川沿いの散策が気持ちよい。",
    tags: ["フォトスポット", "散策"]
  },
  {
    id: "inasayama",
    name: "稲佐山展望台",
    category: "nature",
    area: "長崎市",
    lat: 32.7616, lng: 129.8520,
    duration: 60,
    desc: "「世界新三大夜景」とも称される長崎の夜景スポット。日没後がおすすめ。車かロープウェイで上れる。",
    tags: ["夜景", "絶景"]
  },
  {
    id: "chinatown",
    name: "長崎新地中華街",
    category: "food",
    area: "長崎市",
    lat: 32.7406, lng: 129.8740,
    duration: 60,
    desc: "ちゃんぽん・皿うどんの名店が集まる中華街。昼食に最適。角煮まんの食べ歩きも。",
    tags: ["ちゃんぽん", "皿うどん", "昼食"]
  },
  {
    id: "shikairo",
    name: "四海樓",
    category: "food",
    area: "長崎市",
    lat: 32.7345, lng: 129.8690,
    duration: 70,
    desc: "ちゃんぽん発祥の店として知られる老舗。グラバー園・大浦天主堂のすぐ近くで、観光と合わせやすい。",
    tags: ["ちゃんぽん発祥", "昼食"]
  },
  {
    id: "tsuruchan",
    name: "ツル茶ん",
    category: "food",
    area: "長崎市",
    lat: 32.7411, lng: 129.8786,
    duration: 60,
    desc: "九州最古の喫茶店。名物トルコライスと、ふわふわの長崎風ミルクセーキが有名。",
    tags: ["トルコライス", "ミルクセーキ", "カフェ"]
  },
  // ===== 食べ歩き =====
  {
    id: "kakuni-manju",
    name: "岩崎本舗（角煮まんじゅう）",
    category: "food",
    area: "長崎市",
    lat: 32.7463, lng: 129.8720,
    duration: 20,
    desc: "長崎名物・角煮まんじゅうの人気店。トロトロに煮た豚角煮を饅頭で挟んだ食べ歩きグルメ。長崎駅・大波止ターミナル近くに複数店舗あり。テイクアウトで食べながら次のスポットへ。",
    tags: ["角煮まんじゅう", "食べ歩き", "テイクアウト", "長崎名物"]
  },
  {
    id: "fukusaya",
    name: "福砂屋 本店（カステラ）",
    category: "food",
    area: "長崎市",
    lat: 32.7466, lng: 129.8779,
    duration: 20,
    desc: "1624年創業の長崎カステラ老舗。底のザラメ糖がザクザクとした食感が特徴。本店での試食や、カットカステラの食べ歩きも楽しめる。お土産購入にも最適。",
    tags: ["カステラ", "食べ歩き", "お土産", "老舗", "長崎名物"]
  },
  {
    id: "yoshiso",
    name: "吉宗 本店（茶碗蒸し・蒸し寿司）",
    category: "food",
    area: "長崎市",
    lat: 32.7435, lng: 129.8801,
    duration: 70,
    desc: "明治元年（1868年）創業の長崎の老舗。特大の長崎名物「茶碗蒸し」と「蒸し寿司」のセットが名物。2日目の夕食に最適。浜の町アーケード近く。ランチ・夕食ともに営業。",
    tags: ["茶碗蒸し", "蒸し寿司", "夕食", "老舗", "長崎名物"]
  },

  {
    id: "gunkanjima",
    name: "軍艦島(端島)クルーズ乗り場",
    category: "history",
    area: "長崎市",
    lat: 32.7430, lng: 129.8700,
    duration: 180,
    desc: "世界遺産・軍艦島への上陸クルーズの発着エリア（常盤・元船など）。所要は往復約3時間で要事前予約。時間に余裕がある場合に。",
    tags: ["世界遺産", "クルーズ", "要予約"]
  },

  // ===== 雲仙温泉 =====
  {
    id: "unzen-jigoku",
    name: "雲仙地獄",
    category: "nature",
    area: "雲仙",
    lat: 32.7344, lng: 130.2607,
    duration: 60,
    desc: "白い噴気と硫黄の匂いが立ちこめる雲仙のシンボル。遊歩道を一周できる。界 雲仙から徒歩圏内。名物「温泉たまご」も。",
    tags: ["散策", "宿から近い", "絶景"]
  },
  {
    id: "nitatoge",
    name: "仁田峠・雲仙ロープウェイ",
    category: "nature",
    area: "雲仙",
    lat: 32.7556, lng: 130.2944,
    duration: 90,
    desc: "妙見岳へ上るロープウェイ。春のミヤマキリシマ、秋の紅葉、冬の霧氷が名物。山頂からは普賢岳や有明海を一望。",
    tags: ["ロープウェイ", "絶景", "紅葉"]
  },
  {
    id: "manmyoji",
    name: "満明寺",
    category: "history",
    area: "雲仙",
    lat: 32.7330, lng: 130.2628,
    duration: 30,
    desc: "雲仙温泉街にある古刹。金色の大仏が見どころ。地獄めぐりの途中に立ち寄りやすい。",
    tags: ["寺", "宿から近い"]
  },
  {
    id: "oyama-info",
    name: "雲仙お山の情報館",
    category: "nature",
    area: "雲仙",
    lat: 32.7335, lng: 130.2615,
    duration: 30,
    desc: "雲仙の自然・火山・歴史を学べる無料の情報館。散策前の予習に。",
    tags: ["無料", "情報館"]
  },

  // ===== 小浜温泉 =====
  {
    id: "hotfoot105",
    name: "小浜温泉 ほっとふっと105",
    category: "onsen",
    area: "小浜",
    lat: 32.7297, lng: 130.2058,
    duration: 45,
    desc: "全長105mの日本一長い足湯。橘湾に沈む夕日を眺めながら足湯を楽しめる。蒸し釜で温泉蒸し体験も。",
    tags: ["足湯", "夕日", "無料あり"]
  },
  {
    id: "obama-champon",
    name: "小浜ちゃんぽん(街なか)",
    category: "food",
    area: "小浜",
    lat: 32.7305, lng: 130.2065,
    duration: 60,
    desc: "長崎ちゃんぽんとは少し違う、あっさり系の「小浜ちゃんぽん」。街なかに数軒の名店が点在。昼食に。",
    tags: ["小浜ちゃんぽん", "昼食"]
  },

  // ===== 島原 =====
  {
    id: "shimabara-castle",
    name: "島原城",
    category: "history",
    area: "島原",
    lat: 32.7878, lng: 130.3636,
    duration: 60,
    desc: "白壁が美しい五層の天守。キリシタン史料や島原の乱に関する展示。天守からは島原の街と有明海を一望。",
    tags: ["城", "歴史", "絶景"]
  },
  {
    id: "bukeyashiki",
    name: "島原 武家屋敷",
    category: "history",
    area: "島原",
    lat: 32.7869, lng: 130.3590,
    duration: 40,
    desc: "通りの中央を清水が流れる風情ある武家屋敷跡。無料で内部見学できる屋敷もある。",
    tags: ["町並み", "無料"]
  },
  {
    id: "koi-machi",
    name: "鯉の泳ぐまち",
    category: "nature",
    area: "島原",
    lat: 32.7896, lng: 130.3653,
    duration: 30,
    desc: "湧水の水路に色とりどりの鯉が泳ぐ一画。湧水庭園「四明荘」もすぐそば。",
    tags: ["湧水", "散策", "フォトスポット"]
  },
  {
    id: "kanzarashi",
    name: "かんざらし(しまばら)",
    category: "food",
    area: "島原",
    lat: 32.7894, lng: 130.3650,
    duration: 40,
    desc: "白玉を冷たい湧水と蜜でいただく島原名物のスイーツ。水屋敷や銀水などの名店で。",
    tags: ["スイーツ", "湧水", "甘味"]
  },
  {
    id: "gamadasu",
    name: "雲仙岳災害記念館(がまだすドーム)",
    category: "history",
    area: "島原",
    lat: 32.7787, lng: 130.4039,
    duration: 60,
    desc: "1990年代の普賢岳噴火・火砕流を体感展示で学べる施設。自然の脅威と防災を知る。",
    tags: ["防災学習", "体感展示"]
  }
];

const CATEGORY_META = {
  transit: { label: "交通拠点",  color: "#6b7280", emoji: "✈️" },
  hotel:   { label: "宿",        color: "#7c3aed", emoji: "🏨" },
  food:    { label: "グルメ",    color: "#e11d48", emoji: "🍜" },
  history: { label: "歴史・文化", color: "#2563eb", emoji: "🏯" },
  nature:  { label: "自然・絶景", color: "#16a34a", emoji: "⛰️" },
  onsen:   { label: "温泉",      color: "#ea580c", emoji: "♨️" }
};

// 1泊2日のおすすめプラン（id順）。レンタカー・グルメ/歴史/自然重視。
const PRESETS = {
  airport: {
    name: "✈️ 空港発：食べ歩き長崎観光 → 雲仙泊 → 帰路グルメ",
    start1: "10:30",
    start2: "09:00",
    // Day1: 空港(10:30)→ 移動50分 → 中華街(ランチ)→ 角煮まんじゅう→ カステラ → グラバー園 → 大浦天主堂 → 界 雲仙(夕食はホテル)
    day1: ["nagasaki-airport", "chinatown", "kakuni-manju", "fukusaya", "glover", "oura", "kai-unzen"],
    // Day2: 雲仙地獄 → 仁田峠ロープウェイ → 小浜ちゃんぽん(ランチ) → 吉宗 本店(夕食) → 帰路
    day2: ["unzen-jigoku", "nitatoge", "obama-champon", "yoshiso"]
  },
  classic: {
    name: "王道：長崎市内 → 雲仙泊 → 地獄&ロープウェイ",
    start1: "10:00",
    start2: "09:00",
    day1: ["oura", "glover", "shikairo", "peace-park", "atomic-museum", "kai-unzen"],
    day2: ["unzen-jigoku", "nitatoge", "obama-champon", "hotfoot105"]
  },
  shimabara: {
    name: "島原満喫：長崎市内 → 雲仙泊 → 島原城下町",
    start1: "10:30",
    start2: "09:00",
    day1: ["chinatown", "glover", "oura", "inasayama", "kai-unzen"],
    day2: ["unzen-jigoku", "shimabara-castle", "koi-machi", "kanzarashi", "gamadasu"]
  },
  relax: {
    name: "ゆったり：雲仙&小浜の温泉と自然中心",
    start1: "11:00",
    start2: "09:30",
    day1: ["dejima", "tsuruchan", "meganebashi", "kai-unzen"],
    day2: ["unzen-jigoku", "manmyoji", "nitatoge", "hotfoot105", "obama-champon"]
  }
};
