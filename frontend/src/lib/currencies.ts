/* ── Currency categories ────────────────────────── */

export type CurrencyCategory = 'major' | 'europe' | 'asia' | 'americas' | 'africa_me' | 'crypto' | 'other';

export const CATEGORY_LABELS_EN: Record<CurrencyCategory, string> = {
	major: 'Major',
	europe: 'Europe',
	asia: 'Asia & Pacific',
	americas: 'Americas',
	africa_me: 'Africa & Middle East',
	crypto: 'Crypto',
	other: 'Other'
};

export const CATEGORY_LABELS_RU: Record<CurrencyCategory, string> = {
	major: 'Основные',
	europe: 'Европа',
	asia: 'Азия и Океания',
	americas: 'Америка',
	africa_me: 'Африка и Ближний Восток',
	crypto: 'Крипто',
	other: 'Другие'
};

export const CATEGORY_LABELS_JA: Record<CurrencyCategory, string> = {
	major: '主要通貨',
	europe: 'ヨーロッパ',
	asia: 'アジア・太平洋',
	americas: 'アメリカ',
	africa_me: 'アフリカ・中東',
	crypto: '暗号通貨',
	other: 'その他'
};

export const CATEGORY_LABELS_ES: Record<CurrencyCategory, string> = {
	major: 'Principales',
	europe: 'Europa',
	asia: 'Asia y Pacífico',
	americas: 'Américas',
	africa_me: 'África y Medio Oriente',
	crypto: 'Cripto',
	other: 'Otros'
};

export const CATEGORY_ICONS: Record<CurrencyCategory, string> = {
	major: '💎',
	europe: '🏰',
	asia: '🏯',
	americas: '🗽',
	africa_me: '🌍',
	crypto: '₿',
	other: '🌐'
};

export const CURRENCY_CATEGORIES: Record<string, CurrencyCategory> = {
	// Major (G7 + CHF + reserve currencies)
	USD: 'major', EUR: 'major', GBP: 'major', JPY: 'major', CHF: 'major',
	CAD: 'major', AUD: 'major', CNY: 'major',
	// Europe
	SEK: 'europe', NOK: 'europe', DKK: 'europe', PLN: 'europe', CZK: 'europe',
	HUF: 'europe', RON: 'europe', BGN: 'europe', HRK: 'europe', RSD: 'europe',
	ISK: 'europe', RUB: 'europe', UAH: 'europe', BYN: 'europe', GEL: 'europe',
	MDL: 'europe', ALL: 'europe', MKD: 'europe', BAM: 'europe',
	// Asia & Pacific
	KRW: 'asia', INR: 'asia', SGD: 'asia', HKD: 'asia', THB: 'asia',
	TWD: 'asia', MYR: 'asia', IDR: 'asia', PHP: 'asia', VND: 'asia',
	KZT: 'asia', UZS: 'asia', KGS: 'asia', TJS: 'asia', TMT: 'asia',
	AZN: 'asia', AMD: 'asia', MNT: 'asia', BDT: 'asia', PKR: 'asia',
	LKR: 'asia', MMK: 'asia', KHR: 'asia', LAK: 'asia', NZD: 'asia',
	FJD: 'asia',
	// Americas
	BRL: 'americas', MXN: 'americas', ARS: 'americas', CLP: 'americas',
	COP: 'americas', PEN: 'americas', UYU: 'americas', PYG: 'americas',
	BOB: 'americas', VES: 'americas', DOP: 'americas', CRC: 'americas',
	GTQ: 'americas', HNL: 'americas', NIO: 'americas', JMD: 'americas',
	TTD: 'americas', BBD: 'americas', BSD: 'americas', PAB: 'americas',
	HTG: 'americas', CUP: 'americas',
	// Africa & Middle East
	ZAR: 'africa_me', TRY: 'africa_me', ILS: 'africa_me', AED: 'africa_me',
	SAR: 'africa_me', QAR: 'africa_me', KWD: 'africa_me', BHD: 'africa_me',
	OMR: 'africa_me', JOD: 'africa_me', LBP: 'africa_me', EGP: 'africa_me',
	MAD: 'africa_me', TND: 'africa_me', DZD: 'africa_me', NGN: 'africa_me',
	KES: 'africa_me', GHS: 'africa_me', TZS: 'africa_me', UGX: 'africa_me',
	ETB: 'africa_me', ZMW: 'africa_me', MZN: 'africa_me', AOA: 'africa_me',
	BWP: 'africa_me', MUR: 'africa_me', SCR: 'africa_me', RWF: 'africa_me',
	XOF: 'africa_me', XAF: 'africa_me', IQD: 'africa_me', IRR: 'africa_me',
	SYP: 'africa_me', YER: 'africa_me', LYD: 'africa_me',
	// Crypto
	BTC: 'crypto', ETH: 'crypto', BNB: 'crypto', XRP: 'crypto', SOL: 'crypto',
	ADA: 'crypto', DOGE: 'crypto', DOT: 'crypto', LTC: 'crypto',
	LINK: 'crypto', USDT: 'crypto', USDC: 'crypto'
};

