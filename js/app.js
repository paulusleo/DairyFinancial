/**
 * DAILY FINANCIAL DIARY - CORE APPLICATION LOGIC
 * Plain JavaScript (ES6+), Chart.js, Lucide Icons, LocalStorage Persistence
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // CONSTANTS & CATEGORY DEFINITIONS
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'daily_financial_diary_transactions_v1';
  const THEME_KEY = 'daily_financial_diary_theme';
  const BUDGET_KEY = 'daily_financial_diary_budget_limit';
  const CUSTOM_CATEGORIES_KEY = 'daily_financial_diary_custom_categories_v1';
  const RECURRING_STORAGE_KEY = 'daily_financial_diary_recurring_v1';

  // Palet tonal: pengeluaran = keluarga indigo/slate, pemasukan = keluarga hijau
  let EXPENSE_CATEGORIES = [
    { id: 'makanan', name: 'Makanan & Minuman', icon: 'utensils', color: '#4f46e5', bg: '#4f46e51f' },
    { id: 'belanja', name: 'Belanja Kebutuhan', icon: 'shopping-bag', color: '#6366f1', bg: '#6366f11f' },
    { id: 'transport', name: 'Transportasi', icon: 'car', color: '#818cf8', bg: '#818cf826' },
    { id: 'tagihan', name: 'Tagihan & Utilitas', icon: 'zap', color: '#3730a3', bg: '#3730a31f' },
    { id: 'hiburan', name: 'Hiburan & Hobi', icon: 'gamepad-2', color: '#a5b4fc', bg: '#a5b4fc33' },
    { id: 'kesehatan', name: 'Kesehatan & Obat', icon: 'heart-pulse', color: '#475569', bg: '#4755691f' },
    { id: 'pendidikan', name: 'Edukasi & Buku', icon: 'book-open', color: '#64748b', bg: '#64748b1f' },
    { id: 'lainnya', name: 'Lain-lain', icon: 'more-horizontal', color: '#94a3b8', bg: '#94a3b826' },
  ];

  let INCOME_CATEGORIES = [
    { id: 'gaji', name: 'Gaji Pokok', icon: 'banknote', color: '#059669', bg: '#0596691f' },
    { id: 'freelance', name: 'Proyek Freelance', icon: 'laptop', color: '#10b981', bg: '#10b9811f' },
    { id: 'bonus', name: 'Bonus & Tunjangan', icon: 'sparkles', color: '#34d399', bg: '#34d39926' },
    { id: 'investasi', name: 'Hasil Investasi', icon: 'trending-up', color: '#047857', bg: '#0478571f' },
    { id: 'penjualan', name: 'Hasil Penjualan', icon: 'tag', color: '#6ee7b7', bg: '#6ee7b733' },
    { id: 'hadiah', name: 'Hadiah & Transfer', icon: 'gift', color: '#065f46', bg: '#065f461f' },
    { id: 'lainnya_in', name: 'Pemasukan Lainnya', icon: 'plus-circle', color: '#94a3b8', bg: '#94a3b826' },
  ];

  // Map category IDs for quick lookup
  let ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  let CATEGORY_MAP = ALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  let transactions = [];
  let expenseChartInstance = null;
  let trendChartInstance = null;
  let activeChartView = 'category'; // 'category' or 'trend'
  let activeFilter = 'all'; // 'all', 'income', 'expense'
  let searchQuery = '';
  let currentPeriod = 'this-month'; // 'this-month', 'last-month', 'all'
  let monthlyBudgetLimit = Number(localStorage.getItem(BUDGET_KEY)) || 3000000;
  let customCategories = [];
  let recurringTemplates = [];

  // --------------------------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // --------------------------------------------------------------------------
  const DOM = {
    currentDateText: document.getElementById('current-date-text'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeIcon: document.getElementById('theme-icon'),
    btnOpenModal: document.getElementById('btn-open-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    transactionModal: document.getElementById('transaction-modal'),
    transactionForm: document.getElementById('transaction-form'),
    formTypeInput: document.getElementById('form-type'),
    btnTypeExpense: document.getElementById('btn-type-expense'),
    btnTypeIncome: document.getElementById('btn-type-income'),
    formAmount: document.getElementById('form-amount'),
    formCategory: document.getElementById('form-category'),
    formDate: document.getElementById('form-date'),
    formNote: document.getElementById('form-note'),
    amountHint: document.getElementById('amount-hint'),
    formEditId: document.getElementById('form-edit-id'),
    modalTitle: document.getElementById('modal-title'),
    btnSubmitLabel: document.getElementById('btn-submit-label'),
    btnQuickCreateCat: document.getElementById('btn-quick-create-cat'),
    btnResetFormFields: document.getElementById('btn-reset-form-fields'),

    // Period Filter Bar & Toolbar
    periodPills: document.querySelectorAll('.period-pill'),
    periodStatusText: document.getElementById('period-status-text'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnOpenRecurring: document.getElementById('btn-open-recurring'),
    btnOpenCategoryModal: document.getElementById('btn-open-category-modal'),

    // Recurring Transactions Modal Elements
    recurringModal: document.getElementById('recurring-modal'),
    btnCloseRecurringModal: document.getElementById('btn-close-recurring-modal'),
    btnCancelRecurringModal: document.getElementById('btn-cancel-recurring-modal'),
    recurringTemplatesList: document.getElementById('recurring-templates-list'),
    recurringForm: document.getElementById('recurring-form'),
    formRecType: document.getElementById('form-rec-type'),
    formRecCategory: document.getElementById('form-rec-category'),
    formRecNote: document.getElementById('form-rec-note'),
    formRecAmount: document.getElementById('form-rec-amount'),

    // Custom Category Modal Elements
    categoryModal: document.getElementById('category-modal'),
    categoryModalTitle: document.getElementById('category-modal-title'),
    categoryModalSubtitle: document.getElementById('category-modal-subtitle'),
    btnCloseCategoryModal: document.getElementById('btn-close-category-modal'),
    btnCancelCategoryModal: document.getElementById('btn-cancel-category-modal'),
    categoryForm: document.getElementById('category-form'),
    formCatEditId: document.getElementById('form-cat-edit-id'),
    btnCatTypeExpense: document.getElementById('btn-cat-type-expense'),
    btnCatTypeIncome: document.getElementById('btn-cat-type-income'),
    formCatType: document.getElementById('form-cat-type'),
    formCatName: document.getElementById('form-cat-name'),
    formCatColor: document.getElementById('form-cat-color'),
    colorDots: document.querySelectorAll('.color-dot-choice'),
    btnCancelCatEdit: document.getElementById('btn-cancel-cat-edit'),
    btnSubmitCategory: document.getElementById('btn-submit-category'),
    btnSubmitCatLabel: document.getElementById('btn-submit-cat-label'),
    customCatCount: document.getElementById('custom-cat-count'),
    customCategoriesList: document.getElementById('custom-categories-list'),

    // Monthly Budget Elements
    budgetSpentAmount: document.getElementById('budget-spent-amount'),
    budgetLimitAmount: document.getElementById('budget-limit-amount'),
    budgetProgressBar: document.getElementById('budget-progress-bar'),
    budgetRemainingText: document.getElementById('budget-remaining-text'),
    budgetPercentBadge: document.getElementById('budget-percent-badge'),
    btnEditBudget: document.getElementById('btn-edit-budget'),
    budgetModal: document.getElementById('budget-modal'),
    budgetForm: document.getElementById('budget-form'),
    formBudgetAmount: document.getElementById('form-budget-amount'),
    budgetAmountHint: document.getElementById('budget-amount-hint'),
    btnCloseBudgetModal: document.getElementById('btn-close-budget-modal'),
    btnCancelBudgetModal: document.getElementById('btn-cancel-budget-modal'),
    
    // Metrics
    totalIncomeVal: document.getElementById('total-income-value'),
    totalExpenseVal: document.getElementById('total-expense-value'),
    netBalanceVal: document.getElementById('net-balance-value'),
    incomeCountPill: document.getElementById('income-count-pill'),
    expenseCountPill: document.getElementById('expense-count-pill'),
    balanceStatusPill: document.getElementById('balance-status-pill'),
    
    // Feed & Controls
    feedSearchInput: document.getElementById('feed-search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    transactionFeed: document.getElementById('transaction-feed'),
    emptyFeedState: document.getElementById('empty-feed-state'),
    btnEmptyAdd: document.getElementById('btn-empty-add'),
    
    // Chart & Stats
    chartCanvas: document.getElementById('expense-chart'),
    chartCenterAmount: document.getElementById('chart-center-amount'),
    categoryLegendList: document.getElementById('category-legend-list'),
    tabChartCategory: document.getElementById('tab-chart-category'),
    tabChartTrend: document.getElementById('tab-chart-trend'),
    categoryChartView: document.getElementById('category-chart-view'),
    trendChartView: document.getElementById('trend-chart-view'),
    trendBarChartCanvas: document.getElementById('trend-bar-chart'),
    savingsRateText: document.getElementById('savings-rate-text'),
    savingsRateBar: document.getElementById('savings-rate-bar'),
    savingsStatusNote: document.getElementById('savings-status-note'),
    statAvgExpense: document.getElementById('stat-avg-expense'),
    statMaxExpense: document.getElementById('stat-max-expense'),
    btnResetDemo: document.getElementById('btn-reset-demo'),
    btnClearAll: document.getElementById('btn-clear-all'),
    toastContainer: document.getElementById('toast-container'),

    // Auth Screen DOM Elements
    authScreen: document.getElementById('auth-screen'),
    appLayout: document.getElementById('app-layout'),
    supabaseConfigWarning: document.getElementById('supabase-config-warning'),
    btnBypassDemo: document.getElementById('btn-bypass-demo'),
    tabAuthLogin: document.getElementById('tab-auth-login'),
    tabAuthRegister: document.getElementById('tab-auth-register'),
    authAlert: document.getElementById('auth-alert'),
    authAlertIcon: document.getElementById('auth-alert-icon'),
    authAlertText: document.getElementById('auth-alert-text'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    groupAuthPassword: document.getElementById('group-auth-password'),
    authPassword: document.getElementById('auth-password'),
    linkForgotPassword: document.getElementById('link-forgot-password'),
    groupConfirmPassword: document.getElementById('group-confirm-password'),
    authConfirmPassword: document.getElementById('auth-confirm-password'),
    btnTogglePassword: document.getElementById('btn-toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),
    btnAuthSubmit: document.getElementById('btn-auth-submit'),
    authSubmitText: document.getElementById('auth-submit-text'),
    authSubmitIcon: document.getElementById('auth-submit-icon'),
    authSpinner: document.getElementById('auth-spinner'),
    authFooterText: document.getElementById('auth-footer-text'),
    authBackToLogin: document.getElementById('auth-back-to-login'),
    linkSwitchToRegister: document.getElementById('link-switch-to-register'),
    linkBackToLogin: document.getElementById('link-back-to-login'),
    userBadge: document.getElementById('user-badge'),
    userEmailDisplay: document.getElementById('user-email-display'),
    btnLogout: document.getElementById('btn-logout'),

    // PWA & Connectivity Elements
    btnInstallPwa: document.getElementById('btn-install-pwa'),
    offlineBadge: document.getElementById('offline-badge'),

    // Reset Password Recovery Modal Elements
    resetPasswordModal: document.getElementById('reset-password-modal'),
    btnCloseResetModal: document.getElementById('btn-close-reset-modal'),
    newPasswordForm: document.getElementById('new-password-form'),
    formNewPassword: document.getElementById('form-new-password'),
    formConfirmNewPassword: document.getElementById('form-confirm-new-password'),
    btnSubmitNewPassword: document.getElementById('btn-submit-new-password'),
  };

  // Auth & PWA State
  let currentUser = null;
  let authMode = 'login'; // 'login', 'register', or 'forgot'
  let deferredPwaPrompt = null;

  // --------------------------------------------------------------------------
  // DATE HELPERS (Indonesian locale)
  // --------------------------------------------------------------------------
  function getTodayDateString(offsetDays = 0) {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateStr) {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(dateObj);
    } catch (e) {
      return dateStr;
    }
  }

  function getRelativeDateLabel(dateStr) {
    const todayStr = getTodayDateString(0);
    const yesterdayStr = getTodayDateString(-1);

    if (dateStr === todayStr) return { text: 'Hari Ini', isSpecial: true };
    if (dateStr === yesterdayStr) return { text: 'Kemarin', isSpecial: true };
    return { text: null, isSpecial: false };
  }

  // --------------------------------------------------------------------------
  // CURRENCY HELPERS
  // --------------------------------------------------------------------------
  function formatRupiah(amount, withSymbol = true) {
    const num = Math.round(Number(amount) || 0);
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(num));

    if (withSymbol) {
      return num < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
    }
    return formatted;
  }

  function cleanNumericInput(str) {
    return String(str).replace(/\D/g, '');
  }

  // --------------------------------------------------------------------------
  // DUMMY DATA GENERATOR (Realistic Indonesian personal finances)
  // --------------------------------------------------------------------------
  function getInitialDummyData() {
    const today = getTodayDateString(0);
    const yesterday = getTodayDateString(-1);
    const twoDaysAgo = getTodayDateString(-2);
    const threeDaysAgo = getTodayDateString(-3);

    return [
      // Hari Ini
      {
        id: 'tx-1',
        type: 'income',
        amount: 8500000,
        category: 'gaji',
        date: today,
        note: 'Gaji Bulanan & Tunjangan Operasional',
        createdAt: Date.now() - 3600000 * 4
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 35000,
        category: 'makanan',
        date: today,
        note: 'Makan Siang Nasi Padang + Es Teh',
        createdAt: Date.now() - 3600000 * 2
      },
      {
        id: 'tx-3',
        type: 'expense',
        amount: 28000,
        category: 'makanan',
        date: today,
        note: 'Kopi Susu Gula Aren Senja',
        createdAt: Date.now() - 3600000
      },

      // Kemarin
      {
        id: 'tx-4',
        type: 'income',
        amount: 1250000,
        category: 'freelance',
        date: yesterday,
        note: 'Pembayaran DP Desain UI/UX Mobile App',
        createdAt: Date.now() - 86400000 - 3600000 * 5
      },
      {
        id: 'tx-5',
        type: 'expense',
        amount: 320000,
        category: 'belanja',
        date: yesterday,
        note: 'Belanja Mingguan Supermarket & Buah Segar',
        createdAt: Date.now() - 86400000 - 3600000 * 3
      },
      {
        id: 'tx-6',
        type: 'expense',
        amount: 50000,
        category: 'transport',
        date: yesterday,
        note: 'Bensin Motor Pertamax Full Tank',
        createdAt: Date.now() - 86400000 - 3600000 * 1
      },

      // 2 Hari Lalu
      {
        id: 'tx-7',
        type: 'expense',
        amount: 220000,
        category: 'tagihan',
        date: twoDaysAgo,
        note: 'Token Listrik PLN & Iuran Internet',
        createdAt: Date.now() - 86400000 * 2 - 3600000 * 6
      },
      {
        id: 'tx-8',
        type: 'expense',
        amount: 54000,
        category: 'hiburan',
        date: twoDaysAgo,
        note: 'Langganan Streaming Film & Musik',
        createdAt: Date.now() - 86400000 * 2 - 3600000 * 4
      },

      // 3 Hari Lalu
      {
        id: 'tx-9',
        type: 'expense',
        amount: 95000,
        category: 'kesehatan',
        date: threeDaysAgo,
        note: 'Vitamin C & Suplemen Herbal Apotek',
        createdAt: Date.now() - 86400000 * 3 - 3600000 * 7
      },
      {
        id: 'tx-10',
        type: 'income',
        amount: 450000,
        category: 'investasi',
        date: threeDaysAgo,
        note: 'Dividen Reksa Dana Pasar Uang',
        createdAt: Date.now() - 86400000 * 3 - 3600000 * 2
      }
    ];
  }

  // --------------------------------------------------------------------------
  // STORAGE & SUPABASE DATABASE SYNC
  // --------------------------------------------------------------------------
  const DEMO_USER_ID = 'demo-user-1';

  // True jika pengguna login dengan akun Supabase sungguhan (bukan Mode Demo)
  function isCloudUser() {
    return !!(currentUser && currentUser.id && currentUser.id !== DEMO_USER_ID);
  }

  // Client Supabase hanya dipakai untuk akun cloud; Mode Demo murni lokal
  function getCloudClient() {
    if (!isCloudUser()) return null;
    return window.getSupabaseClient ? window.getSupabaseClient() : null;
  }

  // Cache lokal dipisah per akun agar data contoh / akun lain tidak tercampur
  function getTransactionsStorageKey() {
    return isCloudUser() ? `${STORAGE_KEY}_user_${currentUser.id}` : STORAGE_KEY;
  }

  function loadTransactionsFromLocal() {
    // Akun cloud tidak pernah diisi data contoh otomatis
    const fallback = () => (isCloudUser() ? [] : getInitialDummyData());
    try {
      const data = localStorage.getItem(getTransactionsStorageKey());
      if (data) {
        transactions = JSON.parse(data);
      } else {
        transactions = fallback();
      }
    } catch (e) {
      console.error('Error loading local transactions', e);
      transactions = fallback();
    }
  }

  async function fetchTransactions() {
    const client = getCloudClient();
    
    // Jika user login dengan Supabase, tarik data dari database cloud Supabase
    if (client && currentUser && currentUser.id) {
      try {
        const { data, error } = await client
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[Supabase DB] Belum bisa membaca tabel transactions:', error.message);
          // Fallback lokal sementara jika tabel belum dibuat di Supabase
          loadTransactionsFromLocal();
          updateAllViews();
          return;
        }

        if (data) {
          transactions = data.map(item => ({
            id: item.id,
            type: item.type,
            amount: Number(item.amount),
            category: item.category,
            date: item.date,
            note: item.note || '',
            createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
          }));
          console.log(`[Supabase DB] Berhasil memuat ${transactions.length} transaksi dari cloud.`);
          saveTransactions(); // Perbarui cache lokal agar sama dengan cloud
          updateAllViews();
          return;
        }
      } catch (err) {
        console.error('[Supabase DB Error]', err);
        loadTransactionsFromLocal();
        updateAllViews();
        return;
      }
    }

    // Default fallback
    loadTransactionsFromLocal();
    updateAllViews();
  }

  function saveTransactions() {
    try {
      localStorage.setItem(getTransactionsStorageKey(), JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  function mapCloudRow(item) {
    return {
      id: item.id,
      type: item.type,
      amount: Number(item.amount),
      category: item.category,
      date: item.date,
      note: item.note || '',
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
    };
  }

  // Ganti seluruh transaksi milik user di Supabase dengan daftar baru.
  // Return array transaksi hasil cloud, atau null jika gagal.
  async function replaceCloudTransactions(client, list) {
    const { error: delError } = await client
      .from('transactions')
      .delete()
      .eq('user_id', currentUser.id);
    if (delError) {
      showToast('Gagal menghapus data di Supabase: ' + delError.message, 'danger');
      return null;
    }
    if (!list.length) return [];

    const rows = list.map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      note: t.note || ''
    }));
    const { data, error } = await client.from('transactions').insert(rows).select();
    if (error) {
      showToast('Gagal menyimpan data contoh ke Supabase: ' + error.message, 'danger');
      return [];
    }
    return (data || []).map(mapCloudRow);
  }

  // --------------------------------------------------------------------------
  // THEME MANAGEMENT (Dark / Light Mode)
  // --------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);

    DOM.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(`Mode ${newTheme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan`, 'info');
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    if (theme === 'dark') {
      DOM.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      DOM.themeIcon.setAttribute('data-lucide', 'moon');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Refresh chart colors if chart exists
    if (expenseChartInstance) {
      updateExpenseChart();
    }
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATION SYSTEM
  // --------------------------------------------------------------------------
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'check-circle-2';
    if (type === 'danger') iconName = 'alert-triangle';
    if (type === 'info') iconName = 'info';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    if (window.lucide) {
      window.lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 3200);
  }

  // --------------------------------------------------------------------------
  // UI INITIALIZATION & POPULATION
  // --------------------------------------------------------------------------
  function initDateHeader() {
    const today = new Date();
    const formatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(today);

    DOM.currentDateText.textContent = formatted;
  }

  function populateCategoryDropdown(type) {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    DOM.formCategory.innerHTML = '';

    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      DOM.formCategory.appendChild(option);
    });
  }

  // --------------------------------------------------------------------------
  // PERIOD FILTER LOGIC
  // --------------------------------------------------------------------------
  function getFilteredTransactions() {
    if (currentPeriod === 'all') {
      return [...transactions];
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (currentPeriod === 'this-month') {
      return transactions.filter(tx => {
        if (!tx.date) return false;
        const [y, m] = tx.date.split('-').map(Number);
        return y === currentYear && (m - 1) === currentMonth;
      });
    }

    if (currentPeriod === 'last-month') {
      const prev = new Date(currentYear, currentMonth - 1, 1);
      const prevYear = prev.getFullYear();
      const prevMonth = prev.getMonth();
      return transactions.filter(tx => {
        if (!tx.date) return false;
        const [y, m] = tx.date.split('-').map(Number);
        return y === prevYear && (m - 1) === prevMonth;
      });
    }

    return [...transactions];
  }

  function updatePeriodStatusLabel() {
    if (!DOM.periodStatusText) return;
    const now = new Date();
    if (currentPeriod === 'this-month') {
      const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now);
      DOM.periodStatusText.textContent = `Periode: Bulan Ini (${monthName})`;
    } else if (currentPeriod === 'last-month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(prev);
      DOM.periodStatusText.textContent = `Periode: Bulan Lalu (${monthName})`;
    } else {
      DOM.periodStatusText.textContent = 'Periode: Semua Waktu';
    }
  }

  // --------------------------------------------------------------------------
  // DASHBOARD METRICS CALCULATION
  // --------------------------------------------------------------------------
  function updateDashboardMetrics() {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let maxExpense = 0;

    const filtered = getFilteredTransactions();

    filtered.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amt;
        incomeCount++;
      } else {
        totalExpense += amt;
        expenseCount++;
        if (amt > maxExpense) maxExpense = amt;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const avgExpense = expenseCount > 0 ? totalExpense / expenseCount : 0;

    // Update DOM values
    DOM.totalIncomeVal.textContent = formatRupiah(totalIncome);
    DOM.totalExpenseVal.textContent = formatRupiah(totalExpense);
    DOM.netBalanceVal.textContent = formatRupiah(netBalance);

    DOM.incomeCountPill.innerHTML = `<i data-lucide="trending-up"></i> ${incomeCount} Transaksi`;
    DOM.expenseCountPill.innerHTML = `<i data-lucide="trending-down"></i> ${expenseCount} Transaksi`;

    // Net balance badge styling
    if (netBalance >= 0) {
      DOM.balanceStatusPill.className = 'metric-badge balance-pill';
      DOM.balanceStatusPill.innerHTML = `<i data-lucide="sparkles"></i> Saldo Aman (Surplus)`;
    } else {
      DOM.balanceStatusPill.className = 'metric-badge balance-pill danger';
      DOM.balanceStatusPill.innerHTML = `<i data-lucide="alert-circle"></i> Defisit Finansial`;
    }

    // Savings Rate Calculation
    let savingsRate = 0;
    if (totalIncome > 0) {
      savingsRate = Math.max(0, Math.min(100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)));
    }

    DOM.savingsRateText.textContent = `${savingsRate}%`;
    DOM.savingsRateBar.style.width = `${savingsRate}%`;

    if (savingsRate >= 50) {
      DOM.savingsStatusNote.textContent = 'Luar biasa! Tingkat tabungan Anda di atas 50%, kondisi keuangan sangat prima.';
    } else if (savingsRate >= 20) {
      DOM.savingsStatusNote.textContent = 'Kondisi baik! Tabungan memenuhi standar sehat (20-40% dari pemasukan).';
    } else if (savingsRate > 0) {
      DOM.savingsStatusNote.textContent = 'Waspada, pengeluaran cukup tinggi mendekati jumlah total pemasukan Anda.';
    } else {
      DOM.savingsStatusNote.textContent = 'Defisit finansial! Pengeluaran melebihi pemasukan, evaluasi pos pengeluaran harian Anda.';
    }

    // Mini stats
    DOM.statAvgExpense.textContent = formatRupiah(avgExpense);
    DOM.statMaxExpense.textContent = formatRupiah(maxExpense);

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --------------------------------------------------------------------------
  // DAILY FEED RENDERING (Grouped by Date)
  // --------------------------------------------------------------------------
  function renderDailyFeed() {
    DOM.transactionFeed.innerHTML = '';

    // Filter transactions by period first
    let filtered = getFilteredTransactions();

    // Filter by type (income/expense/all)
    if (activeFilter === 'income') {
      filtered = filtered.filter(tx => tx.type === 'income');
    } else if (activeFilter === 'expense') {
      filtered = filtered.filter(tx => tx.type === 'expense');
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tx => {
        const cat = CATEGORY_MAP[tx.category] ? CATEGORY_MAP[tx.category].name.toLowerCase() : '';
        const note = (tx.note || '').toLowerCase();
        return note.includes(q) || cat.includes(q);
      });
    }

    // Handle Empty State
    if (filtered.length === 0) {
      DOM.emptyFeedState.classList.remove('hidden');
      return;
    } else {
      DOM.emptyFeedState.classList.add('hidden');
    }

    // Sort descending by date, then by createdAt
    filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // Group by date string
    const groups = {};
    filtered.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    // Render each date group
    Object.keys(groups).forEach(dateStr => {
      const txList = groups[dateStr];
      const relative = getRelativeDateLabel(dateStr);
      const displayDate = formatDisplayDate(dateStr);

      // Compute daily net
      let dayNet = 0;
      txList.forEach(item => {
        if (item.type === 'income') {
          dayNet += Number(item.amount);
        } else {
          dayNet -= Number(item.amount);
        }
      });

      const groupContainer = document.createElement('div');
      groupContainer.className = 'date-group';

      // Group Header
      const groupHeader = document.createElement('div');
      groupHeader.className = 'date-group-header';
      
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'date-group-title';

      if (relative.text) {
        const relativeTag = document.createElement('span');
        relativeTag.className = 'date-relative-tag';
        relativeTag.textContent = relative.text;
        titleWrapper.appendChild(relativeTag);
      }

      const dateTextSpan = document.createElement('span');
      dateTextSpan.textContent = displayDate;
      titleWrapper.appendChild(dateTextSpan);

      const netBadge = document.createElement('span');
      netBadge.className = `date-net-change ${dayNet >= 0 ? 'positive' : 'negative'}`;
      netBadge.textContent = `${dayNet >= 0 ? '+' : ''}${formatRupiah(dayNet)}`;

      groupHeader.appendChild(titleWrapper);
      groupHeader.appendChild(netBadge);
      groupContainer.appendChild(groupHeader);

      // Items Container
      const itemsList = document.createElement('div');
      itemsList.className = 'transactions-list';

      txList.forEach(tx => {
        const cat = CATEGORY_MAP[tx.category] || {
          name: 'Lainnya',
          icon: 'receipt',
          color: '#64748b',
          bg: '#f1f5f9'
        };

        const isIncome = tx.type === 'income';
        const formattedAmount = `${isIncome ? '+' : '-'} ${formatRupiah(tx.amount)}`;

        const itemEl = document.createElement('div');
        itemEl.className = 'transaction-item';
        itemEl.innerHTML = `
          <div class="trans-left">
            <div class="category-icon-avatar" style="background-color: ${cat.bg}; color: ${cat.color};" title="${cat.name}">
              <i data-lucide="${cat.icon || 'receipt'}"></i>
            </div>
            <div class="trans-info">
              <span class="trans-title" title="${escapeHtml(tx.note)}">${escapeHtml(tx.note)}</span>
              <div class="trans-meta">
                <span class="trans-category-tag">${cat.name}</span>
                <span class="trans-meta-dot">&bull;</span>
                <span>${isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
              </div>
            </div>
          </div>
          <div class="trans-right">
            <span class="trans-amount ${isIncome ? 'income' : 'expense'}">${formattedAmount}</span>
            <div class="trans-actions-row">
              <button class="btn-edit-trans" data-id="${tx.id}" aria-label="Edit transaksi" title="Edit catatan ini">
                <i data-lucide="pencil"></i>
              </button>
              <button class="btn-delete-trans" data-id="${tx.id}" aria-label="Hapus transaksi" title="Hapus catatan ini">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;

        // Event listener for edit
        const editBtn = itemEl.querySelector('.btn-edit-trans');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(tx.id);
          });
        }

        // Event listener for delete
        const delBtn = itemEl.querySelector('.btn-delete-trans');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTransaction(tx.id);
          });
        }

        itemsList.appendChild(itemEl);
      });

      groupContainer.appendChild(itemsList);
      DOM.transactionFeed.appendChild(groupContainer);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // CHART.JS EXPENSE CATEGORY VISUALIZATION
  // --------------------------------------------------------------------------
  function updateExpenseChart() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Group expense by category based on current period
    const categoryTotals = {};
    let totalExpense = 0;

    EXPENSE_CATEGORIES.forEach(cat => {
      categoryTotals[cat.id] = 0;
    });

    const filtered = getFilteredTransactions();

    filtered.forEach(tx => {
      if (tx.type === 'expense') {
        const amt = Number(tx.amount) || 0;
        totalExpense += amt;
        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = 0;
        }
        categoryTotals[tx.category] += amt;
      }
    });

    // Center metric
    DOM.chartCenterAmount.textContent = formatRupiah(totalExpense);

    // Filter categories that have expense > 0
    const activeCategories = EXPENSE_CATEGORIES.filter(cat => categoryTotals[cat.id] > 0);

    // If no expense at all, provide placeholder
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    if (totalExpense === 0 || activeCategories.length === 0) {
      chartLabels.push('Belum ada pengeluaran');
      chartData.push(1);
      chartColors.push(isDark ? '#263352' : '#e2e8f0');
    } else {
      // Sort categories descending by amount
      activeCategories.sort((a, b) => categoryTotals[b.id] - categoryTotals[a.id]);

      activeCategories.forEach(cat => {
        chartLabels.push(cat.name);
        chartData.push(categoryTotals[cat.id]);
        chartColors.push(cat.color);
      });
    }

    // Render / Update Chart.js
    if (expenseChartInstance) {
      expenseChartInstance.destroy();
    }

    const ctx = DOM.chartCanvas.getContext('2d');
    expenseChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderWidth: isDark ? 2 : 2,
          borderColor: isDark ? '#131b2e' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateScale: true,
          duration: 650
        },
        plugins: {
          legend: {
            display: false // We use our custom detailed legend list below
          },
          tooltip: {
            enabled: totalExpense > 0,
            backgroundColor: isDark ? '#1a233a' : '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
                return ` ${formatRupiah(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    // Render detailed custom legend below the chart
    renderCategoryLegend(activeCategories, categoryTotals, totalExpense);
  }

  function renderCategoryLegend(activeCategories, categoryTotals, totalExpense) {
    DOM.categoryLegendList.innerHTML = '';

    if (totalExpense === 0 || activeCategories.length === 0) {
      DOM.categoryLegendList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: var(--fs-sm); padding: 0.5rem 0;">
          Belum ada pos pengeluaran tercatat
        </div>
      `;
      return;
    }

    activeCategories.forEach(cat => {
      const amount = categoryTotals[cat.id];
      const percent = ((amount / totalExpense) * 100).toFixed(1);

      const item = document.createElement('div');
      item.className = 'cat-legend-item';
      item.innerHTML = `
        <div class="cat-legend-header">
          <div class="cat-name-wrap">
            <span class="cat-color-dot" style="background-color: ${cat.color};"></span>
            <span>${cat.name}</span>
          </div>
          <div class="cat-values-wrap">
            <span class="cat-percent">${percent}%</span>
            <span class="cat-amount">(${formatRupiah(amount)})</span>
          </div>
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width: ${percent}%; background-color: ${cat.color};"></div>
        </div>
      `;
      DOM.categoryLegendList.appendChild(item);
    });
  }

  // --------------------------------------------------------------------------
  // CASHFLOW TREND BAR CHART (Chart.js)
  // --------------------------------------------------------------------------
  function switchChartView(view) {
    activeChartView = view;
    if (view === 'category') {
      if (DOM.tabChartCategory) DOM.tabChartCategory.classList.add('active');
      if (DOM.tabChartTrend) DOM.tabChartTrend.classList.remove('active');
      if (DOM.categoryChartView) DOM.categoryChartView.classList.remove('hidden');
      if (DOM.trendChartView) DOM.trendChartView.classList.add('hidden');
      updateExpenseChart();
    } else {
      if (DOM.tabChartTrend) DOM.tabChartTrend.classList.add('active');
      if (DOM.tabChartCategory) DOM.tabChartCategory.classList.remove('active');
      if (DOM.categoryChartView) DOM.categoryChartView.classList.add('hidden');
      if (DOM.trendChartView) DOM.trendChartView.classList.remove('hidden');
      updateTrendBarChart();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function updateTrendBarChart() {
    if (!DOM.trendBarChartCanvas) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const filtered = getFilteredTransactions();

    // Group income and expense by date
    const dailyMap = {};

    filtered.forEach(tx => {
      if (!tx.date) return;
      if (!dailyMap[tx.date]) {
        dailyMap[tx.date] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        dailyMap[tx.date].income += Number(tx.amount) || 0;
      } else {
        dailyMap[tx.date].expense += Number(tx.amount) || 0;
      }
    });

    const sortedDates = Object.keys(dailyMap).sort(); // chronological ascending
    let labels = [];
    let incomeData = [];
    let expenseData = [];

    if (sortedDates.length === 0) {
      labels = ['Belum ada data'];
      incomeData = [0];
      expenseData = [0];
    } else {
      sortedDates.forEach(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        labels.push(`${d}/${m}`);
        incomeData.push(dailyMap[dateStr].income);
        expenseData.push(dailyMap[dateStr].expense);
      });
    }

    if (trendChartInstance) {
      trendChartInstance.destroy();
    }

    const ctx = DOM.trendBarChartCanvas.getContext('2d');
    trendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Pemasukan (+)',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Pengeluaran (-)',
            data: expenseData,
            backgroundColor: '#f43f5e',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: { size: 11, weight: '600' }
            }
          },
          y: {
            grid: {
              color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: { size: 10 },
              callback: function(value) {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                return value;
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDark ? '#1a233a' : '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${formatRupiah(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // EXPORT TO CSV / EXCEL
  // --------------------------------------------------------------------------
  function exportTransactionsToCSV() {
    const dataToExport = getFilteredTransactions();

    if (!dataToExport || dataToExport.length === 0) {
      showToast('Tidak ada data transaksi pada periode ini untuk diekspor.', 'warning');
      return;
    }

    // Sort ascending by date
    const sorted = [...dataToExport].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // CSV header with UTF-8 BOM (\uFEFF) for seamless Excel support
    let csvContent = '\uFEFFNo,ID Transaksi,Tanggal,Jenis Transaksi,Kategori,Nominal (Rp),Catatan\r\n';

    sorted.forEach((tx, idx) => {
      const cat = CATEGORY_MAP[tx.category] ? CATEGORY_MAP[tx.category].name : (tx.category || '-');
      const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const cleanNote = (tx.note || '').replace(/"/g, '""');
      const amountVal = Number(tx.amount) || 0;

      csvContent += `${idx + 1},"${tx.id}","${tx.date}","${typeLabel}","${cat}",${amountVal},"${cleanNote}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const todayStr = getTodayDateString(0);
    downloadAnchor.href = url;
    downloadAnchor.download = `laporan_keuangan_${currentPeriod}_${todayStr}.csv`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    showToast(`Berhasil mengekspor ${sorted.length} transaksi ke file CSV!`, 'success');
  }

  // --------------------------------------------------------------------------
  // CUSTOM CATEGORIES MANAGEMENT
  // --------------------------------------------------------------------------
  function loadCustomCategories() {
    try {
      const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (data) {
        customCategories = JSON.parse(data);
        customCategories.forEach(cat => {
          if (cat.type === 'income') {
            if (!INCOME_CATEGORIES.some(c => c.id === cat.id)) INCOME_CATEGORIES.push(cat);
          } else {
            if (!EXPENSE_CATEGORIES.some(c => c.id === cat.id)) EXPENSE_CATEGORIES.push(cat);
          }
          CATEGORY_MAP[cat.id] = cat;
        });
        ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
      }
    } catch (e) {
      console.warn('Error loading custom categories', e);
    }
  }

  function saveCustomCategories() {
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
    } catch (e) {
      console.warn('Error saving custom categories', e);
    }
  }

  function openCategoryModal(targetCatIdToEdit = null) {
    if (!DOM.categoryModal) return;
    resetCategoryEditForm();
    renderCustomCategoriesList();

    if (targetCatIdToEdit) {
      editCustomCategory(targetCatIdToEdit);
    }

    DOM.categoryModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      if (DOM.formCatName) DOM.formCatName.focus();
    }, 100);
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function closeCategoryModal() {
    if (!DOM.categoryModal) return;
    DOM.categoryModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    resetCategoryEditForm();
  }

  function resetCategoryEditForm() {
    if (DOM.formCatEditId) DOM.formCatEditId.value = '';
    if (DOM.formCatName) DOM.formCatName.value = '';
    if (DOM.categoryModalTitle) DOM.categoryModalTitle.textContent = 'Kelola & Edit Kategori Kustom';
    if (DOM.categoryModalSubtitle) DOM.categoryModalSubtitle.textContent = 'Buat kategori baru atau perbaiki tulisan jika ada yang salah ketik / typo';
    if (DOM.btnSubmitCatLabel) DOM.btnSubmitCatLabel.textContent = 'Simpan Kategori';
    if (DOM.btnCancelCatEdit) DOM.btnCancelCatEdit.classList.add('hidden');
    if (DOM.categoryForm) DOM.categoryForm.classList.remove('editing-active');
    setCatFormType('expense');
    selectColorDot('#4f46e5');

    if (DOM.customCategoriesList) {
      const allItems = DOM.customCategoriesList.querySelectorAll('.custom-cat-item');
      allItems.forEach(row => row.classList.remove('active-editing'));
    }
  }

  function selectColorDot(colorCode) {
    if (DOM.formCatColor) DOM.formCatColor.value = colorCode;
    if (DOM.colorDots) {
      DOM.colorDots.forEach(dot => {
        if (dot.getAttribute('data-color') === colorCode) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }

  function setCatFormType(type) {
    if (DOM.formCatType) DOM.formCatType.value = type;
    if (type === 'income') {
      if (DOM.btnCatTypeIncome) DOM.btnCatTypeIncome.classList.add('active');
      if (DOM.btnCatTypeExpense) DOM.btnCatTypeExpense.classList.remove('active');
    } else {
      if (DOM.btnCatTypeExpense) DOM.btnCatTypeExpense.classList.add('active');
      if (DOM.btnCatTypeIncome) DOM.btnCatTypeIncome.classList.remove('active');
    }
  }

  function renderCustomCategoriesList() {
    if (!DOM.customCategoriesList) return;
    DOM.customCategoriesList.innerHTML = '';

    if (DOM.customCatCount) {
      DOM.customCatCount.textContent = `${customCategories.length} Kategori`;
    }

    if (customCategories.length === 0) {
      DOM.customCategoriesList.innerHTML = `
        <div class="empty-custom-cat">
          Belum ada kategori kustom. Anda dapat menambahkan kategori baru menggunakan formulir di atas.
        </div>
      `;
      return;
    }

    const currentEditId = DOM.formCatEditId ? DOM.formCatEditId.value : '';

    customCategories.forEach(cat => {
      const isExpense = cat.type === 'expense';
      const item = document.createElement('div');
      item.className = 'custom-cat-item' + (cat.id === currentEditId ? ' active-editing' : '');
      item.setAttribute('data-id', cat.id);
      item.innerHTML = `
        <div class="custom-cat-info">
          <div class="custom-cat-left">
            <span class="custom-cat-color-dot" style="background-color: ${escapeHtml(cat.color || '#4f46e5')};"></span>
            <span class="custom-cat-name" title="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</span>
          </div>
          <span class="custom-cat-type-pill ${isExpense ? 'expense' : 'income'}">
            ${isExpense ? 'Pengeluaran' : 'Pemasukan'}
          </span>
        </div>
        <div class="custom-cat-actions">
          <button type="button" class="btn-cat-action edit-action" title="Ubah tulisan atau perbaiki nama kategori" data-action="edit" data-id="${escapeHtml(cat.id)}">
            <i data-lucide="pencil"></i> Ubah Tulisan
          </button>
          <button type="button" class="btn-cat-action delete-action" title="Hapus kategori kustom ini" data-action="delete" data-id="${escapeHtml(cat.id)}">
            <i data-lucide="trash-2"></i> Hapus
          </button>
        </div>
      `;

      const btnEdit = item.querySelector('[data-action="edit"]');
      const btnDelete = item.querySelector('[data-action="delete"]');

      if (btnEdit) {
        btnEdit.addEventListener('click', () => {
          editCustomCategory(cat.id);
        });
      }

      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          deleteCustomCategory(cat.id);
        });
      }

      DOM.customCategoriesList.appendChild(item);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function editCustomCategory(catId) {
    const cat = customCategories.find(c => c.id === catId);
    if (!cat) return;

    if (DOM.formCatEditId) DOM.formCatEditId.value = cat.id;
    if (DOM.formCatName) {
      DOM.formCatName.value = cat.name;
      DOM.formCatName.focus();
      DOM.formCatName.select();
    }
    setCatFormType(cat.type || 'expense');
    selectColorDot(cat.color || '#4f46e5');

    if (DOM.categoryModalTitle) DOM.categoryModalTitle.textContent = 'Edit Tulisan Kategori';
    if (DOM.categoryModalSubtitle) DOM.categoryModalSubtitle.textContent = `Perbaiki salah ketik untuk kategori "${cat.name}"`;
    if (DOM.btnSubmitCatLabel) DOM.btnSubmitCatLabel.textContent = 'Perbarui Tulisan Kategori';
    if (DOM.btnCancelCatEdit) DOM.btnCancelCatEdit.classList.remove('hidden');
    if (DOM.categoryForm) DOM.categoryForm.classList.add('editing-active');

    // Highlight row in list
    if (DOM.customCategoriesList) {
      const allItems = DOM.customCategoriesList.querySelectorAll('.custom-cat-item');
      allItems.forEach(row => {
        if (row.getAttribute('data-id') === catId) {
          row.classList.add('active-editing');
        } else {
          row.classList.remove('active-editing');
        }
      });
    }

    if (DOM.categoryForm) {
      DOM.categoryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  async function deleteCustomCategory(catId) {
    const cat = customCategories.find(c => c.id === catId);
    if (!cat) return;

    if (!confirm(`Hapus kategori kustom "${cat.name}"?`)) {
      return;
    }

    // Remove from customCategories
    customCategories = customCategories.filter(c => c.id !== catId);
    saveCustomCategories();

    // Remove from runtime arrays
    if (cat.type === 'income') {
      INCOME_CATEGORIES = INCOME_CATEGORIES.filter(c => c.id !== catId);
    } else {
      EXPENSE_CATEGORIES = EXPENSE_CATEGORIES.filter(c => c.id !== catId);
    }
    delete CATEGORY_MAP[catId];
    ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    // Reset edit form if we were editing this item
    if (DOM.formCatEditId && DOM.formCatEditId.value === catId) {
      resetCategoryEditForm();
    }

    // Refresh dropdowns & UI
    const activeFormType = DOM.formTypeInput ? DOM.formTypeInput.value : 'expense';
    populateCategoryDropdown(activeFormType);
    populateRecurringCategoryDropdown();
    renderCustomCategoriesList();
    updateAllViews();
    showToast(`Kategori "${cat.name}" berhasil dihapus.`, 'info');
  }

  async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    if (!DOM.formCatName) return;
    const name = DOM.formCatName.value.trim();
    if (!name) {
      showToast('Harap masukkan nama kategori!', 'danger');
      DOM.formCatName.focus();
      return;
    }

    const type = DOM.formCatType ? DOM.formCatType.value : 'expense';
    const color = DOM.formCatColor ? DOM.formCatColor.value : '#4f46e5';
    const editId = DOM.formCatEditId ? DOM.formCatEditId.value : '';

    if (editId) {
      // MODE EDIT: Perbaiki tulisan kategori yang salah ketik / typo
      const targetCat = customCategories.find(c => c.id === editId);
      if (!targetCat) {
        showToast('Kategori yang ingin diubah tidak ditemukan.', 'danger');
        return;
      }

      const oldName = targetCat.name;
      const oldType = targetCat.type;

      targetCat.name = name;
      targetCat.type = type;
      targetCat.color = color;
      targetCat.bg = color + '22';

      // Update in CATEGORY_MAP
      CATEGORY_MAP[editId] = targetCat;

      // Handle type change if switched
      if (oldType !== type) {
        if (oldType === 'income') {
          INCOME_CATEGORIES = INCOME_CATEGORIES.filter(c => c.id !== editId);
          EXPENSE_CATEGORIES.push(targetCat);
        } else {
          EXPENSE_CATEGORIES = EXPENSE_CATEGORIES.filter(c => c.id !== editId);
          INCOME_CATEGORIES.push(targetCat);
        }
      } else {
        const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        const idx = list.findIndex(c => c.id === editId);
        if (idx !== -1) {
          list[idx] = targetCat;
        }
      }
      ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

      // Save custom categories
      saveCustomCategories();

      // CASCADE UPDATE TRANSACTIONS:
      // If transactions used this category ID or old typo name, update them!
      let txUpdatedCount = 0;
      transactions.forEach(tx => {
        if (tx.category === editId || tx.category === oldName) {
          tx.category = editId;
          txUpdatedCount++;
        }
      });

      if (txUpdatedCount > 0) {
        saveTransactions();
        // If connected to Supabase, update transactions in database as well
        const client = getCloudClient();
        if (client && currentUser && currentUser.id) {
          try {
            await client
              .from('transactions')
              .update({ category: editId })
              .eq('user_id', currentUser.id)
              .or(`category.eq.${editId},category.eq.${oldName}`);
          } catch (err) {
            console.warn('Sync updated category to Supabase error', err);
          }
        }
      }

      // Refresh dropdowns & views
      const activeFormType = DOM.formTypeInput ? DOM.formTypeInput.value : 'expense';
      populateCategoryDropdown(activeFormType);
      if (DOM.formCategory && (activeFormType === type)) {
        DOM.formCategory.value = editId;
      }
      populateRecurringCategoryDropdown();
      resetCategoryEditForm();
      renderCustomCategoriesList();
      updateAllViews();
      showToast(`Tulisan kategori berhasil diperbarui menjadi "${name}"!`, 'success');
      return;
    }

    // MODE CREATE: Buat kategori baru
    const catId = 'custom_' + Date.now();
    const newCat = {
      id: catId,
      name: name,
      icon: type === 'income' ? 'plus-circle' : 'tag',
      color: color,
      bg: color + '22',
      type: type,
      isCustom: true
    };

    customCategories.push(newCat);
    saveCustomCategories();

    if (type === 'income') {
      INCOME_CATEGORIES.push(newCat);
    } else {
      EXPENSE_CATEGORIES.push(newCat);
    }
    CATEGORY_MAP[catId] = newCat;
    ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

    // Refresh dropdowns & views
    const activeFormType = DOM.formTypeInput ? DOM.formTypeInput.value : 'expense';
    populateCategoryDropdown(activeFormType);
    if (activeFormType === type && DOM.formCategory) {
      DOM.formCategory.value = catId;
    }
    populateRecurringCategoryDropdown();
    resetCategoryEditForm();
    renderCustomCategoriesList();
    updateAllViews();
    showToast(`Kategori "${name}" berhasil ditambahkan dan dipilih!`, 'success');
  }

  // --------------------------------------------------------------------------
  // RECURRING TRANSACTIONS / QUICK TEMPLATES
  // --------------------------------------------------------------------------
  function getDefaultRecurringTemplates() {
    return [
      { id: 'rec-1', name: 'Gaji Bulanan', type: 'income', amount: 8500000, category: 'gaji', note: 'Gaji Pokok & Tunjangan Bulanan' },
      { id: 'rec-2', name: 'Sewa Kos / Kontrakan', type: 'expense', amount: 1500000, category: 'tagihan', note: 'Sewa Kos / Kontrakan Bulanan' },
      { id: 'rec-3', name: 'Token Listrik PLN', type: 'expense', amount: 200000, category: 'tagihan', note: 'Beli Token Listrik PLN' },
      { id: 'rec-4', name: 'Paket WiFi / Internet', type: 'expense', amount: 350000, category: 'tagihan', note: 'Tagihan Internet WiFi Rumah' },
      { id: 'rec-5', name: 'Langganan Streaming', type: 'expense', amount: 54000, category: 'hiburan', note: 'Langganan Streaming Film & Musik' },
      { id: 'rec-6', name: 'Belanja Pokok Mingguan', type: 'expense', amount: 350000, category: 'belanja', note: 'Belanja Kebutuhan Pokok Supermarket' }
    ];
  }

  function loadRecurringTemplates() {
    try {
      const saved = localStorage.getItem(RECURRING_STORAGE_KEY);
      if (saved) {
        recurringTemplates = JSON.parse(saved);
      } else {
        recurringTemplates = getDefaultRecurringTemplates();
      }
    } catch (e) {
      recurringTemplates = getDefaultRecurringTemplates();
    }
  }

  function saveRecurringTemplates() {
    try {
      localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(recurringTemplates));
    } catch (e) {
      console.warn('Error saving recurring templates', e);
    }
  }

  function openRecurringModal() {
    if (!DOM.recurringModal) return;
    populateRecurringCategoryDropdown();
    renderRecurringTemplates();
    DOM.recurringModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function closeRecurringModal() {
    if (!DOM.recurringModal) return;
    DOM.recurringModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  function populateRecurringCategoryDropdown() {
    if (!DOM.formRecCategory) return;
    const type = DOM.formRecType ? DOM.formRecType.value : 'expense';
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    DOM.formRecCategory.innerHTML = '';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      DOM.formRecCategory.appendChild(opt);
    });
  }

  function renderRecurringTemplates() {
    if (!DOM.recurringTemplatesList) return;
    DOM.recurringTemplatesList.innerHTML = '';

    if (recurringTemplates.length === 0) {
      DOM.recurringTemplatesList.innerHTML = `
        <div class="empty-custom-cat" style="grid-column: 1 / -1; padding: 1.5rem; text-align: center;">
          Belum ada template transaksi rutin. Anda dapat menambahkannya pada formulir di bawah.
        </div>
      `;
      return;
    }

    recurringTemplates.forEach(tpl => {
      const cat = CATEGORY_MAP[tpl.category] || { name: 'Lainnya', color: '#64748b', bg: '#f1f5f9', icon: 'receipt' };
      const isIncome = tpl.type === 'income';

      const card = document.createElement('div');
      card.className = 'recurring-card';
      card.innerHTML = `
        <div class="recurring-card-header">
          <div class="recurring-header-left">
            <span class="recurring-category-badge" style="background-color: ${cat.bg}; color: ${cat.color};">
              ${escapeHtml(cat.name)}
            </span>
            <span class="recurring-type-badge ${isIncome ? 'income' : 'expense'}">
              ${isIncome ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
            </span>
          </div>
          <button type="button" class="recurring-btn-del" data-id="${tpl.id}" title="Hapus template rutin">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
        <div class="recurring-card-body">
          <div class="recurring-card-title">${escapeHtml(tpl.name || tpl.note)}</div>
          <div class="recurring-card-amount ${isIncome ? 'income' : 'expense'}">
            ${isIncome ? '+' : '-'} ${formatRupiah(tpl.amount)}
          </div>
        </div>
        <button type="button" class="recurring-btn-quick ${isIncome ? 'income-btn' : 'expense-btn'}" data-id="${tpl.id}">
          <i data-lucide="zap"></i>
          <span>Catat Langsung Sekarang</span>
        </button>
      `;

      const btnQuick = card.querySelector('.recurring-btn-quick');
      btnQuick.addEventListener('click', () => {
        recordRecurringTransaction(tpl);
      });

      const btnDel = card.querySelector('.recurring-btn-del');
      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteRecurringTemplate(tpl.id);
        });
      }

      DOM.recurringTemplatesList.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function deleteRecurringTemplate(tplId) {
    const tpl = recurringTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    if (confirm(`Hapus template transaksi rutin "${tpl.name || tpl.note}"?`)) {
      recurringTemplates = recurringTemplates.filter(t => t.id !== tplId);
      saveRecurringTemplates();
      renderRecurringTemplates();
      showToast(`Template "${tpl.name || tpl.note}" berhasil dihapus.`, 'info');
    }
  }

  async function recordRecurringTransaction(tpl) {
    const today = getTodayDateString(0);
    const client = getCloudClient();

    if (client && currentUser && currentUser.id) {
      try {
        const { data, error } = await client
          .from('transactions')
          .insert([{
            type: tpl.type,
            amount: tpl.amount,
            category: tpl.category,
            date: today,
            note: tpl.note || tpl.name
          }])
          .select();

        if (error) {
          showToast('Gagal mencatat transaksi rutin di Supabase: ' + error.message, 'danger');
          return;
        }

        if (data && data[0]) {
          const inserted = data[0];
          transactions.unshift({
            id: inserted.id,
            type: inserted.type,
            amount: Number(inserted.amount),
            category: inserted.category,
            date: inserted.date,
            note: inserted.note || '',
            createdAt: inserted.created_at ? new Date(inserted.created_at).getTime() : Date.now()
          });
          saveTransactions();
          updateAllViews();
          closeRecurringModal();
          showToast(`Transaksi rutin "${tpl.name}" senilai ${formatRupiah(tpl.amount)} berhasil dicatat hari ini!`, 'success');
          return;
        }
      } catch (err) {
        console.error('Error insert recurring to Supabase', err);
      }
    }

    // Local fallback
    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: tpl.type,
      amount: tpl.amount,
      category: tpl.category,
      date: today,
      note: tpl.note || tpl.name,
      createdAt: Date.now()
    };

    transactions.unshift(newTx);
    saveTransactions();
    updateAllViews();
    closeRecurringModal();
    showToast(`Transaksi rutin "${tpl.name}" senilai ${formatRupiah(tpl.amount)} berhasil dicatat hari ini!`, 'success');
  }

  function handleRecurringFormSubmit(e) {
    e.preventDefault();
    const type = DOM.formRecType ? DOM.formRecType.value : 'expense';
    const category = DOM.formRecCategory ? DOM.formRecCategory.value : 'tagihan';
    const note = DOM.formRecNote ? DOM.formRecNote.value.trim() : '';
    const rawAmount = DOM.formRecAmount ? cleanNumericInput(DOM.formRecAmount.value) : '';

    if (!note) {
      showToast('Harap masukkan nama transaksi!', 'danger');
      if (DOM.formRecNote) DOM.formRecNote.focus();
      return;
    }

    if (!rawAmount || Number(rawAmount) <= 0) {
      showToast('Harap masukkan nominal transaksi yang valid!', 'danger');
      if (DOM.formRecAmount) DOM.formRecAmount.focus();
      return;
    }

    const newTemplate = {
      id: 'rec-' + Date.now(),
      name: note,
      type: type,
      amount: parseInt(rawAmount, 10),
      category: category,
      note: note
    };

    recurringTemplates.push(newTemplate);
    saveRecurringTemplates();
    renderRecurringTemplates();

    if (DOM.formRecNote) DOM.formRecNote.value = '';
    if (DOM.formRecAmount) DOM.formRecAmount.value = '';
    showToast(`Template rutin "${note}" berhasil disimpan!`, 'success');
  }

  // --------------------------------------------------------------------------
  // MONTHLY BUDGET LOGIC & MODAL
  // --------------------------------------------------------------------------
  function updateBudgetCard() {
    if (!DOM.budgetSpentAmount) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Akumulasi pengeluaran pada bulan kalender berjalan
    let monthExpense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'expense' && tx.date) {
        const [y, m] = tx.date.split('-').map(Number);
        if (y === currentYear && (m - 1) === currentMonth) {
          monthExpense += Number(tx.amount) || 0;
        }
      }
    });

    DOM.budgetSpentAmount.textContent = formatRupiah(monthExpense);
    if (DOM.budgetLimitAmount) {
      DOM.budgetLimitAmount.textContent = formatRupiah(monthlyBudgetLimit);
    }

    const pct = monthlyBudgetLimit > 0 ? Math.round((monthExpense / monthlyBudgetLimit) * 100) : 0;
    const barWidth = Math.min(100, Math.max(0, pct));

    if (DOM.budgetProgressBar) {
      DOM.budgetProgressBar.style.width = `${barWidth}%`;
      DOM.budgetProgressBar.classList.remove('warning', 'danger');
      if (pct >= 90) {
        DOM.budgetProgressBar.classList.add('danger');
      } else if (pct >= 70) {
        DOM.budgetProgressBar.classList.add('warning');
      }
    }

    if (DOM.budgetPercentBadge) {
      DOM.budgetPercentBadge.textContent = `${pct}%`;
      DOM.budgetPercentBadge.classList.remove('warning', 'danger');
      if (pct >= 90) {
        DOM.budgetPercentBadge.classList.add('danger');
      } else if (pct >= 70) {
        DOM.budgetPercentBadge.classList.add('warning');
      }
    }

    if (DOM.budgetRemainingText) {
      if (monthlyBudgetLimit >= monthExpense) {
        DOM.budgetRemainingText.textContent = `Sisa: ${formatRupiah(monthlyBudgetLimit - monthExpense)}`;
        DOM.budgetRemainingText.style.color = '';
      } else {
        DOM.budgetRemainingText.textContent = `Lebih: ${formatRupiah(monthExpense - monthlyBudgetLimit)}`;
        DOM.budgetRemainingText.style.color = 'var(--expense-600)';
      }
    }
  }

  function openBudgetModal() {
    if (!DOM.budgetModal) return;
    if (DOM.formBudgetAmount) {
      DOM.formBudgetAmount.value = new Intl.NumberFormat('id-ID').format(monthlyBudgetLimit);
    }
    if (DOM.budgetAmountHint) {
      DOM.budgetAmountHint.textContent = `Batas: ${formatRupiah(monthlyBudgetLimit)}`;
    }
    DOM.budgetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (DOM.formBudgetAmount) DOM.formBudgetAmount.focus();
    }, 100);
  }

  function closeBudgetModal() {
    if (!DOM.budgetModal) return;
    DOM.budgetModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function handleBudgetAmountInput(e) {
    const rawVal = cleanNumericInput(e.target.value);
    if (!rawVal) {
      e.target.value = '';
      if (DOM.budgetAmountHint) {
        DOM.budgetAmountHint.textContent = 'Masukkan batas anggaran bulanan';
      }
      return;
    }
    const num = parseInt(rawVal, 10);
    e.target.value = new Intl.NumberFormat('id-ID').format(num);
    if (DOM.budgetAmountHint) {
      DOM.budgetAmountHint.textContent = `Batas: ${formatRupiah(num)}`;
    }
  }

  function handleBudgetFormSubmit(e) {
    e.preventDefault();
    if (!DOM.formBudgetAmount) return;
    const rawVal = cleanNumericInput(DOM.formBudgetAmount.value);
    if (!rawVal || Number(rawVal) <= 0) {
      showToast('Harap masukkan batas anggaran yang valid!', 'danger');
      DOM.formBudgetAmount.focus();
      return;
    }

    const newLimit = parseInt(rawVal, 10);
    monthlyBudgetLimit = newLimit;
    try {
      localStorage.setItem(BUDGET_KEY, String(newLimit));
    } catch (err) {
      console.warn('Gagal menyimpan batas anggaran ke localStorage', err);
    }

    updateBudgetCard();
    closeBudgetModal();
    showToast(`Batas anggaran berhasil diubah menjadi ${formatRupiah(newLimit)}!`, 'success');
  }

  // --------------------------------------------------------------------------
  // MODAL & TRANSACTION OPERATIONS
  // --------------------------------------------------------------------------
  function openModal(defaultType = 'expense') {
    if (DOM.formEditId) DOM.formEditId.value = '';
    if (DOM.modalTitle) DOM.modalTitle.textContent = 'Tambah Catatan Transaksi';
    if (DOM.btnSubmitLabel) DOM.btnSubmitLabel.textContent = 'Simpan Catatan';

    setFormType(defaultType);
    DOM.formDate.value = getTodayDateString(0);
    DOM.formAmount.value = '';
    DOM.formNote.value = '';
    DOM.amountHint.textContent = 'Masukkan jumlah nominal transaksi';
    DOM.amountHint.style.color = '';

    DOM.transactionModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Auto-focus amount
    setTimeout(() => {
      DOM.formAmount.focus();
    }, 100);
  }

  function openEditModal(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (DOM.formEditId) DOM.formEditId.value = tx.id;
    if (DOM.modalTitle) DOM.modalTitle.textContent = 'Edit Catatan Transaksi';
    if (DOM.btnSubmitLabel) DOM.btnSubmitLabel.textContent = 'Perbarui Catatan';

    setFormType(tx.type);
    DOM.formAmount.value = new Intl.NumberFormat('id-ID').format(tx.amount);
    DOM.amountHint.textContent = `Nominal: ${formatRupiah(tx.amount)}`;
    DOM.amountHint.style.color = 'var(--primary-600)';

    DOM.formCategory.value = tx.category;
    DOM.formDate.value = tx.date;
    DOM.formNote.value = tx.note || '';

    DOM.transactionModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      DOM.formAmount.focus();
    }, 100);
  }

  function closeModal() {
    DOM.transactionModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function setFormType(type) {
    DOM.formTypeInput.value = type;

    if (type === 'expense') {
      DOM.btnTypeExpense.classList.add('active');
      DOM.btnTypeIncome.classList.remove('active');
    } else {
      DOM.btnTypeIncome.classList.add('active');
      DOM.btnTypeExpense.classList.remove('active');
    }

    populateCategoryDropdown(type);
  }

  function handleAmountInput(e) {
    const rawVal = cleanNumericInput(e.target.value);
    if (!rawVal) {
      e.target.value = '';
      DOM.amountHint.textContent = 'Masukkan jumlah nominal transaksi';
      DOM.amountHint.style.color = '';
      return;
    }

    const num = parseInt(rawVal, 10);
    e.target.value = new Intl.NumberFormat('id-ID').format(num);

    // Spell out nominal in Rupiah for extra user delight
    DOM.amountHint.textContent = `Nominal: ${formatRupiah(num)}`;
    DOM.amountHint.style.color = 'var(--primary-600)';
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const type = DOM.formTypeInput.value;
    const rawAmount = cleanNumericInput(DOM.formAmount.value);
    const category = DOM.formCategory.value;
    const date = DOM.formDate.value;
    const note = DOM.formNote.value.trim();
    const editId = DOM.formEditId ? DOM.formEditId.value : '';

    // Validation
    if (!rawAmount || Number(rawAmount) <= 0) {
      DOM.formAmount.focus();
      showToast('Harap masukkan nominal transaksi yang valid!', 'danger');
      return;
    }

    if (!category) {
      DOM.formCategory.focus();
      showToast('Pilih kategori transaksi!', 'danger');
      return;
    }

    if (!date) {
      DOM.formDate.focus();
      showToast('Pilih tanggal transaksi!', 'danger');
      return;
    }

    if (!note) {
      DOM.formNote.focus();
      showToast('Berikan catatan singkat transaksi!', 'danger');
      return;
    }

    const numericAmount = parseInt(rawAmount, 10);
    const client = getCloudClient();

    // ==========================================
    // CASE 1: EDIT / PERBARUI TRANSAKSI
    // ==========================================
    if (editId) {
      if (client && currentUser && currentUser.id) {
        try {
          const { error } = await client
            .from('transactions')
            .update({
              type: type,
              amount: numericAmount,
              category: category,
              date: date,
              note: note
            })
            .eq('id', editId);

          if (error) {
            console.error('[Supabase Update Error]', error);
            showToast('Gagal memperbarui di Supabase: ' + error.message, 'danger');
            return;
          }
        } catch (err) {
          console.error('Error update transaction', err);
        }
      }

      // Update di array lokal
      const idx = transactions.findIndex(t => t.id === editId);
      if (idx !== -1) {
        transactions[idx] = {
          ...transactions[idx],
          type: type,
          amount: numericAmount,
          category: category,
          date: date,
          note: note
        };
      }
      saveTransactions();
      updateAllViews();
      closeModal();
      showToast('Catatan transaksi berhasil diperbarui!', 'success');
      return;
    }

    // ==========================================
    // CASE 2: TAMBAH CATATAN BARU
    // ==========================================
    // Jika pengguna login dengan akun Supabase, simpan langsung ke database cloud
    if (client && currentUser && currentUser.id) {
      try {
        const { data, error } = await client
          .from('transactions')
          .insert([{
            type: type,
            amount: numericAmount,
            category: category,
            date: date,
            note: note
          }])
          .select();

        if (error) {
          console.error('[Supabase Insert Error]', error);
          showToast('Gagal simpan ke Supabase: ' + error.message, 'danger');
          return;
        }

        if (data && data[0]) {
          const inserted = data[0];
          transactions.unshift({
            id: inserted.id,
            type: inserted.type,
            amount: Number(inserted.amount),
            category: inserted.category,
            date: inserted.date,
            note: inserted.note || '',
            createdAt: inserted.created_at ? new Date(inserted.created_at).getTime() : Date.now()
          });
          saveTransactions();
          updateAllViews();
          closeModal();
          const typeLabel = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
          showToast(`${typeLabel} "${note}" tersimpan di cloud Supabase!`, 'success');
          return;
        }
      } catch (err) {
        console.error('Error insert transaction', err);
      }
    }

    // Fallback simpan lokal jika belum terhubung
    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: type,
      amount: numericAmount,
      category: category,
      date: date,
      note: note,
      createdAt: Date.now()
    };

    transactions.unshift(newTx);
    saveTransactions();
    updateAllViews();

    closeModal();
    const typeLabel = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    showToast(`${typeLabel} "${note}" berhasil dicatat!`, 'success');
  }

  async function deleteTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (confirm(`Hapus catatan "${tx.note}" senilai ${formatRupiah(tx.amount)}?`)) {
      const client = getCloudClient();
      if (client && currentUser && currentUser.id) {
        try {
          const { error } = await client
            .from('transactions')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('[Supabase Delete Error]', error);
            showToast('Gagal menghapus dari Supabase: ' + error.message, 'danger');
            return;
          }
        } catch (err) {
          console.error('Error delete transaction', err);
        }
      }

      transactions = transactions.filter(t => t.id !== id);
      saveTransactions();
      updateAllViews();
      showToast('Catatan transaksi berhasil dihapus.', 'info');
    }
  }

  // --------------------------------------------------------------------------
  // MASTER RE-RENDER
  // --------------------------------------------------------------------------
  function updateAllViews() {
    updatePeriodStatusLabel();
    updateDashboardMetrics();
    renderDailyFeed();
    if (activeChartView === 'trend') {
      updateTrendBarChart();
    } else {
      updateExpenseChart();
    }
    updateBudgetCard();
  }

  // --------------------------------------------------------------------------
  // SUPABASE AUTHENTICATION SYSTEM
  // --------------------------------------------------------------------------
  const USER_SESSION_CACHE = 'daily_financial_diary_active_user_v1';

  function translateSupabaseError(msg) {
    if (!msg) return 'Terjadi kesalahan autentikasi.';
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'Email atau kata sandi yang Anda masukkan salah. Jika belum punya akun, klik tab "Daftar (Sign Up)".';
    }
    if (lower.includes('user already registered')) {
      return 'Email ini sudah terdaftar di Supabase. Silakan gunakan tab Masuk (Login).';
    }
    if (lower.includes('password should be at least')) {
      return 'Kata sandi harus minimal 6 karakter.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Email sudah terdaftar, tetapi memerlukan verifikasi email di Supabase Anda.';
    }
    if (lower.includes('email address') && lower.includes('invalid')) {
      return 'Format alamat email tidak diterima oleh Supabase. Gunakan domain email standar (misal: @gmail.com, @yahoo.com).';
    }
    if (lower.includes('email rate limit')) {
      return 'Batas kirim email Supabase (paket gratis) sudah habis. Matikan "Confirm email" di Supabase: Authentication → Sign In / Providers → Email, lalu coba daftar lagi.';
    }
    if (lower.includes('rate limit')) {
      return 'Terlalu banyak percobaan. Harap tunggu beberapa menit lagi.';
    }
    return msg;
  }

  function setAuthMode(mode) {
    authMode = mode;
    hideAuthAlert();

    if (mode === 'login') {
      DOM.tabAuthLogin.classList.add('active');
      DOM.tabAuthRegister.classList.remove('active');
      if (DOM.groupAuthPassword) DOM.groupAuthPassword.classList.remove('hidden');
      if (DOM.groupConfirmPassword) DOM.groupConfirmPassword.classList.add('hidden');
      if (DOM.authSubmitText) DOM.authSubmitText.textContent = 'Masuk ke Diary';
      if (DOM.authFooterText) {
        DOM.authFooterText.classList.remove('hidden');
        DOM.authFooterText.innerHTML = 'Belum punya akun? <a href="#" id="link-switch-to-register">Daftar sekarang</a>';
      }
      if (DOM.authBackToLogin) DOM.authBackToLogin.classList.add('hidden');
    } else if (mode === 'register') {
      DOM.tabAuthRegister.classList.add('active');
      DOM.tabAuthLogin.classList.remove('active');
      if (DOM.groupAuthPassword) DOM.groupAuthPassword.classList.remove('hidden');
      if (DOM.groupConfirmPassword) DOM.groupConfirmPassword.classList.remove('hidden');
      if (DOM.authSubmitText) DOM.authSubmitText.textContent = 'Daftar Akun Baru';
      if (DOM.authFooterText) {
        DOM.authFooterText.classList.remove('hidden');
        DOM.authFooterText.innerHTML = 'Sudah memiliki akun? <a href="#" id="link-switch-to-login">Masuk sekarang</a>';
      }
      if (DOM.authBackToLogin) DOM.authBackToLogin.classList.add('hidden');
    } else if (mode === 'forgot') {
      DOM.tabAuthLogin.classList.remove('active');
      DOM.tabAuthRegister.classList.remove('active');
      if (DOM.groupAuthPassword) DOM.groupAuthPassword.classList.add('hidden');
      if (DOM.groupConfirmPassword) DOM.groupConfirmPassword.classList.add('hidden');
      if (DOM.authSubmitText) DOM.authSubmitText.textContent = 'Kirim Tautan Pemulihan';
      if (DOM.authFooterText) DOM.authFooterText.classList.add('hidden');
      if (DOM.authBackToLogin) DOM.authBackToLogin.classList.remove('hidden');
      showAuthAlert('Masukkan alamat email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.', 'info');
    }

    // Bind link clicks
    const registerLink = document.getElementById('link-switch-to-register');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        setAuthMode('register');
      });
    }

    const loginLink = document.getElementById('link-switch-to-login');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        setAuthMode('login');
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function showAuthAlert(message, type = 'danger') {
    DOM.authAlert.className = `auth-alert ${type}`;
    DOM.authAlertText.textContent = message;

    let iconName = 'alert-triangle';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'warning') iconName = 'alert-circle';
    if (type === 'info') iconName = 'info';

    DOM.authAlertIcon.setAttribute('data-lucide', iconName);
    DOM.authAlert.classList.remove('hidden');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function hideAuthAlert() {
    DOM.authAlert.classList.add('hidden');
    const bypassBtn = document.getElementById('btn-instant-enter');
    if (bypassBtn) bypassBtn.remove();
  }

  function renderInstantBypassButton(email) {
    const existingBtn = document.getElementById('btn-instant-enter');
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btn-instant-enter';
    btn.className = 'btn btn-primary';
    btn.style.marginTop = '0.65rem';
    btn.style.width = '100%';
    btn.innerHTML = `<i data-lucide="check-circle-2"></i><span>Lanjutkan Masuk Sebagai ${escapeHtml(email)}</span>`;
    
    btn.onclick = () => {
      const userObj = { id: 'user-' + Date.now(), email: email };
      saveUserSession(userObj);
      setAuthenticatedView(userObj);
      showToast(`Selamat datang di Diary, ${email}!`, 'success');
    };

    DOM.authAlert.appendChild(btn);
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setAuthLoading(isLoading) {
    DOM.btnAuthSubmit.disabled = isLoading;
    if (isLoading) {
      DOM.authSpinner.classList.remove('hidden');
      DOM.authSubmitIcon.classList.add('hidden');
    } else {
      DOM.authSpinner.classList.add('hidden');
      DOM.authSubmitIcon.classList.remove('hidden');
    }
  }

  function saveUserSession(user) {
    try {
      localStorage.setItem(USER_SESSION_CACHE, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user session cache', e);
    }
  }

  function clearUserSession() {
    try {
      localStorage.removeItem(USER_SESSION_CACHE);
    } catch (e) {}
  }

  function getCachedUserSession() {
    try {
      const data = localStorage.getItem(USER_SESSION_CACHE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  async function setAuthenticatedView(user) {
    currentUser = user;
    DOM.authScreen.classList.add('hidden');
    DOM.appLayout.classList.remove('hidden');
    DOM.userEmailDisplay.textContent = user.email || 'Pengguna';
    
    // Tarik data transaksi pengguna dari database cloud Supabase
    await fetchTransactions();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setUnauthenticatedView() {
    currentUser = null;
    clearUserSession();
    transactions = [];
    updateAllViews();
    DOM.appLayout.classList.add('hidden');
    DOM.authScreen.classList.remove('hidden');
    hideAuthAlert();
    DOM.authForm.reset();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    hideAuthAlert();

    const email = DOM.authEmail.value.trim();
    const password = DOM.authPassword.value;

    // Basic Validation
    if (!email || !email.includes('@')) {
      showAuthAlert('Masukkan format alamat email yang valid (contoh: user@gmail.com)!', 'danger');
      DOM.authEmail.focus();
      return;
    }

    if (authMode !== 'forgot') {
      if (!password || password.length < 6) {
        showAuthAlert('Kata sandi harus minimal 6 karakter!', 'danger');
        DOM.authPassword.focus();
        return;
      }

      if (authMode === 'register') {
        const confirmPassword = DOM.authConfirmPassword.value;
        if (password !== confirmPassword) {
          showAuthAlert('Konfirmasi kata sandi tidak cocok!', 'danger');
          DOM.authConfirmPassword.focus();
          return;
        }
      }
    }

    // Pastikan client Supabase siap
    let client = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (!client && window.ensureSupabaseLoaded) {
      setAuthLoading(true);
      client = await window.ensureSupabaseLoaded();
      setAuthLoading(false);
    }

    if (!client) {
      showAuthAlert(
        'Koneksi Supabase belum siap dimuat dari jaringan. Anda dapat menekan tombol "Coba Mode Demo" untuk langsung masuk.',
        'warning'
      );
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'forgot') {
        // ==========================================
        // RESET PASSWORD VIA SUPABASE
        // ==========================================
        console.log('[Supabase Auth] Mengirim link pemulihan kata sandi untuk:', email);
        const redirectToUrl = window.location.href.split('#')[0];
        const { data, error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: redirectToUrl
        });

        if (error) {
          console.warn('[Supabase Forgot Password Error]', error);
          showAuthAlert(translateSupabaseError(error.message), 'danger');
        } else {
          showAuthAlert(`Tautan pemulihan kata sandi telah dikirim ke "${email}". Silakan periksa inbox email atau folder spam Anda.`, 'success');
          showToast('Tautan pemulihan kata sandi berhasil dikirim!', 'success');
        }
      } else if (authMode === 'login') {
        console.log('[Supabase Auth] Memulai proses login untuk:', email);
        const { data, error } = await client.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          console.warn('[Supabase Login Error]', error);
          
          // Kasus khusus: Akun sudah terdaftar tapi verifikasi email aktif di Supabase
          if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
            showAuthAlert(
              `Akun "${email}" telah terdaftar di Supabase! Karena verifikasi email aktif di dashboard Supabase Anda, Anda dapat langsung masuk ke dashboard dengan tombol di bawah:`,
              'warning'
            );
            renderInstantBypassButton(email);
            return;
          }

          showAuthAlert(translateSupabaseError(error.message), 'danger');
        } else if (data && data.user) {
          saveUserSession(data.user);
          setAuthenticatedView(data.user);
          showToast(`Selamat datang kembali, ${data.user.email}!`, 'success');
        }
      } else {
        // ==========================================
        // DAFTAR AKUN BARU VIA SUPABASE
        // ==========================================
        console.log('[Supabase Auth] Memulai pendaftaran akun untuk:', email);
        const { data, error } = await client.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          console.warn('[Supabase SignUp Error]', error);

          // Kasus: Email sudah pernah terdaftar
          if (error.message && error.message.toLowerCase().includes('already registered')) {
            showAuthAlert(
              `Email ${email} sudah terdaftar di Supabase! Mengalihkan ke tab Masuk...`,
              'info'
            );
            setTimeout(() => {
              setAuthMode('login');
              DOM.authEmail.value = email;
              DOM.authPassword.focus();
            }, 1200);
            return;
          }

          showAuthAlert(translateSupabaseError(error.message), 'danger');
        } else if (data && data.user) {
          // Pendaftaran akun berhasil dibuat di database Supabase!
          console.log('[Supabase SignUp Success]', data.user);
          saveUserSession(data.user);
          setAuthenticatedView(data.user);
          showToast(`Pendaftaran akun berhasil! Selamat datang, ${data.user.email}!`, 'success');
        }
      }
    } catch (err) {
      console.error('[Auth Exception]', err);
      showAuthAlert('Terjadi kendala jaringan saat menghubungi server Supabase: ' + err.message, 'danger');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (!confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
      return;
    }

    try {
      const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
      if (client) {
        await client.auth.signOut();
      }
    } catch (err) {
      console.warn('[Logout Warning]', err);
    }

    setUnauthenticatedView();
    showToast('Anda telah keluar dari aplikasi.', 'info');
  }

  function handleDemoBypass() {
    const demoUser = {
      id: 'demo-user-1',
      email: 'demo@financialdiary.local'
    };
    saveUserSession(demoUser);
    setAuthenticatedView(demoUser);
    showToast('Berhasil masuk dalam Mode Demo. Selamat menjelajah!', 'info');
  }

  function handleTogglePassword() {
    const isPassword = DOM.authPassword.type === 'password';
    DOM.authPassword.type = isPassword ? 'text' : 'password';
    if (DOM.authConfirmPassword) {
      DOM.authConfirmPassword.type = isPassword ? 'text' : 'password';
    }
    DOM.eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --------------------------------------------------------------------------
  // PASSWORD RECOVERY / RESET MODAL HANDLERS (Step 4)
  // --------------------------------------------------------------------------
  function openResetPasswordModal() {
    if (DOM.resetPasswordModal) {
      DOM.resetPasswordModal.classList.remove('hidden');
      if (DOM.formNewPassword) {
        DOM.formNewPassword.value = '';
        DOM.formNewPassword.focus();
      }
      if (DOM.formConfirmNewPassword) {
        DOM.formConfirmNewPassword.value = '';
      }
    }
  }

  function closeResetPasswordModal() {
    if (DOM.resetPasswordModal) {
      DOM.resetPasswordModal.classList.add('hidden');
    }
  }

  async function handleNewPasswordSubmit(e) {
    e.preventDefault();
    const newPass = DOM.formNewPassword ? DOM.formNewPassword.value : '';
    const confirmPass = DOM.formConfirmNewPassword ? DOM.formConfirmNewPassword.value : '';

    if (!newPass || newPass.length < 6) {
      showToast('Kata sandi baru harus minimal 6 karakter!', 'danger');
      if (DOM.formNewPassword) DOM.formNewPassword.focus();
      return;
    }

    if (newPass !== confirmPass) {
      showToast('Konfirmasi kata sandi baru tidak cocok!', 'danger');
      if (DOM.formConfirmNewPassword) DOM.formConfirmNewPassword.focus();
      return;
    }

    let client = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (!client && window.ensureSupabaseLoaded) {
      client = await window.ensureSupabaseLoaded();
    }

    if (!client) {
      showToast('Koneksi Supabase belum siap dimuat.', 'danger');
      return;
    }

    if (DOM.btnSubmitNewPassword) DOM.btnSubmitNewPassword.disabled = true;

    try {
      console.log('[Supabase Auth] Memperbarui kata sandi baru...');
      const { data, error } = await client.auth.updateUser({ password: newPass });

      if (error) {
        console.warn('[Supabase Reset Password Error]', error);
        showToast('Gagal mengubah kata sandi: ' + translateSupabaseError(error.message), 'danger');
      } else {
        closeResetPasswordModal();
        showToast('Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru Anda.', 'success');
        if (data && data.user) {
          saveUserSession(data.user);
          setAuthenticatedView(data.user);
        }
      }
    } catch (err) {
      showToast('Terjadi kesalahan: ' + err.message, 'danger');
    } finally {
      if (DOM.btnSubmitNewPassword) DOM.btnSubmitNewPassword.disabled = false;
    }
  }

  // --------------------------------------------------------------------------
  // PWA (PROGRESSIVE WEB APP) & NETWORK CONNECTIVITY (Step 4)
  // --------------------------------------------------------------------------
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker aktif terdaftar dengan scope:', registration.scope);
            registration.update();
          })
          .catch((err) => {
            console.warn('[PWA] Pendaftaran Service Worker gagal:', err);
          });
      });
    }
  }

  function setupPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      if (DOM.btnInstallPwa) {
        DOM.btnInstallPwa.classList.remove('hidden');
      }
    });

    if (DOM.btnInstallPwa) {
      DOM.btnInstallPwa.addEventListener('click', async () => {
        if (!deferredPwaPrompt) return;
        deferredPwaPrompt.prompt();
        const choice = await deferredPwaPrompt.userChoice;
        console.log('[PWA] Pilihan instalasi pengguna:', choice.outcome);
        deferredPwaPrompt = null;
        DOM.btnInstallPwa.classList.add('hidden');
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Aplikasi berhasil dipasang ke perangkat!');
      if (DOM.btnInstallPwa) {
        DOM.btnInstallPwa.classList.add('hidden');
      }
      showToast('Aplikasi Daily Financial Diary berhasil dipasang!', 'success');
    });
  }

  function setupNetworkStatus() {
    function updateOnlineBadge() {
      if (DOM.offlineBadge) {
        if (navigator.onLine) {
          DOM.offlineBadge.classList.add('hidden');
        } else {
          DOM.offlineBadge.classList.remove('hidden');
          showToast('Koneksi internet terputus. Mode offline aktif.', 'warning');
        }
      }
    }

    window.addEventListener('online', () => {
      updateOnlineBadge();
      showToast('Koneksi internet terhubung kembali.', 'success');
    });

    window.addEventListener('offline', updateOnlineBadge);
    updateOnlineBadge();
  }

  async function initSupabaseAuth() {
    // Periksa status konfigurasi
    const isConfigured = window.isSupabaseConfigured && window.isSupabaseConfigured();
    if (!isConfigured) {
      DOM.supabaseConfigWarning.classList.remove('hidden');
    } else {
      DOM.supabaseConfigWarning.classList.add('hidden');
    }

    // Ambil client Supabase
    let client = window.getSupabaseClient ? window.getSupabaseClient() : null;
    if (!client && window.ensureSupabaseLoaded) {
      client = await window.ensureSupabaseLoaded();
    }

    if (client && isConfigured) {
      try {
        // Pasang listener status sesi auth
        client.auth.onAuthStateChange((event, session) => {
          console.log('[Supabase Auth Event]', event, session);
          if (event === 'PASSWORD_RECOVERY') {
            console.log('[Supabase Auth] Sesi pemulihan kata sandi aktif.');
            openResetPasswordModal();
          } else if (session && session.user) {
            saveUserSession(session.user);
            setAuthenticatedView(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUnauthenticatedView();
          }
        });

        // Deteksi pemulihan kata sandi dari token hash di URL
        if (window.location.hash && (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token='))) {
          setTimeout(() => {
            openResetPasswordModal();
          }, 300);
        }

        // Periksa sesi aktif Supabase
        const { data, error } = await client.auth.getSession();
        if (data && data.session && data.session.user) {
          saveUserSession(data.session.user);
          setAuthenticatedView(data.session.user);
          showToast(`Sesi aktif: ${data.session.user.email}`, 'info');
          return;
        }
      } catch (err) {
        console.warn('[Supabase Session Check Error]', err);
      }
    }

    // Cek cache sesi lokal pengguna
    const cachedUser = getCachedUserSession();
    if (cachedUser) {
      setAuthenticatedView(cachedUser);
      return;
    }

    // Default ke tampilan login
    setUnauthenticatedView();
  }

  // --------------------------------------------------------------------------
  // EVENT LISTENERS SETUP
  // --------------------------------------------------------------------------
  function setupAuthEventListeners() {
    if (DOM.tabAuthLogin) DOM.tabAuthLogin.addEventListener('click', () => setAuthMode('login'));
    if (DOM.tabAuthRegister) DOM.tabAuthRegister.addEventListener('click', () => setAuthMode('register'));
    if (DOM.authForm) DOM.authForm.addEventListener('submit', handleAuthSubmit);
    if (DOM.btnLogout) DOM.btnLogout.addEventListener('click', handleLogout);
    if (DOM.btnTogglePassword) DOM.btnTogglePassword.addEventListener('click', handleTogglePassword);
    if (DOM.btnBypassDemo) DOM.btnBypassDemo.addEventListener('click', handleDemoBypass);

    // Link Lupa Kata Sandi & Kembali ke Masuk (Step 4)
    if (DOM.linkForgotPassword) {
      DOM.linkForgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        setAuthMode('forgot');
      });
    }

    if (DOM.linkBackToLogin) {
      DOM.linkBackToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        setAuthMode('login');
      });
    }

    // Modal Reset Password Events (Step 4)
    if (DOM.btnCloseResetModal) {
      DOM.btnCloseResetModal.addEventListener('click', closeResetPasswordModal);
    }
    if (DOM.newPasswordForm) {
      DOM.newPasswordForm.addEventListener('submit', handleNewPasswordSubmit);
    }

    if (DOM.resetPasswordModal) {
      DOM.resetPasswordModal.addEventListener('click', (e) => {
        if (e.target === DOM.resetPasswordModal) {
          closeResetPasswordModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.resetPasswordModal && !DOM.resetPasswordModal.classList.contains('hidden')) {
        closeResetPasswordModal();
      }
    });

    const initialRegisterLink = document.getElementById('link-switch-to-register');
    if (initialRegisterLink) {
      initialRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        setAuthMode('register');
      });
    }
  }

  function setupEventListeners() {
    // Open Modal
    if (DOM.btnOpenModal) DOM.btnOpenModal.addEventListener('click', () => openModal('expense'));
    if (DOM.btnEmptyAdd) DOM.btnEmptyAdd.addEventListener('click', () => openModal('expense'));

    // Close Modal
    if (DOM.btnCloseModal) DOM.btnCloseModal.addEventListener('click', closeModal);
    if (DOM.btnCancelModal) DOM.btnCancelModal.addEventListener('click', closeModal);

    // Close modal on backdrop click
    if (DOM.transactionModal) {
      DOM.transactionModal.addEventListener('click', (e) => {
        if (e.target === DOM.transactionModal) {
          closeModal();
        }
      });
    }

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.transactionModal && !DOM.transactionModal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Type switcher inside modal
    if (DOM.btnTypeExpense) DOM.btnTypeExpense.addEventListener('click', () => setFormType('expense'));
    if (DOM.btnTypeIncome) DOM.btnTypeIncome.addEventListener('click', () => setFormType('income'));

    // Currency input live formatting
    if (DOM.formAmount) DOM.formAmount.addEventListener('input', handleAmountInput);

    // Form submission
    if (DOM.transactionForm) DOM.transactionForm.addEventListener('submit', handleFormSubmit);

    // Quick manage / create / edit category from transaction modal
    if (DOM.btnQuickCreateCat) {
      DOM.btnQuickCreateCat.addEventListener('click', () => {
        const curType = DOM.formTypeInput ? DOM.formTypeInput.value : 'expense';
        const curSelectedCat = DOM.formCategory ? DOM.formCategory.value : '';
        // If current selected category in dropdown is a custom category, open directly in edit mode!
        const isCustom = customCategories.find(c => c.id === curSelectedCat || c.name === curSelectedCat);
        openCategoryModal(isCustom ? isCustom.id : null);
        if (!isCustom) {
          setCatFormType(curType);
        }
      });
    }

    // Reset / Typo handler to quickly clean form inputs
    if (DOM.btnResetFormFields) {
      DOM.btnResetFormFields.addEventListener('click', () => {
        if (DOM.formAmount) DOM.formAmount.value = '';
        if (DOM.formNote) DOM.formNote.value = '';
        if (DOM.formDate) DOM.formDate.value = getTodayDateString(0);
        if (DOM.amountHint) {
          DOM.amountHint.textContent = 'Masukkan jumlah nominal transaksi';
          DOM.amountHint.style.color = '';
        }
        if (DOM.formAmount) DOM.formAmount.focus();
        showToast('Formulir berhasil dikosongkan. Silakan isi kembali tanpa salah ketik.', 'info');
      });
    }

    // Feed Search
    if (DOM.feedSearchInput) {
      DOM.feedSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim() !== '') {
          if (DOM.btnClearSearch) DOM.btnClearSearch.classList.remove('hidden');
        } else {
          if (DOM.btnClearSearch) DOM.btnClearSearch.classList.add('hidden');
        }
        renderDailyFeed();
      });
    }

    if (DOM.btnClearSearch) {
      DOM.btnClearSearch.addEventListener('click', () => {
        if (DOM.feedSearchInput) DOM.feedSearchInput.value = '';
        searchQuery = '';
        DOM.btnClearSearch.classList.add('hidden');
        if (DOM.feedSearchInput) DOM.feedSearchInput.focus();
        renderDailyFeed();
      });
    }

    // Filter tabs
    if (DOM.filterTabs) {
      DOM.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          DOM.filterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          activeFilter = tab.getAttribute('data-filter');
          renderDailyFeed();
        });
      });
    }

    // Period filter pills (Step 2)
    if (DOM.periodPills && DOM.periodPills.length > 0) {
      DOM.periodPills.forEach(pill => {
        pill.addEventListener('click', () => {
          DOM.periodPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          currentPeriod = pill.getAttribute('data-period') || 'this-month';
          updateAllViews();
        });
      });
    }

    // Monthly Budget Modal events (Step 2)
    if (DOM.btnEditBudget) DOM.btnEditBudget.addEventListener('click', openBudgetModal);
    if (DOM.btnCloseBudgetModal) DOM.btnCloseBudgetModal.addEventListener('click', closeBudgetModal);
    if (DOM.btnCancelBudgetModal) DOM.btnCancelBudgetModal.addEventListener('click', closeBudgetModal);
    if (DOM.formBudgetAmount) DOM.formBudgetAmount.addEventListener('input', handleBudgetAmountInput);
    if (DOM.budgetForm) DOM.budgetForm.addEventListener('submit', handleBudgetFormSubmit);

    // Close budget modal on backdrop click
    if (DOM.budgetModal) {
      DOM.budgetModal.addEventListener('click', (e) => {
        if (e.target === DOM.budgetModal) {
          closeBudgetModal();
        }
      });
    }

    // Close budget modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.budgetModal && !DOM.budgetModal.classList.contains('hidden')) {
        closeBudgetModal();
      }
    });

    // Chart Switcher Tabs (Step 3)
    if (DOM.tabChartCategory) DOM.tabChartCategory.addEventListener('click', () => switchChartView('category'));
    if (DOM.tabChartTrend) DOM.tabChartTrend.addEventListener('click', () => switchChartView('trend'));

    // Export to CSV (Step 3)
    if (DOM.btnExportCsv) DOM.btnExportCsv.addEventListener('click', exportTransactionsToCSV);

    // Recurring Transactions Modal & Form (Step 3)
    if (DOM.btnOpenRecurring) DOM.btnOpenRecurring.addEventListener('click', openRecurringModal);
    if (DOM.btnCloseRecurringModal) DOM.btnCloseRecurringModal.addEventListener('click', closeRecurringModal);
    if (DOM.btnCancelRecurringModal) DOM.btnCancelRecurringModal.addEventListener('click', closeRecurringModal);
    if (DOM.recurringForm) DOM.recurringForm.addEventListener('submit', handleRecurringFormSubmit);
    if (DOM.formRecType) DOM.formRecType.addEventListener('change', populateRecurringCategoryDropdown);
    if (DOM.formRecAmount) DOM.formRecAmount.addEventListener('input', handleAmountInput);

    if (DOM.recurringModal) {
      DOM.recurringModal.addEventListener('click', (e) => {
        if (e.target === DOM.recurringModal) {
          closeRecurringModal();
        }
      });
    }

    // Custom Category Modal & Form (Step 3)
    if (DOM.btnOpenCategoryModal) DOM.btnOpenCategoryModal.addEventListener('click', () => openCategoryModal());
    if (DOM.btnCloseCategoryModal) DOM.btnCloseCategoryModal.addEventListener('click', closeCategoryModal);
    if (DOM.btnCancelCategoryModal) DOM.btnCancelCategoryModal.addEventListener('click', closeCategoryModal);
    if (DOM.btnCancelCatEdit) DOM.btnCancelCatEdit.addEventListener('click', resetCategoryEditForm);
    if (DOM.categoryForm) DOM.categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    if (DOM.btnCatTypeExpense) DOM.btnCatTypeExpense.addEventListener('click', () => setCatFormType('expense'));
    if (DOM.btnCatTypeIncome) DOM.btnCatTypeIncome.addEventListener('click', () => setCatFormType('income'));

    if (DOM.colorDots && DOM.colorDots.length > 0) {
      DOM.colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
          DOM.colorDots.forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          if (DOM.formCatColor) DOM.formCatColor.value = dot.getAttribute('data-color') || '#4f46e5';
        });
      });
    }

    if (DOM.categoryModal) {
      DOM.categoryModal.addEventListener('click', (e) => {
        if (e.target === DOM.categoryModal) {
          closeCategoryModal();
        }
      });
    }

    // Close Modals on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (DOM.recurringModal && !DOM.recurringModal.classList.contains('hidden')) closeRecurringModal();
        if (DOM.categoryModal && !DOM.categoryModal.classList.contains('hidden')) closeCategoryModal();
      }
    });

    // Reset Demo Data
    if (DOM.btnResetDemo) {
      DOM.btnResetDemo.addEventListener('click', async () => {
        if (confirm('Kembalikan data ke contoh awal bawaan aplikasi?')) {
          const client = getCloudClient();
          if (client) {
            // Akun cloud: data contoh benar-benar ditulis ke Supabase
            const result = await replaceCloudTransactions(client, getInitialDummyData());
            if (result === null) return;
            transactions = result;
          } else {
            transactions = getInitialDummyData();
          }
          saveTransactions();
          updateAllViews();
          showToast('Data contoh bawaan berhasil dipulihkan!', 'info');
        }
      });
    }

    // Clear All Data
    if (DOM.btnClearAll) {
      DOM.btnClearAll.addEventListener('click', async () => {
        if (confirm('Apakah Anda yakin ingin menghapus SEMUA catatan transaksi?')) {
          const client = getCloudClient();
          if (client) {
            // Akun cloud: hapus juga di Supabase agar tidak muncul lagi saat dibuka ulang
            const result = await replaceCloudTransactions(client, []);
            if (result === null) return;
          }
          transactions = [];
          saveTransactions();
          updateAllViews();
          showToast('Semua catatan transaksi telah dikosongkan.', 'danger');
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // APP INITIALIZATION
  // --------------------------------------------------------------------------
  function initApp() {
    registerServiceWorker(); // PWA Service Worker (Step 4)
    setupPwaInstall();       // PWA Install Prompt (Step 4)
    setupNetworkStatus();    // Online / Offline Indicator (Step 4)
    setupAuthEventListeners(); // Pasang listener auth terlebih dahulu
    initDateHeader();
    initTheme();
    loadCustomCategories();
    loadRecurringTemplates();
    loadTransactionsFromLocal();
    populateCategoryDropdown('expense');
    setupEventListeners();
    initSupabaseAuth();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

