import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
	en: {
		translation: {
			title: 'Sharkie',
			subtitle: 'Currency Exchange Rates',
			health: {
				online: 'API Online',
				offline: 'API Offline',
				checking: 'Checking...'
			},
			search: {
				placeholder: 'Search currencies...',
				noResults: 'No currencies found'
			},
			sidebar: {
				overview: 'Overview',
				calculator: 'Calculator',
				chart: 'Chart',
				rates: 'Rates',
				map: 'Map',
				table: 'Table',
				history: 'History',
				today: 'Prices',
				library: 'Library',
				heatmap: 'Heatmap',
				comparison: 'Compare',
				currencies: 'Currencies',
				sectionNav: 'Navigation',
				sectionData: 'Data',
				dark: 'Dark',
				light: 'Light'
			},
			heatmap: {
				title: 'Volatility Heatmap',
				stable: 'Stable',
				volatile: 'Volatile'
			},
			comparison: {
				title: 'Period Comparison',
				currency: 'Currency',
				change: 'Change',
				current: 'Current',
				previous: 'Previous',
				changeCol: 'Change',
				noData: 'No data for comparison period',
				mode: {
					week: 'WoW',
					month: 'MoM',
					quarter: 'QoQ',
					halfYear: 'HoH',
					year: 'YoY'
				}
			},
			chart: {
				title: 'Exchange Rate Trends',
				noData: 'No data to display. Select currencies and date range above.',
				loading: 'Fetching rates...',
				error: 'Failed to load rates'
			},
			controls: {
				from: 'Period',
				to: 'To',
				base: 'Base',
				currencies: 'Currencies',
				addCurrency: 'Add',
				apply: 'Apply',
				dateFrom: 'From',
				dateTo: 'To',
				dates: 'Dates',
				period: {
					week: '1W',
					month: '1M',
					quarter: '3M',
					halfYear: '6M',
					year: '1Y'
				}
			},
			cards: {
				title: 'Current Rates',
				rate: 'Rate',
				change: 'Change',
				noChange: 'No change'
			},
			settings: {
				title: 'Settings',
				theme: 'Theme',
				dark: 'Dark',
				light: 'Light',
				language: 'Language',
				pwa: 'Install App',
				pwaHint: 'Install Sharkie as a PWA for quick access'
			},
			cat: {
				greeting: 'Meow! Ready to track currencies!',
				loading: 'Purr... fetching data...',
				success: 'Purrfect! Data loaded!',
				error: 'Hiss! Something went wrong...',
				idle: 'Zzz... waiting for you...',
				tip: 'Try adding more currencies!'
			},
			map: {
				title: 'Currency Map'
			},
			table: {
				title: 'Rates Table',
				date: 'Date',
				showAll: 'Show all',
				showLess: 'Show less'
			},
			history: {
				title: 'Currency Details',
				min: 'Min',
				max: 'Max',
				avg: 'Average',
				volatility: 'Volatility'
			},
			calc: {
				title: 'Calculator',
				from: 'From',
				to: 'To'
			},
			favorites: {
				title: 'Favorite Currencies',
				add: 'Add to favorites',
				remove: 'Remove from favorites'
			},
			library: {
				title: 'Currency Library',
				total: 'Total',
				active: 'Active',
				favCount: 'Favorites',
				filterAll: 'All',
				filterActive: 'Active',
				filterFavorites: 'Favorites'
			},
			today: {
				title: "Today's Price",
				currency: 'Currency',
				symbol: 'Symbol',
				rate: 'Rate',
				change: 'Change'
			},
			footer: {
				powered: 'Powered by Sharkie API',
				cat: 'Made with love and cats'
			}
		}
	},
	ru: {
		translation: {
			title: 'Sharkie',
			subtitle: 'Курсы валют',
			health: {
				online: 'API онлайн',
				offline: 'API офлайн',
				checking: 'Проверка...'
			},
			search: {
				placeholder: 'Поиск валют...',
				noResults: 'Валюты не найдены'
			},
			sidebar: {
				overview: 'Обзор',
				calculator: 'Калькулятор',
				chart: 'График',
				rates: 'Курсы',
				map: 'Карта',
				table: 'Таблица',
				history: 'История',
				today: 'Цены',
				library: 'Библиотека',
				heatmap: 'Тепловая карта',
				comparison: 'Сравнение',
				currencies: 'Валюты',
				sectionNav: 'Навигация',
				sectionData: 'Данные',
				dark: 'Тёмная',
				light: 'Светлая'
			},
			heatmap: {
				title: 'Карта волатильности',
				stable: 'Стабильные',
				volatile: 'Волатильные'
			},
			comparison: {
				title: 'Сравнение периодов',
				currency: 'Валюта',
				change: 'Изм.',
				current: 'Текущий',
				previous: 'Предыдущий',
				changeCol: 'Изменение',
				noData: 'Нет данных за сравниваемый период',
				mode: {
					week: 'НкН',
					month: 'МкМ',
					quarter: 'КкК',
					halfYear: 'ПгкПг',
					year: 'ГкГ'
				}
			},
			chart: {
				title: 'Динамика курсов',
				noData: 'Нет данных. Выберите валюты и период выше.',
				loading: 'Загрузка курсов...',
				error: 'Ошибка загрузки курсов'
			},
			controls: {
				from: 'Период',
				to: 'До',
				base: 'Базовая',
				currencies: 'Валюты',
				addCurrency: 'Добавить',
				apply: 'Применить',
				dateFrom: 'С',
				dateTo: 'По',
				dates: 'Даты',
				period: {
					week: '1Н',
					month: '1М',
					quarter: '3М',
					halfYear: '6М',
					year: '1Г'
				}
			},
			cards: {
				title: 'Текущие курсы',
				rate: 'Курс',
				change: 'Изменение',
				noChange: 'Без изменений'
			},
			settings: {
				title: 'Настройки',
				theme: 'Тема',
				dark: 'Тёмная',
				light: 'Светлая',
				language: 'Язык',
				pwa: 'Установить приложение',
				pwaHint: 'Установите Sharkie как PWA для быстрого доступа'
			},
			cat: {
				greeting: 'Мяу! Готов отслеживать валюты!',
				loading: 'Мурр... загружаю данные...',
				success: 'Мур-мур! Данные загружены!',
				error: 'Шшш! Что-то пошло не так...',
				idle: 'Ззз... жду тебя...',
				tip: 'Попробуй добавить ещё валют!'
			},
			map: {
				title: 'Карта валют'
			},
			table: {
				title: 'Таблица курсов',
				date: 'Дата',
				showAll: 'Показать все',
				showLess: 'Показать меньше'
			},
			history: {
				title: 'Детали по валютам',
				min: 'Мин',
				max: 'Макс',
				avg: 'Среднее',
				volatility: 'Волатильность'
			},
			calc: {
				title: 'Калькулятор',
				from: 'Из',
				to: 'В'
			},
			favorites: {
				title: 'Избранные валюты',
				add: 'Добавить в избранное',
				remove: 'Убрать из избранного'
			},
			library: {
				title: 'Библиотека валют',
				total: 'Всего',
				active: 'Активные',
				favCount: 'Избранные',
				filterAll: 'Все',
				filterActive: 'Активные',
				filterFavorites: 'Избранные'
			},
			today: {
				title: 'Курсы на сегодня',
				currency: 'Валюта',
				symbol: 'Символ',
				rate: 'Курс',
				change: 'Изменение'
			},
			footer: {
				powered: 'Работает на Sharkie API',
				cat: 'Сделано с любовью и котиками'
			}
		}
	},
	ja: {
		translation: {
			title: 'Sharkie',
			subtitle: '為替レート',
			health: {
				online: 'APIオンライン',
				offline: 'APIオフライン',
				checking: '確認中...'
			},
			search: {
				placeholder: '通貨を検索...',
				noResults: '通貨が見つかりません'
			},
			sidebar: {
				overview: '概要',
				calculator: '計算機',
				chart: 'チャート',
				rates: 'レート',
				map: '地図',
				table: 'テーブル',
				history: '履歴',
				today: '価格',
				library: 'ライブラリ',
				heatmap: 'ヒートマップ',
				comparison: '比較',
				currencies: '通貨',
				sectionNav: 'ナビゲーション',
				sectionData: 'データ',
				dark: 'ダーク',
				light: 'ライト'
			},
			heatmap: {
				title: 'ボラティリティヒートマップ',
				stable: '安定',
				volatile: '不安定'
			},
			comparison: {
				title: '期間比較',
				currency: '通貨',
				change: '変動',
				current: '現在',
				previous: '前期',
				changeCol: '変動',
				noData: '比較データがありません',
				mode: {
					week: '週比',
					month: '月比',
					quarter: '四半期比',
					halfYear: '半年比',
					year: '年比'
				}
			},
			chart: {
				title: '為替レートの推移',
				noData: 'データがありません。通貨と期間を選択してください。',
				loading: 'レートを取得中...',
				error: 'レートの読み込みに失敗しました'
			},
			controls: {
				from: '期間',
				to: 'まで',
				base: '基準',
				currencies: '通貨',
				addCurrency: '追加',
				apply: '適用',
				dateFrom: 'から',
				dateTo: 'まで',
				dates: '日付',
				period: {
					week: '1週',
					month: '1月',
					quarter: '3月',
					halfYear: '6月',
					year: '1年'
				}
			},
			cards: {
				title: '現在のレート',
				rate: 'レート',
				change: '変動',
				noChange: '変動なし'
			},
			settings: {
				title: '設定',
				theme: 'テーマ',
				dark: 'ダーク',
				light: 'ライト',
				language: '言語',
				pwa: 'アプリをインストール',
				pwaHint: 'Sharkieをインストールしてすぐアクセス'
			},
			cat: {
				greeting: 'ニャー！通貨追跡の準備完了！',
				loading: 'ゴロゴロ...データ取得中...',
				success: 'パーフェクト！データ読み込み完了！',
				error: 'シャー！何か問題が...',
				idle: 'zzz...待ってるよ...',
				tip: '通貨を追加してみよう！'
			},
			map: {
				title: '通貨マップ',
				clickToAdd: 'クリックして通貨を追加'
			},
			table: {
				title: 'レートテーブル',
				date: '日付',
				showAll: 'すべて表示',
				showLess: '表示を減らす'
			},
			history: {
				title: '通貨詳細',
				min: '最小',
				max: '最大',
				avg: '平均',
				volatility: 'ボラティリティ'
			},
			calc: {
				title: '計算機',
				from: 'から',
				to: 'へ'
			},
			favorites: {
				title: 'お気に入り通貨',
				add: 'お気に入りに追加',
				remove: 'お気に入りから削除'
			},
			library: {
				title: '通貨ライブラリ',
				total: '合計',
				active: 'アクティブ',
				favCount: 'お気に入り',
				filterAll: 'すべて',
				filterActive: 'アクティブ',
				filterFavorites: 'お気に入り'
			},
			today: {
				title: '本日の価格',
				currency: '通貨',
				symbol: 'シンボル',
				rate: 'レート',
				change: '変動'
			},
			footer: {
				powered: 'Sharkie APIで稼働',
				cat: '愛と猫で作りました'
			}
		}
	},
	es: {
		translation: {
			title: 'Sharkie',
			subtitle: 'Tipos de cambio',
			health: {
				online: 'API en línea',
				offline: 'API fuera de línea',
				checking: 'Verificando...'
			},
			search: {
				placeholder: 'Buscar divisas...',
				noResults: 'No se encontraron divisas'
			},
			sidebar: {
				overview: 'Resumen',
				calculator: 'Calculadora',
				chart: 'Gráfico',
				rates: 'Tasas',
				map: 'Mapa',
				table: 'Tabla',
				history: 'Historial',
				today: 'Precios',
				library: 'Biblioteca',
				heatmap: 'Mapa de calor',
				comparison: 'Comparar',
				currencies: 'Divisas',
				sectionNav: 'Navegación',
				sectionData: 'Datos',
				dark: 'Oscuro',
				light: 'Claro'
			},
			heatmap: {
				title: 'Mapa de volatilidad',
				stable: 'Estable',
				volatile: 'Volátil'
			},
			comparison: {
				title: 'Comparación de períodos',
				currency: 'Divisa',
				change: 'Cambio',
				current: 'Actual',
				previous: 'Anterior',
				changeCol: 'Cambio',
				noData: 'Sin datos del período comparado',
				mode: {
					week: 'SaS',
					month: 'MaM',
					quarter: 'TaT',
					halfYear: 'SaS',
					year: 'AaA'
				}
			},
			chart: {
				title: 'Tendencias del tipo de cambio',
				noData: 'Sin datos. Seleccione divisas y período.',
				loading: 'Cargando tasas...',
				error: 'Error al cargar tasas'
			},
			controls: {
				from: 'Período',
				to: 'Hasta',
				base: 'Base',
				currencies: 'Divisas',
				addCurrency: 'Agregar',
				apply: 'Aplicar',
				dateFrom: 'Desde',
				dateTo: 'Hasta',
				dates: 'Fechas',
				period: {
					week: '1S',
					month: '1M',
					quarter: '3M',
					halfYear: '6M',
					year: '1A'
				}
			},
			cards: {
				title: 'Tasas actuales',
				rate: 'Tasa',
				change: 'Cambio',
				noChange: 'Sin cambio'
			},
			settings: {
				title: 'Configuración',
				theme: 'Tema',
				dark: 'Oscuro',
				light: 'Claro',
				language: 'Idioma',
				pwa: 'Instalar app',
				pwaHint: 'Instala Sharkie como PWA para acceso rápido'
			},
			cat: {
				greeting: '¡Miau! ¡Listo para rastrear divisas!',
				loading: 'Purr... obteniendo datos...',
				success: '¡Purrfecto! ¡Datos cargados!',
				error: '¡Sssh! Algo salió mal...',
				idle: 'Zzz... esperándote...',
				tip: '¡Intenta agregar más divisas!'
			},
			map: {
				title: 'Mapa de divisas',
				clickToAdd: 'Clic para agregar divisa'
			},
			table: {
				title: 'Tabla de tasas',
				date: 'Fecha',
				showAll: 'Mostrar todo',
				showLess: 'Mostrar menos'
			},
			history: {
				title: 'Detalles de divisas',
				min: 'Mín',
				max: 'Máx',
				avg: 'Promedio',
				volatility: 'Volatilidad'
			},
			calc: {
				title: 'Calculadora',
				from: 'De',
				to: 'A'
			},
			favorites: {
				title: 'Divisas favoritas',
				add: 'Agregar a favoritos',
				remove: 'Quitar de favoritos'
			},
			library: {
				title: 'Biblioteca de divisas',
				total: 'Total',
				active: 'Activas',
				favCount: 'Favoritas',
				filterAll: 'Todas',
				filterActive: 'Activas',
				filterFavorites: 'Favoritas'
			},
			today: {
				title: 'Precio de hoy',
				currency: 'Divisa',
				symbol: 'Símbolo',
				rate: 'Tasa',
				change: 'Cambio'
			},
			footer: {
				powered: 'Powered by Sharkie API',
				cat: 'Hecho con amor y gatos'
			}
		}
	}
};

i18n.use(initReactI18next).init({
	resources,
	lng: typeof window !== 'undefined' ? localStorage.getItem('sharkie-lang') || 'en' : 'en',
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false
	}
});

export default i18n;