export const getCurrencyCategory = (code: string): CurrencyCategory =>
	CURRENCY_CATEGORIES[code] || 'other';

export const ALL_CATEGORIES: CurrencyCategory[] = ['major', 'europe', 'asia', 'americas', 'africa_me', 'crypto', 'other'];

/* ── Legacy list (for Controls dropdown etc.) ──── */

export const ALL_CURRENCIES = [
	'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KZT', 'RUB', 'TRY', 'BRL',
	'AUD', 'CAD', 'CHF', 'INR', 'MXN', 'PLN', 'SEK', 'NOK', 'DKK',
	'CZK', 'HUF', 'ILS', 'SGD', 'HKD', 'KRW', 'THB', 'ZAR'
];

export const DEFAULT_FAVORITES = ['KZT', 'USD', 'RUB', 'EUR', 'JPY'];

/* ── Flags ─────────────────────────────────────── */

const f = (a: string, b: string) => String.fromCodePoint(
	0x1F1E6 + a.charCodeAt(0) - 65,
	0x1F1E6 + b.charCodeAt(0) - 65
);

export const CURRENCY_FLAGS: Record<string, string> = {
	USD: f('U','S'), EUR: f('E','U'), GBP: f('G','B'), JPY: f('J','P'),
	CNY: f('C','N'), KZT: f('K','Z'), RUB: f('R','U'), TRY: f('T','R'),
	BRL: f('B','R'), AUD: f('A','U'), CAD: f('C','A'), CHF: f('C','H'),
	INR: f('I','N'), MXN: f('M','X'), PLN: f('P','L'), SEK: f('S','E'),
	NOK: f('N','O'), DKK: f('D','K'), CZK: f('C','Z'), HUF: f('H','U'),
	ILS: f('I','L'), SGD: f('S','G'), HKD: f('H','K'), KRW: f('K','R'),
	THB: f('T','H'), ZAR: f('Z','A'), TWD: f('T','W'), MYR: f('M','Y'),
	IDR: f('I','D'), PHP: f('P','H'), VND: f('V','N'), NZD: f('N','Z'),
	AED: f('A','E'), SAR: f('S','A'), QAR: f('Q','A'), KWD: f('K','W'),
	BHD: f('B','H'), OMR: f('O','M'), JOD: f('J','O'), LBP: f('L','B'),
	EGP: f('E','G'), MAD: f('M','A'), TND: f('T','N'), DZD: f('D','Z'),
	NGN: f('N','G'), KES: f('K','E'), GHS: f('G','H'), TZS: f('T','Z'),
	UGX: f('U','G'), ETB: f('E','T'), ZMW: f('Z','M'), MZN: f('M','Z'),
	AOA: f('A','O'), BWP: f('B','W'), MUR: f('M','U'), SCR: f('S','C'),
	RWF: f('R','W'), RON: f('R','O'), BGN: f('B','G'), HRK: f('H','R'),
	RSD: f('R','S'), ISK: f('I','S'), UAH: f('U','A'), BYN: f('B','Y'),
	GEL: f('G','E'), MDL: f('M','D'), ALL: f('A','L'), MKD: f('M','K'),
	BAM: f('B','A'), ARS: f('A','R'), CLP: f('C','L'), COP: f('C','O'),
	PEN: f('P','E'), UYU: f('U','Y'), PYG: f('P','Y'), BOB: f('B','O'),
	VES: f('V','E'), DOP: f('D','O'), CRC: f('C','R'), GTQ: f('G','T'),
	HNL: f('H','N'), NIO: f('N','I'), JMD: f('J','M'), TTD: f('T','T'),
	BBD: f('B','B'), BSD: f('B','S'), PAB: f('P','A'), HTG: f('H','T'),
	CUP: f('C','U'), UZS: f('U','Z'), KGS: f('K','G'), TJS: f('T','J'),
	TMT: f('T','M'), AZN: f('A','Z'), AMD: f('A','M'), MNT: f('M','N'),
	BDT: f('B','D'), PKR: f('P','K'), LKR: f('L','K'), MMK: f('M','M'),
	KHR: f('K','H'), LAK: f('L','A'), FJD: f('F','J'), IQD: f('I','Q'),
	IRR: f('I','R'), SYP: f('S','Y'), YER: f('Y','E'), LYD: f('L','Y'),
	XOF: '🌍', XAF: '🌍',
	// Crypto
	BTC: '₿', ETH: '⟠', BNB: '🔶', XRP: '✕', SOL: '◎',
	ADA: '🔵', DOGE: '🐕', DOT: '⬡', LTC: '🪙',
	LINK: '🔗', USDT: '💲', USDC: '💵'
};

/* ── Names EN ──────────────────────────────────── */

export const CURRENCY_NAMES_EN: Record<string, string> = {
	USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
	CNY: 'Chinese Yuan', KZT: 'Kazakh Tenge', RUB: 'Russian Ruble',
	TRY: 'Turkish Lira', BRL: 'Brazilian Real', AUD: 'Australian Dollar',
	CAD: 'Canadian Dollar', CHF: 'Swiss Franc', INR: 'Indian Rupee',
	MXN: 'Mexican Peso', PLN: 'Polish Zloty', SEK: 'Swedish Krona',
	NOK: 'Norwegian Krone', DKK: 'Danish Krone', CZK: 'Czech Koruna',
	HUF: 'Hungarian Forint', ILS: 'Israeli Shekel', SGD: 'Singapore Dollar',
	HKD: 'Hong Kong Dollar', KRW: 'South Korean Won', THB: 'Thai Baht',
	ZAR: 'South African Rand', TWD: 'Taiwan Dollar', MYR: 'Malaysian Ringgit',
	IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso', VND: 'Vietnamese Dong',
	NZD: 'New Zealand Dollar', AED: 'UAE Dirham', SAR: 'Saudi Riyal',
	QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar', BHD: 'Bahraini Dinar',
	OMR: 'Omani Rial', JOD: 'Jordanian Dinar', LBP: 'Lebanese Pound',
	EGP: 'Egyptian Pound', MAD: 'Moroccan Dirham', TND: 'Tunisian Dinar',
	DZD: 'Algerian Dinar', NGN: 'Nigerian Naira', KES: 'Kenyan Shilling',
	GHS: 'Ghanaian Cedi', TZS: 'Tanzanian Shilling', UGX: 'Ugandan Shilling',
	ETB: 'Ethiopian Birr', ZMW: 'Zambian Kwacha', MZN: 'Mozambican Metical',
	AOA: 'Angolan Kwanza', BWP: 'Botswana Pula', MUR: 'Mauritian Rupee',
	SCR: 'Seychellois Rupee', RWF: 'Rwandan Franc', RON: 'Romanian Leu',
	BGN: 'Bulgarian Lev', HRK: 'Croatian Kuna', RSD: 'Serbian Dinar',
	ISK: 'Icelandic Krona', UAH: 'Ukrainian Hryvnia', BYN: 'Belarusian Ruble',
	GEL: 'Georgian Lari', MDL: 'Moldovan Leu', ALL: 'Albanian Lek',
	MKD: 'Macedonian Denar', BAM: 'Bosnian Mark', ARS: 'Argentine Peso',
	CLP: 'Chilean Peso', COP: 'Colombian Peso', PEN: 'Peruvian Sol',
	UYU: 'Uruguayan Peso', PYG: 'Paraguayan Guarani', BOB: 'Bolivian Boliviano',
	VES: 'Venezuelan Bolivar', DOP: 'Dominican Peso', CRC: 'Costa Rican Colon',
	GTQ: 'Guatemalan Quetzal', HNL: 'Honduran Lempira', NIO: 'Nicaraguan Cordoba',
	JMD: 'Jamaican Dollar', TTD: 'Trinidad Dollar', BBD: 'Barbadian Dollar',
	BSD: 'Bahamian Dollar', PAB: 'Panamanian Balboa', HTG: 'Haitian Gourde',
	CUP: 'Cuban Peso', UZS: 'Uzbek Sum', KGS: 'Kyrgyz Som',
	TJS: 'Tajik Somoni', TMT: 'Turkmen Manat', AZN: 'Azerbaijani Manat',
	AMD: 'Armenian Dram', MNT: 'Mongolian Tugrik', BDT: 'Bangladeshi Taka',
	PKR: 'Pakistani Rupee', LKR: 'Sri Lankan Rupee', MMK: 'Myanmar Kyat',
	KHR: 'Cambodian Riel', LAK: 'Lao Kip', FJD: 'Fijian Dollar',
	XOF: 'West African CFA', XAF: 'Central African CFA',
	IQD: 'Iraqi Dinar', IRR: 'Iranian Rial', SYP: 'Syrian Pound',
	YER: 'Yemeni Rial', LYD: 'Libyan Dinar',
	BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', XRP: 'XRP', SOL: 'Solana',
	ADA: 'Cardano', DOGE: 'Dogecoin', DOT: 'Polkadot', LTC: 'Litecoin',
	LINK: 'Chainlink', USDT: 'Tether', USDC: 'USD Coin'
};

/* ── Names RU ──────────────────────────────────── */

export const CURRENCY_NAMES_RU: Record<string, string> = {
	USD: 'Доллар США', EUR: 'Евро', GBP: 'Британский фунт', JPY: 'Японская иена',
	CNY: 'Китайский юань', KZT: 'Казахский тенге', RUB: 'Российский рубль',
	TRY: 'Турецкая лира', BRL: 'Бразильский реал', AUD: 'Австралийский доллар',
	CAD: 'Канадский доллар', CHF: 'Швейцарский франк', INR: 'Индийская рупия',
	MXN: 'Мексиканское песо', PLN: 'Польский злотый', SEK: 'Шведская крона',
	NOK: 'Норвежская крона', DKK: 'Датская крона', CZK: 'Чешская крона',
	HUF: 'Венгерский форинт', ILS: 'Израильский шекель', SGD: 'Сингапурский доллар',
	HKD: 'Гонконгский доллар', KRW: 'Южнокорейская вона', THB: 'Тайский бат',
	ZAR: 'Южноафриканский рэнд', TWD: 'Тайваньский доллар', MYR: 'Малайзийский ринггит',
	IDR: 'Индонезийская рупия', PHP: 'Филиппинское песо', VND: 'Вьетнамский донг',
	NZD: 'Новозеландский доллар', AED: 'Дирхам ОАЭ', SAR: 'Саудовский риял',
	QAR: 'Катарский риял', KWD: 'Кувейтский динар', BHD: 'Бахрейнский динар',
	OMR: 'Оманский риал', JOD: 'Иорданский динар', LBP: 'Ливанский фунт',
	EGP: 'Египетский фунт', MAD: 'Марокканский дирхам', TND: 'Тунисский динар',
	DZD: 'Алжирский динар', NGN: 'Нигерийская найра', KES: 'Кенийский шиллинг',
	GHS: 'Ганский седи', TZS: 'Танзанийский шиллинг', UGX: 'Угандийский шиллинг',
	ETB: 'Эфиопский быр', ZMW: 'Замбийская квача', MZN: 'Мозамбикский метикал',
	AOA: 'Ангольская кванза', BWP: 'Ботсванская пула', MUR: 'Маврикийская рупия',
	SCR: 'Сейшельская рупия', RWF: 'Руандийский франк', RON: 'Румынский лей',
	BGN: 'Болгарский лев', HRK: 'Хорватская куна', RSD: 'Сербский динар',
	ISK: 'Исландская крона', UAH: 'Украинская гривна', BYN: 'Белорусский рубль',
	GEL: 'Грузинский лари', MDL: 'Молдавский лей', ALL: 'Албанский лек',
	MKD: 'Македонский денар', BAM: 'Боснийская марка', ARS: 'Аргентинское песо',
	CLP: 'Чилийское песо', COP: 'Колумбийское песо', PEN: 'Перуанский соль',
	UYU: 'Уругвайское песо', PYG: 'Парагвайский гуарани', BOB: 'Боливийский боливиано',
	VES: 'Венесуэльский боливар', DOP: 'Доминиканское песо', CRC: 'Костариканский колон',
	GTQ: 'Гватемальский кетсаль', HNL: 'Гондурасская лемпира', NIO: 'Никарагуанская кордоба',
	JMD: 'Ямайский доллар', TTD: 'Тринидадский доллар', BBD: 'Барбадосский доллар',
	BSD: 'Багамский доллар', PAB: 'Панамский бальбоа', HTG: 'Гаитянский гурд',
	CUP: 'Кубинское песо', UZS: 'Узбекский сум', KGS: 'Кыргызский сом',
	TJS: 'Таджикский сомони', TMT: 'Туркменский манат', AZN: 'Азербайджанский манат',
	AMD: 'Армянский драм', MNT: 'Монгольский тугрик', BDT: 'Бангладешская така',
	PKR: 'Пакистанская рупия', LKR: 'Шри-ланкийская рупия', MMK: 'Мьянманский кьят',
	KHR: 'Камбоджийский риель', LAK: 'Лаосский кип', FJD: 'Фиджийский доллар',
	XOF: 'Западноафриканский франк', XAF: 'Центральноафриканский франк',
	IQD: 'Иракский динар', IRR: 'Иранский риал', SYP: 'Сирийский фунт',
	YER: 'Йеменский риал', LYD: 'Ливийский динар',
	BTC: 'Биткоин', ETH: 'Эфириум', BNB: 'BNB', XRP: 'XRP', SOL: 'Солана',
	ADA: 'Кардано', DOGE: 'Догикоин', DOT: 'Полкадот', LTC: 'Лайткоин',
	LINK: 'Чейнлинк', USDT: 'Тезер', USDC: 'USD Коин'
};

/* ── Names JA ──────────────────────────────────── */

export const CURRENCY_NAMES_JA: Record<string, string> = {
	USD: '米ドル', EUR: 'ユーロ', GBP: '英ポンド', JPY: '日本円',
	CNY: '中国人民元', KZT: 'カザフスタンテンゲ', RUB: 'ロシアルーブル',
	TRY: 'トルコリラ', BRL: 'ブラジルレアル', AUD: '豪ドル',
	CAD: 'カナダドル', CHF: 'スイスフラン', INR: 'インドルピー',
	MXN: 'メキシコペソ', PLN: 'ポーランドズロチ', SEK: 'スウェーデンクローナ',
	NOK: 'ノルウェークローネ', DKK: 'デンマーククローネ', CZK: 'チェココルナ',
	HUF: 'ハンガリーフォリント', ILS: 'イスラエルシェケル', SGD: 'シンガポールドル',
	HKD: '香港ドル', KRW: '韓国ウォン', THB: 'タイバーツ',
	ZAR: '南アフリカランド', TWD: '台湾ドル', MYR: 'マレーシアリンギット',
	IDR: 'インドネシアルピア', PHP: 'フィリピンペソ', VND: 'ベトナムドン',
	NZD: 'ニュージーランドドル', AED: 'UAEディルハム', SAR: 'サウジリヤル',
	KWD: 'クウェートディナール', EGP: 'エジプトポンド', NGN: 'ナイジェリアナイラ',
	RON: 'ルーマニアレイ', UAH: 'ウクライナフリヴニャ', ARS: 'アルゼンチンペソ',
	CLP: 'チリペソ', COP: 'コロンビアペソ', PEN: 'ペルーソル',
	UZS: 'ウズベキスタンスム', AZN: 'アゼルバイジャンマナト', AMD: 'アルメニアドラム',
	PKR: 'パキスタンルピー', BDT: 'バングラデシュタカ',
	BTC: 'ビットコイン', ETH: 'イーサリアム', BNB: 'BNB', XRP: 'XRP', SOL: 'ソラナ',
	ADA: 'カルダノ', DOGE: 'ドージコイン', DOT: 'ポルカドット', LTC: 'ライトコイン',
	LINK: 'チェーンリンク', USDT: 'テザー', USDC: 'USDコイン'
};

/* ── Names ES ──────────────────────────────────── */

export const CURRENCY_NAMES_ES: Record<string, string> = {
	USD: 'Dólar estadounidense', EUR: 'Euro', GBP: 'Libra esterlina', JPY: 'Yen japonés',
	CNY: 'Yuan chino', KZT: 'Tenge kazajo', RUB: 'Rublo ruso',
	TRY: 'Lira turca', BRL: 'Real brasileño', AUD: 'Dólar australiano',
	CAD: 'Dólar canadiense', CHF: 'Franco suizo', INR: 'Rupia india',
	MXN: 'Peso mexicano', PLN: 'Zloty polaco', SEK: 'Corona sueca',
	NOK: 'Corona noruega', DKK: 'Corona danesa', CZK: 'Corona checa',
	HUF: 'Forinto húngaro', ILS: 'Séquel israelí', SGD: 'Dólar singapurense',
	HKD: 'Dólar hongkonés', KRW: 'Won surcoreano', THB: 'Baht tailandés',
	ZAR: 'Rand sudafricano', TWD: 'Dólar taiwanés', MYR: 'Ringgit malayo',
	IDR: 'Rupia indonesia', PHP: 'Peso filipino', VND: 'Dong vietnamita',
	NZD: 'Dólar neozelandés', AED: 'Dírham de los EAU', SAR: 'Riyal saudí',
	KWD: 'Dinar kuwaití', EGP: 'Libra egipcia', NGN: 'Naira nigeriana',
	RON: 'Leu rumano', UAH: 'Grivna ucraniana', ARS: 'Peso argentino',
	CLP: 'Peso chileno', COP: 'Peso colombiano', PEN: 'Sol peruano',
	UZS: 'Sum uzbeko', AZN: 'Manat azerbaiyano', AMD: 'Dram armenio',
	PKR: 'Rupia pakistaní', BDT: 'Taka bangladesí',
	BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', XRP: 'XRP', SOL: 'Solana',
	ADA: 'Cardano', DOGE: 'Dogecoin', DOT: 'Polkadot', LTC: 'Litecoin',
	LINK: 'Chainlink', USDT: 'Tether', USDC: 'USD Coin'
};

/* ── Symbols ───────────────────────────────────── */

export const CURRENCY_SYMBOLS: Record<string, string> = {
	USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
	KZT: '₸', RUB: '₽', TRY: '₺', BRL: 'R$', AUD: 'A$',
	CAD: 'C$', CHF: 'Fr', INR: '₹', MXN: 'Mex$', PLN: 'zł',
	SEK: 'kr', NOK: 'kr', DKK: 'kr', CZK: 'Kč', HUF: 'Ft',
	ILS: '₪', SGD: 'S$', HKD: 'HK$', KRW: '₩', THB: '฿',
	ZAR: 'R', TWD: 'NT$', MYR: 'RM', IDR: 'Rp', PHP: '₱',
	VND: '₫', NZD: 'NZ$', AED: 'د.إ', SAR: '﷼', QAR: '﷼',
	KWD: 'د.ك', BHD: '.د.ب', OMR: '﷼', JOD: 'د.ا', LBP: 'ل.ل',
	EGP: 'E£', MAD: 'د.م.', TND: 'د.ت', DZD: 'د.ج', NGN: '₦',
	KES: 'KSh', GHS: '₵', RON: 'lei', BGN: 'лв', UAH: '₴',
	BYN: 'Br', GEL: '₾', ARS: 'AR$', CLP: 'CL$', COP: 'CO$',
	PEN: 'S/.', UZS: 'сўм', KGS: 'сом', AZN: '₼', AMD: '֏',
	PKR: '₨', LKR: 'Rs', BDT: '৳'
};

/* ── Helpers ───────────────────────────────────── */

export const getCurrencyName = (code: string, lang: string): string => {
	const nameMap: Record<string, Record<string, string>> = {
		ru: CURRENCY_NAMES_RU,
		ja: CURRENCY_NAMES_JA,
		es: CURRENCY_NAMES_ES,
	};
	const names = nameMap[lang] || CURRENCY_NAMES_EN;
	return names[code] || CURRENCY_NAMES_EN[code] || code;
};

export const formatCurrencyLabel = (code: string, lang: string): string => {
	return `${CURRENCY_FLAGS[code] || ''} ${code} — ${getCurrencyName(code, lang)}`;
};

export const matchesCurrencySearch = (code: string, query: string, lang: string): boolean => {
	if (!query.trim()) return true;
	const q = query.toLowerCase().trim();
	const name = getCurrencyName(code, lang).toLowerCase();
	return code.toLowerCase().includes(q) || name.includes(q);
};

/* ── Intl-based rate formatter ────────────────── */

const LOCALE_MAP: Record<string, string> = {
	en: 'en-US', ru: 'ru-RU', ja: 'ja-JP', es: 'es-ES'
};

// Known ISO 4217 codes that Intl recognizes (crypto codes will fall back)
const INTL_SUPPORTED = new Set([
	'USD','EUR','GBP','JPY','CNY','KZT','RUB','TRY','BRL','AUD','CAD','CHF',
	'INR','MXN','PLN','SEK','NOK','DKK','CZK','HUF','ILS','SGD','HKD','KRW',
	'THB','ZAR','TWD','MYR','IDR','PHP','VND','NZD','AED','SAR','QAR','KWD',
	'BHD','OMR','JOD','LBP','EGP','MAD','TND','DZD','NGN','KES','GHS','TZS',
	'UGX','ETB','ZMW','MZN','AOA','BWP','MUR','SCR','RWF','RON','BGN','HRK',
	'RSD','ISK','UAH','BYN','GEL','MDL','ALL','MKD','BAM','ARS','CLP','COP',
	'PEN','UYU','PYG','BOB','VES','DOP','CRC','GTQ','HNL','NIO','JMD','TTD',
	'BBD','BSD','PAB','HTG','CUP','UZS','KGS','TJS','TMT','AZN','AMD','MNT',
	'BDT','PKR','LKR','MMK','KHR','LAK','FJD','XOF','XAF','IQD','IRR','SYP',
	'YER','LYD'
]);

const fmtCache = new Map<string, Intl.NumberFormat>();

function getFormatter(code: string, lang: string, decimals: number): Intl.NumberFormat | null {
	if (!INTL_SUPPORTED.has(code)) return null;
	const key = `${code}-${lang}-${decimals}`;
	let fmt = fmtCache.get(key);
	if (!fmt) {
		try {
			fmt = new Intl.NumberFormat(LOCALE_MAP[lang] || 'en-US', {
				style: 'currency',
				currency: code,
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			});
			fmtCache.set(key, fmt);
		} catch {
			return null;
		}
	}
	return fmt;
}

function pickDecimals(rate: number): number {
	if (rate >= 1000) return 0;
	if (rate >= 100) return 2;
	if (rate >= 1) return 3;
	return 4;
}

export function formatRate(rate: number, code?: string, lang?: string): string {
	const decimals = pickDecimals(rate);
	if (code && lang) {
		const fmt = getFormatter(code, lang, decimals);
		if (fmt) return fmt.format(rate);
	}
	// Fallback: plain number
	if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 0 });
	return rate.toFixed(decimals);
}
