import { useEffect, useMemo, useState } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDtoio2DIS0beCzrtrTsEWVEiqWMelga-c',
  authDomain: 'finanzas-heidy.firebaseapp.com',
  projectId: 'finanzas-heidy',
  storageBucket: 'finanzas-heidy.firebasestorage.app',
  messagingSenderId: '565247949119',
  appId: '1:565247949119:web:84917324318cb65a827b8a',
}

const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)
const provider = new GoogleAuthProvider()

export default function FinanzasHeidy() {
  const money = (value) => Number(value || 0).toLocaleString()

  const safeParse = (key) => {
    if (typeof window === 'undefined') return []

    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  const [activeTab, setActiveTab] = useState('Resumen')
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [user, setUser] = useState(null)
  const [loadingCloud, setLoadingCloud] = useState(true)

  const [accounts, setAccounts] = useState(() => safeParse('finanzas-accounts'))
  const [goals, setGoals] = useState(() => safeParse('finanzas-goals'))
  const [expenses, setExpenses] = useState(() => safeParse('finanzas-expenses'))

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)

  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalSaved, setGoalSaved] = useState('')
  const [goalMonthly, setGoalMonthly] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalIcon, setGoalIcon] = useState('🎯')
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [goalLocation, setGoalLocation] = useState('Efectivo')

  const [accountBank, setAccountBank] = useState('')
  const [accountType, setAccountType] = useState('Nómina')
  const [accountOwner, setAccountOwner] = useState('Yo')
  const [accountBalance, setAccountBalance] = useState('')
  const [accountPayroll, setAccountPayroll] = useState('')
  const [accountCutDay, setAccountCutDay] = useState('')
  const [accountPaymentDay, setAccountPaymentDay] = useState('')
  const [accountPayrollOne, setAccountPayrollOne] = useState('')
  const [accountPayrollTwo, setAccountPayrollTwo] = useState('')
  const [accountLimit, setAccountLimit] = useState('')
  const [accountAvailableCredit, setAccountAvailableCredit] = useState('')
  const [accountDebt, setAccountDebt] = useState('')
  const [accountDebtAccount, setAccountDebtAccount] = useState('')
  const [accountFirstPayDay, setAccountFirstPayDay] = useState('')
  const [accountSecondPayDay, setAccountSecondPayDay] = useState('')
  const [accountAutoDebitName, setAccountAutoDebitName] = useState('')
  const [accountAutoDebitAmount, setAccountAutoDebitAmount] = useState('')
  const [accountAutoDebitDay, setAccountAutoDebitDay] = useState('')
  const [accountColor, setAccountColor] = useState('from-violet-500 to-purple-500')
  const [editingAccountId, setEditingAccountId] = useState(null)

  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseFrequency, setExpenseFrequency] = useState('Variable')
  const [expenseOwner, setExpenseOwner] = useState('Yo')
  const [expenseDate, setExpenseDate] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('🍔 Comida')
  const [expensePaid, setExpensePaid] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [expenseAccount, setExpenseAccount] = useState('')

  useEffect(() => {
    localStorage.setItem('finanzas-accounts', JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoadingCloud(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        const data = snapshot.data()

        if (!data) return

        if (data.accounts) setAccounts(data.accounts)
        if (data.goals) setGoals(data.goals)
        if (data.expenses) setExpenses(data.expenses)
      }
    )

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user) return

    setDoc(doc(db, 'users', user.uid), {
      accounts,
      goals,
      expenses,
    })
  }, [accounts, goals, expenses, user])

  useEffect(() => {
    localStorage.setItem('finanzas-goals', JSON.stringify(goals))
  }, [goals])

  useEffect(() => {
    localStorage.setItem('finanzas-expenses', JSON.stringify(expenses))
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (!expense.date) return true

      if (expense.frequency === 'Fijo') {
        if (!expense.originalMonth) {
          return true
        }

        return expense.originalMonth <= selectedMonth
      }

      return String(expense.date).startsWith(selectedMonth)
    }).map((expense) => {
      if (expense.frequency !== 'Fijo') return expense

      return {
        ...expense,
        paid: expense.originalMonth === selectedMonth ? expense.paid : false,
      }
    })
  }, [expenses, selectedMonth])

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-')

    return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-DO', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedMonth])

  const myAvailable = useMemo(() => {
    return accounts
      .filter((a) => a.owner === 'Yo' && a.type === 'Nómina')
      .reduce((acc, item) => acc + Number(item.balance || 0), 0)
  }, [accounts])

  const partnerAvailable = useMemo(() => {
    return accounts
      .filter((a) => a.owner === 'Pareja' && a.type === 'Nómina')
      .reduce((acc, item) => acc + Number(item.balance || 0), 0)
  }, [accounts])

  const totalSavings = useMemo(() => {
    return goals.reduce((acc, item) => acc + Number(item.saved || 0), 0)
  }, [goals])

  const expenseCategoryData = useMemo(() => {
    const categories = {
      '🍔 Comida': 0,
      '🚗 Transporte': 0,
      '💳 Préstamo': 0,
      '🎉 Ocio': 0,
    }

    filteredExpenses
      .filter((expense) => expense.paid)
      .forEach((expense) => {
        if (categories[expense.category] !== undefined) {
          categories[expense.category] += Number(expense.amount || 0)
        }
      })

    return categories
  }, [filteredExpenses])

  const totalCategoryExpenses = Object.values(expenseCategoryData).reduce(
    (acc, value) => acc + value,
    0
  )

  const monthlyIncome = useMemo(() => {
    return accounts
      .filter((acc) => acc.type === 'Nómina')
      .reduce(
        (acc, item) =>
          acc +
          Number(item.payrollOne || 0) +
          Number(item.payrollTwo || 0),
        0
      )
  }, [accounts])

  const monthlyExpenses = useMemo(() => {
    return filteredExpenses
      .filter((expense) => expense.paid)
      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [filteredExpenses])

  const projectedPendingExpenses = useMemo(() => {
    return filteredExpenses
      .filter((expense) => !expense.paid)
      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [filteredExpenses])

  const myIncome = useMemo(() => {
    return accounts
      .filter((acc) => acc.type === 'Nómina' && acc.owner === 'Yo')
      .reduce(
        (acc, item) =>
          acc +
          Number(item.payrollOne || 0) +
          Number(item.payrollTwo || 0),
        0
      )
  }, [accounts])

  const partnerIncome = useMemo(() => {
    return accounts
      .filter((acc) => acc.type === 'Nómina' && acc.owner === 'Pareja')
      .reduce(
        (acc, item) =>
          acc +
          Number(item.payrollOne || 0) +
          Number(item.payrollTwo || 0),
        0
      )
  }, [accounts])

  const myPendingExpenses = useMemo(() => {
    return filteredExpenses
      .filter((expense) => !expense.paid && expense.owner === 'Yo')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [filteredExpenses])

  const partnerPendingExpenses = useMemo(() => {
    return filteredExpenses
      .filter((expense) => !expense.paid && expense.owner === 'Pareja')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [filteredExpenses])

  const myProjectedCashFlow = useMemo(() => {
    return myIncome - myPendingExpenses
  }, [myIncome, myPendingExpenses])

  const partnerProjectedCashFlow = useMemo(() => {
    return partnerIncome - partnerPendingExpenses
  }, [partnerIncome, partnerPendingExpenses])

  const addGoal = () => {
    if (!goalName) return

    const goalData = {
      id: editingGoalId || Date.now(),
      name: goalName,
      target: Number(goalTarget || 0),
      saved: Number(goalSaved || 0),
      monthly: Number(goalMonthly || 0),
      date: goalDate,
      icon: goalIcon,
      location: goalLocation,
    }

    if (editingGoalId) {
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === editingGoalId ? goalData : goal
        )
      )
    } else {
      setGoals((prev) => [...prev, goalData])
    }

    setGoalName('')
    setGoalTarget('')
    setGoalSaved('')
    setGoalMonthly('')
    setGoalDate('')
    setGoalIcon('🎯')
    setGoalLocation('Efectivo')
    setEditingGoalId(null)
    setShowGoalModal(false)
  }

  const addAccount = () => {
    const data = {
      id: editingAccountId || Date.now(),
      bank: accountBank,
      type: accountType,
      owner: accountOwner,
      balance: Number(accountBalance || 0),
      payroll: Number(accountPayroll || 0),
      payrollOne: accountPayrollOne,
      payrollTwo: accountPayrollTwo,
      limit: Number(accountLimit || 0),
      availableCredit: Number(accountAvailableCredit || 0),
      debt: Number(accountDebt || 0),
      debtAccount: accountDebtAccount,
      firstPayDay: accountFirstPayDay,
      secondPayDay: accountSecondPayDay,
      autoDebitName: accountAutoDebitName,
      autoDebitAmount: Number(accountAutoDebitAmount || 0),
      autoDebitDay: accountAutoDebitDay,
      cutDay: accountCutDay,
      paymentDay: accountPaymentDay,
      color: accountColor,
    }

    if (editingAccountId) {
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === editingAccountId ? data : acc))
      )
    } else {
      setAccounts((prev) => [...prev, data])

      if (accountType === 'Tarjeta' && Number(accountDebt || 0) > 0) {
        setExpenses((prev) => [
          {
            id: Date.now() + 1,
            name: `Pago ${accountBank}`,
            amount: Number(accountDebt || 0),
            frequency: 'Fijo',
            originalMonth: selectedMonth,
            owner: accountOwner,
            date: accountPaymentDay || '',
            category: '💳 Préstamo',
            paid: false,
            account: accountDebtAccount,
          },
          ...prev,
        ])
      }
    }

    setAccountBank('')
    setAccountType('Nómina')
    setAccountOwner('Yo')
    setAccountBalance('')
    setAccountPayroll('')
    setAccountPayrollOne('')
    setAccountPayrollTwo('')
    setAccountLimit('')
    setAccountAvailableCredit('')
    setAccountDebt('')
    setAccountDebtAccount('')
    setAccountFirstPayDay('')
    setAccountSecondPayDay('')
    setAccountAutoDebitName('')
    setAccountAutoDebitAmount('')
    setAccountAutoDebitDay('')
    setAccountCutDay('')
    setAccountPaymentDay('')
    setAccountColor('from-violet-500 to-purple-500')
    setEditingAccountId(null)
    setShowAccountModal(false)
  }

  const addExpense = () => {
    const data = {
      id: editingExpenseId || Date.now(),
      name: expenseName,
      amount: Number(expenseAmount || 0),
      frequency: expenseFrequency,
      originalMonth:
        expenseFrequency === 'Fijo'
          ? selectedMonth
          : String(expenseDate || '').slice(0, 7),
      owner: expenseOwner,
      date: expenseDate,
      category: expenseCategory,
      paid: expensePaid,
      account: expenseAccount,
    }

    if (editingExpenseId) {
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === editingExpenseId ? data : item
        )
      )
    } else {
      setExpenses((prev) => [...prev, data])

      if (expensePaid && expenseAccount) {
        setAccounts((prev) =>
          prev.map((account) => {
            const accountName = `${account.bank} - ${account.type}`

            if (accountName === expenseAccount) {
              if (account.type === 'Tarjeta') {
                return {
                  ...account,
                  availableCredit:
                    Number(account.availableCredit || 0) - Number(expenseAmount || 0),
                  debt:
                    Number(account.debt || 0) + Number(expenseAmount || 0),
                }
              }

              return {
                ...account,
                balance:
                  Number(account.balance || 0) - Number(expenseAmount || 0),
              }
            }

            return account
          })
        )
      }
    }

    setExpenseName('')
    setExpenseAmount('')
    setExpenseFrequency('Variable')
    setExpenseOwner('Yo')
    setExpenseDate('')
    setExpenseCategory('🍔 Comida')
    setExpensePaid(false)
    setExpenseAccount('')
    setEditingExpenseId(null)
    setShowExpenseModal(false)
  }

  if (!loadingCloud && !user) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.12),transparent_35%)]">
        <div className="w-full max-w-md rounded-[36px] bg-white/[0.04] border border-white/10 p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10 text-center">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-cyan-400 to-blue-600 mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-cyan-500/20 mb-6">
              💸
            </div>

            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Finanzas
            </h1>

            <p className="text-white/50 mt-4 leading-relaxed text-base">
              Controla cuentas, tarjetas, gastos, ahorros y cash flow en una sola app.
            </p>

            <button
              onClick={() => signInWithPopup(auth, provider)}
              className="w-full mt-8 rounded-[24px] bg-gradient-to-r from-cyan-400 to-blue-500 py-5 text-black font-black text-lg hover:scale-[1.02] transition-all duration-300 shadow-2xl shadow-cyan-500/20"
            >
              Continuar con Google
            </button>

            <div className="mt-6 flex items-center justify-center gap-3 text-white/40 text-sm flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                ☁️ Sync nube
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                🔒 Seguro
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                📱 Multi-device
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.12),transparent_35%)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Finanzas
          </h1>

          <div className="flex items-center gap-3">
            {user && (
              <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-sm">
                ☁️ Sincronizado
              </div>
            )}

            {loadingCloud ? (
              <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm">
                Conectando...
              </div>
            ) : user ? (
              <button
                onClick={() => signOut(auth)}
                className="px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 font-black"
              >
                Cerrar sesión
              </button>
            ) : (
              <button
                onClick={() => signInWithPopup(auth, provider)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black"
              >
                Login Google
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-3 overflow-auto">
          {['Resumen', 'Ahorros', 'Cuentas y tarjetas', 'Gastos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
          </div>

          <div className="flex items-center gap-3 rounded-[20px] bg-white/5 border border-white/10 px-4 py-3">
            <span className="text-white/50 text-sm uppercase tracking-wider">
              Mes
            </span>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent outline-none text-cyan-300 font-black"
            />
          </div>
        </div>

        <div className="mb-6 rounded-[24px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/10 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
              Periodo activo
            </p>

            <h2 className="text-2xl font-black capitalize mt-1 text-cyan-200">
              {monthLabel}
            </h2>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-300 text-sm font-bold">
              {filteredExpenses.filter((e) => e.paid).length} pagos realizados
            </div>

            <div className="px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-300 text-sm font-bold">
              {filteredExpenses.filter((e) => !e.paid).length} pendientes
            </div>
          </div>
        </div>

        {activeTab === 'Resumen' && (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="rounded-[28px] bg-white/5 border border-white/10 p-6">
                <p className="text-white/50 uppercase text-xs tracking-[0.2em]">
                  Mi disponible
                </p>

                <h2 className="text-4xl font-black text-cyan-300 mt-3">
                  RD${money(myAvailable)}
                </h2>

                <p className="text-white/40 mt-2 text-sm">
                  Disponible luego de pagos
                </p>
              </div>

              <div className="rounded-[28px] bg-white/5 border border-white/10 p-6">
                <p className="text-white/50 uppercase text-xs tracking-[0.2em]">
                  Pareja disponible
                </p>

                <h2 className="text-4xl font-black text-pink-300 mt-3">
                  RD${money(partnerAvailable)}
                </h2>

                <p className="text-white/40 mt-2 text-sm">
                  Disponible luego de pagos
                </p>
              </div>

              <div className="rounded-[28px] bg-white/5 border border-white/10 p-6">
                <p className="text-white/50 uppercase text-xs tracking-[0.2em]">
                  Ahorros
                </p>

                <h2 className="text-4xl font-black text-emerald-300 mt-3">
                  RD${money(totalSavings)}
                </h2>

                <p className="text-white/40 mt-2 text-sm">
                  Total guardado en metas
                </p>
              </div>

              <div className="rounded-[28px] bg-white/5 border border-white/10 p-6">
                <p className="text-white/50 uppercase text-xs tracking-[0.2em]">
                  Gastos pagados
                </p>

                <h2 className="text-4xl font-black text-orange-300 mt-3">
                  RD${money(
                    filteredExpenses
                      .filter((item) => item.paid)
                      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
                  )}
                </h2>

                <p className="text-white/40 mt-2 text-sm">
                  Este mes
                </p>
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/20 p-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />

                <p className="text-cyan-200/70 uppercase text-xs tracking-[0.2em] relative z-10">
                  Cash flow proyectado · Yo
                </p>

                <h2 className={`text-4xl font-black mt-3 relative z-10 ${myProjectedCashFlow >= 0 ? 'text-cyan-200' : 'text-red-300'}`}>
                  RD${money(myProjectedCashFlow)}
                </h2>

                <p className="text-white/50 mt-2 text-sm relative z-10 leading-relaxed">
                  Luego de tus pagos pendientes te quedarían{' '}
                  <span className="font-black text-cyan-200">
                    RD${money(myProjectedCashFlow)}
                  </span>
                </p>

                <div className="mt-5 rounded-2xl bg-black/20 px-4 py-3 relative z-10">
                  <p className="text-white/40 text-xs uppercase">
                    Pendientes
                  </p>

                  <h4 className="text-yellow-300 font-black text-lg mt-1">
                    RD${money(myPendingExpenses)}
                  </h4>
                </div>
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/20 p-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-pink-500/10 blur-3xl" />

                <p className="text-pink-200/70 uppercase text-xs tracking-[0.2em] relative z-10">
                  Cash flow proyectado · Pareja
                </p>

                <h2 className={`text-4xl font-black mt-3 relative z-10 ${partnerProjectedCashFlow >= 0 ? 'text-pink-200' : 'text-red-300'}`}>
                  RD${money(partnerProjectedCashFlow)}
                </h2>

                <p className="text-white/50 mt-2 text-sm relative z-10 leading-relaxed">
                  Luego de pagos pendientes quedarían{' '}
                  <span className="font-black text-pink-200">
                    RD${money(partnerProjectedCashFlow)}
                  </span>
                </p>

                <div className="mt-5 rounded-2xl bg-black/20 px-4 py-3 relative z-10">
                  <p className="text-white/40 text-xs uppercase">
                    Pendientes
                  </p>

                  <h4 className="text-yellow-300 font-black text-lg mt-1">
                    RD${money(partnerPendingExpenses)}
                  </h4>
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-4 mt-6">
              <div className="rounded-[32px] bg-white/5 border border-white/10 p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">
                    Gastos por categoría
                  </h2>

                  <div className="text-white/40 text-sm">
                    Distribución mensual
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative w-[260px] h-[260px] rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #22d3ee 0% ${(expenseCategoryData['🍔 Comida'] / Math.max(totalCategoryExpenses, 1)) * 100}%,
                          #f59e0b ${(expenseCategoryData['🍔 Comida'] / Math.max(totalCategoryExpenses, 1)) * 100}% ${((expenseCategoryData['🍔 Comida'] + expenseCategoryData['🚗 Transporte']) / Math.max(totalCategoryExpenses, 1)) * 100}%,
                          #ef4444 ${((expenseCategoryData['🍔 Comida'] + expenseCategoryData['🚗 Transporte']) / Math.max(totalCategoryExpenses, 1)) * 100}% ${((expenseCategoryData['🍔 Comida'] + expenseCategoryData['🚗 Transporte'] + expenseCategoryData['💳 Préstamo']) / Math.max(totalCategoryExpenses, 1)) * 100}%,
                          #a855f7 ${((expenseCategoryData['🍔 Comida'] + expenseCategoryData['🚗 Transporte'] + expenseCategoryData['💳 Préstamo']) / Math.max(totalCategoryExpenses, 1)) * 100}% 100%
                        )`,
                      }}
                    />

                    <div className="absolute inset-[38px] rounded-full bg-[#0B1120] border border-white/10 flex flex-col items-center justify-center text-center">
                      <p className="text-white/40 text-xs uppercase tracking-[0.2em]">
                        Gastos
                      </p>

                      <h2 className="text-3xl font-black mt-2 text-cyan-300">
                        RD${money(totalCategoryExpenses)}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  {[
                    ['🍔 Comida', 'bg-cyan-400'],
                    ['🚗 Transporte', 'bg-amber-400'],
                    ['💳 Préstamo', 'bg-red-400'],
                    ['🎉 Ocio', 'bg-violet-400'],
                  ].map(([label, color]) => (
                    <div
                      key={label}
                      className="rounded-[18px] bg-white/[0.03] border border-white/10 p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <p className="text-sm font-bold">{label}</p>
                      </div>

                      <h3 className="text-xl font-black text-white mt-2">
                        RD${money(expenseCategoryData[label] || 0)}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] bg-white/5 border border-white/10 p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black">
                    Ingresos vs gastos
                  </h2>

                  <div className="text-white/40 text-sm">
                    Balance mensual
                  </div>
                </div>

                <div className="space-y-8 mt-10">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-emerald-300 font-bold">
                        Ingresos
                      </span>

                      <span className="text-emerald-300 font-black text-xl">
                        RD${money(monthlyIncome)}
                      </span>
                    </div>

                    <div className="w-full h-7 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-7 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                        style={{
                          width: '100%',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-red-300 font-bold">
                        Gastos
                      </span>

                      <span className="text-red-300 font-black text-xl">
                        RD${money(monthlyExpenses)}
                      </span>
                    </div>

                    <div className="w-full h-7 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-7 rounded-full bg-gradient-to-r from-red-400 to-orange-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (monthlyExpenses / Math.max(monthlyIncome, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyan-300 font-bold">
                        Ahorros
                      </span>

                      <span className="text-cyan-300 font-black text-xl">
                        RD${money(totalSavings)}
                      </span>
                    </div>

                    <div className="w-full h-7 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-7 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (totalSavings / Math.max(monthlyIncome, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              </div>

            <div className="grid xl:grid-cols-2 gap-4 mt-6">
              <div className="rounded-[32px] bg-white/5 border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black">
                    Balance por persona
                  </h2>

                  <div className="flex gap-2">
                    <div className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold">
                      Yo
                    </div>

                    <div className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 text-xs font-bold">
                      Pareja
                    </div>
                  </div>
                </div>

                <div className="space-y-5 mt-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">Yo</span>
                      <span className="text-cyan-300 font-black">
                        RD${money(myAvailable)}
                      </span>
                    </div>

                    <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (myAvailable /
                              Math.max(myAvailable, partnerAvailable, 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">Pareja</span>
                      <span className="text-pink-300 font-black">
                        RD${money(partnerAvailable)}
                      </span>
                    </div>

                    <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-5 rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (partnerAvailable /
                              Math.max(myAvailable, partnerAvailable, 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] bg-white/5 border border-white/10 p-6">
                <h2 className="text-2xl font-black mb-6">
                  Últimos movimientos
                </h2>

                <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                  {filteredExpenses.length === 0 && (
                    <div className="rounded-[22px] bg-white/[0.03] border border-white/10 h-[180px] flex items-center justify-center text-white/40">
                      Sin movimientos todavía
                    </div>
                  )}

                  {[...filteredExpenses]
                    .filter((expense) => expense.paid)
                    .reverse()
                    .map((expense) => (
                      <div
                        key={expense.id}
                        className="rounded-[22px] bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-2xl shrink-0">
                            {(expense.category || '💸').split(' ')[0]}
                          </div>

                          <div className="min-w-0">
                            <div className="flex gap-2 flex-wrap mb-1">
                              <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[11px] font-bold">
                                {expense.owner}
                              </span>

                              <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${expense.paid ? 'bg-emerald-500/10 text-emerald-300' : 'bg-yellow-500/10 text-yellow-300'}`}>
                                {expense.paid ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>

                            <h3 className="font-black text-lg truncate">
                              {expense.name}
                            </h3>

                            <p className="text-white/40 text-sm mt-1 truncate">
                              {expense.account || 'Sin cuenta'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <h2 className={`text-2xl font-black ${expense.paid ? 'text-emerald-300' : 'text-red-300'}`}>
                            {expense.paid ? '-' : ''}RD${money(expense.amount)}
                          </h2>

                          <p className="text-white/40 text-xs mt-1">
                            {expense.frequency === 'Fijo'
                              ? `Día ${expense.date}`
                              : expense.date}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Cuentas y tarjetas' && (
          <>
            <div className="mt-6 rounded-[32px] bg-gradient-to-br from-[#10182d] to-[#0b1120] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black tracking-tight">
                  Cuentas y tarjetas
                </h2>

                <button
                  onClick={() => {
                    setEditingAccountId(null)
                    setAccountBank('')
                    setAccountType('Nómina')
                    setAccountOwner('Yo')
                    setAccountBalance('')
                    setAccountPayroll('')
                    setAccountPayrollOne('')
                    setAccountPayrollTwo('')
                    setAccountLimit('')
                    setAccountAvailableCredit('')
                    setAccountFirstPayDay('')
                    setAccountSecondPayDay('')
                    setAccountAutoDebitName('')
                    setAccountAutoDebitAmount('')
                    setAccountAutoDebitDay('')
                    setAccountCutDay('')
                    setAccountPaymentDay('')
                    setShowAccountModal(true)
                  }}
                  className="px-5 py-3 rounded-[18px] bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-base"
                >
                  + Nueva cuenta
                </button>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-[24px] overflow-hidden bg-gradient-to-br from-[#0f172d] to-[#0b1020] border border-white/10"
                  >
                    <div className={`p-4 bg-gradient-to-r ${account.color || 'from-violet-500 to-purple-500'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white/70 text-sm">{account.bank}</p>
                          <h3 className="text-2xl font-black mt-1 text-white">
                            {account.type}
                          </h3>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingAccountId(account.id)
                              setAccountBank(account.bank)
                              setAccountType(account.type)
                              setAccountOwner(account.owner)
                              setAccountBalance(String(account.balance || ''))
                              setAccountPayroll(String(account.payroll || ''))
                              setAccountPayrollOne(account.payrollOne || '')
                              setAccountPayrollTwo(account.payrollTwo || '')
                              setAccountLimit(String(account.limit || ''))
                              setAccountAvailableCredit(String(account.availableCredit || ''))
                              setAccountDebt(String(account.debt || ''))
                              setAccountDebtAccount(account.debtAccount || '')
                              setAccountFirstPayDay(account.firstPayDay || '')
                              setAccountSecondPayDay(account.secondPayDay || '')
                              setAccountAutoDebitName(account.autoDebitName || '')
                              setAccountAutoDebitAmount(String(account.autoDebitAmount || ''))
                              setAccountAutoDebitDay(account.autoDebitDay || '')
                              setAccountCutDay(account.cutDay || '')
                              setAccountPaymentDay(account.paymentDay || '')
                              setAccountColor(account.color || 'from-violet-500 to-purple-500')
                              setShowAccountModal(true)
                            }}
                            className="w-9 h-9 rounded-[14px] bg-black/20 text-sm"
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() => setAccounts((prev) => prev.filter((item) => item.id !== account.id))}
                            className="w-9 h-9 rounded-[14px] bg-red-500/20 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-white/40 text-xs uppercase">Disponible</p>
                        <h2 className="text-3xl font-black text-cyan-300 mt-1">
                          RD${money(account.balance)}
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-white/40 text-xs uppercase">Titular</p>
                          <h4 className="text-sm font-black mt-1">{account.owner}</h4>
                        </div>

                        <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-white/40 text-xs uppercase">Ingreso total</p>
                          <h4 className="text-sm font-black mt-1">
                            RD${money(
                              Number(account.payrollOne || 0) +
                              Number(account.payrollTwo || 0)
                            )}
                          </h4>
                        </div>
                      </div>

                      {account.type === 'Nómina' && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-white/40 text-xs uppercase">1ra Quincena</p>
                              <h4 className="text-sm font-black mt-1">
                                RD${money(account.payrollOne)}
                              </h4>
                            </div>

                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-white/40 text-xs uppercase">2da Quincena</p>
                              <h4 className="text-sm font-black mt-1">
                                RD${money(account.payrollTwo)}
                              </h4>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-white/40 text-xs uppercase">1er Pago</p>
                              <h4 className="text-sm font-black mt-1">
                                Día {account.firstPayDay || '-'}
                              </h4>
                            </div>

                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-white/40 text-xs uppercase">2do Pago</p>
                              <h4 className="text-sm font-black mt-1">
                                Día {account.secondPayDay || '-'}
                              </h4>
                            </div>
                          </div>

                          {account.autoDebitName && (
                            <div className="rounded-[16px] bg-red-500/10 border border-red-500/20 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-red-300 text-xs uppercase">Débito automático</p>
                                  <h4 className="font-black mt-1">{account.autoDebitName}</h4>
                                </div>

                                <div className="text-right">
                                  <h4 className="text-red-300 font-black">
                                    RD${money(account.autoDebitAmount)}
                                  </h4>
                                  <p className="text-xs text-white/50 mt-1">
                                    Día {account.autoDebitDay || '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {account.type === 'Tarjeta' && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[16px] bg-red-500/10 p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-red-300 text-xs uppercase">Deuda</p>
                              <h4 className="text-sm font-black mt-1">
                                RD${money(account.debt || 0)}
                              </h4>
                            </div>

                            <div className="rounded-[16px] bg-cyan-500/10 p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-cyan-300 text-xs uppercase">Disponible crédito</p>
                              <h4 className="text-sm font-black mt-1">
                                RD${money(account.availableCredit || 0)}
                              </h4>
                            </div>
                          </div>

                          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mt-1 mb-3">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((account.debt || 0) /
                                    Math.max(account.limit || 1, 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                            <span>
                              Utilización
                            </span>

                            <span>
                              {Math.round(
                                ((account.debt || 0) /
                                  Math.max(account.limit || 1, 1)) *
                                  100
                              )}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-white/40 text-xs uppercase">Corte</p>
                              <h4 className="text-sm font-black mt-1">Día {account.cutDay || '-'}</h4>
                            </div>

                            <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                              <p className="text-white/40 text-xs uppercase">Pago</p>
                              <h4 className="text-sm font-black mt-1">Día {account.paymentDay || '-'}</h4>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showAccountModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                <div className="w-full max-w-2xl rounded-[32px] bg-[#0B1120] border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-4xl font-black">
                      {editingAccountId ? 'Editar cuenta' : 'Nueva cuenta'}
                    </h2>

                    <button
                      onClick={() => setShowAccountModal(false)}
                      className="w-12 h-12 rounded-2xl bg-white/5"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      'from-violet-500 to-purple-500',
                      'from-pink-500 to-rose-500',
                      'from-fuchsia-500 to-violet-600',
                      'from-indigo-500 to-fuchsia-500',
                      'from-emerald-500 to-green-500',
                      'from-orange-500 to-yellow-500',
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccountColor(color)}
                        className={`h-14 rounded-[18px] bg-gradient-to-r ${color} ${accountColor === color ? 'ring-4 ring-white/40' : ''}`}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <input
                      value={accountBank}
                      onChange={(e) => setAccountBank(e.target.value)}
                      placeholder="Banco o nombre"
                      className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                      >
                        <option className="bg-[#0B1120]">Nómina</option>
                        <option className="bg-[#0B1120]">Tarjeta</option>
                        <option className="bg-[#0B1120]">Ahorro</option>
                      </select>

                      <select
                        value={accountOwner}
                        onChange={(e) => setAccountOwner(e.target.value)}
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                      >
                        <option className="bg-[#0B1120]">Yo</option>
                        <option className="bg-[#0B1120]">Pareja</option>
                      </select>
                    </div>

                    

                    {accountType === 'Nómina' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            value={accountPayrollOne}
                            onChange={(e) => setAccountPayrollOne(e.target.value)}
                            placeholder="Monto primera quincena"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />

                          <input
                            value={accountPayrollTwo}
                            onChange={(e) => setAccountPayrollTwo(e.target.value)}
                            placeholder="Monto segunda quincena"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <input
                            value={accountFirstPayDay}
                            onChange={(e) => setAccountFirstPayDay(e.target.value)}
                            placeholder="Día primer pago"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />

                          <input
                            value={accountSecondPayDay}
                            onChange={(e) => setAccountSecondPayDay(e.target.value)}
                            placeholder="Día segundo pago"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <input
                            value={accountAutoDebitName}
                            onChange={(e) => setAccountAutoDebitName(e.target.value)}
                            placeholder="Préstamo automático"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />

                          <input
                            value={accountAutoDebitAmount}
                            onChange={(e) => setAccountAutoDebitAmount(e.target.value)}
                            placeholder="Monto automático"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />

                          <input
                            value={accountAutoDebitDay}
                            onChange={(e) => setAccountAutoDebitDay(e.target.value)}
                            placeholder="Día descuento"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />
                        </div>
                      </>
                    )}

                    {accountType === 'Tarjeta' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            value={accountLimit}
                            onChange={(e) => setAccountLimit(e.target.value)}
                            placeholder="Límite tarjeta"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />

                          <input
                            value={accountAvailableCredit}
                            onChange={(e) => setAccountAvailableCredit(e.target.value)}
                            placeholder="Crédito disponible"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />
                        </div>

                        <input
                          value={accountDebt}
                          onChange={(e) => setAccountDebt(e.target.value)}
                          placeholder="Deuda actual"
                          className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                        />

                        <select
                          value={accountDebtAccount}
                          onChange={(e) => setAccountDebtAccount(e.target.value)}
                          className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                        >
                          <option value="" className="bg-[#0B1120]">
                            ¿Desde qué cuenta pagarás?
                          </option>

                          {accounts
                            .filter((acc) => acc.type !== 'Tarjeta')
                            .map((acc) => (
                              <option
                                key={acc.id}
                                value={`${acc.bank} - ${acc.type}`}
                                className="bg-[#0B1120]"
                              >
                                {acc.bank} - {acc.type}
                              </option>
                            ))}
                        </select>

                        <div className="grid grid-cols-2 gap-4">
                          <input
                            value={accountCutDay}
                            onChange={(e) => setAccountCutDay(e.target.value)}
                            type="date"
                            placeholder="Fecha de corte"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />

                          <input
                            value={accountPaymentDay}
                            onChange={(e) => setAccountPaymentDay(e.target.value)}
                            type="date"
                            placeholder="Fecha de pago"
                            className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={addAccount}
                      className="w-full rounded-[20px] bg-gradient-to-r from-cyan-400 to-blue-500 py-4 text-black font-black text-lg"
                    >
                      {editingAccountId ? 'Guardar cambios' : 'Guardar cuenta'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Gastos' && (
          <>
            <div className="mt-6 rounded-[32px] bg-gradient-to-br from-[#10182d] to-[#0b1120] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">
                    Gastos y pagos
                  </h2>

                  <p className="text-white/40 mt-2 text-sm">
                    Control de gastos fijos, variables y pagos mensuales
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingExpenseId(null)
                    setExpenseName('')
                    setExpenseAmount('')
                    setExpenseFrequency('Variable')
                    setExpenseOwner('Yo')
                    setExpenseDate('')
                    setExpenseCategory('🍔 Comida')
                    setExpensePaid(false)
    setExpenseAccount('')
                    setShowExpenseModal(true)
                  }}
                  className="px-5 py-3 rounded-[18px] bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-base"
                >
                  + Agregar
                </button>
              </div>

              <div className="flex gap-3 flex-wrap mb-6">
                {['Todos', 'Yo', 'Pareja', 'Fijos', 'Variables'].map((filter) => (
                  <button
                    key={filter}
                    className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-sm hover:bg-cyan-500/20"
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredExpenses.length === 0 && (
                  <div className="rounded-[24px] bg-white/[0.03] border border-white/10 h-[180px] flex items-center justify-center text-white/50 text-lg">
                    Sin gastos este mes
                  </div>
                )}

                {filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-[24px] bg-gradient-to-br from-[#0f172d] to-[#0b1020] border border-white/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-2xl shrink-0">
                          {(expense.category || '💸').split(' ')[0]}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold">
                              {expense.owner}
                            </span>

                            <span className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs font-bold flex items-center gap-1">
                              <span>{expense.frequency === 'Fijo' ? '📌' : '💸'}</span>
                              <span>{expense.frequency}</span>
                            </span>

                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${expense.paid ? 'bg-emerald-500/10 text-emerald-300' : 'bg-yellow-500/10 text-yellow-300'}`}>
                              {expense.paid ? 'Pagado' : 'Pendiente'}
                            </span>
                          </div>

                          <h3 className="text-xl font-black">
                            {expense.name}
                          </h3>

                          {expense.account && (
                            <p className="text-cyan-300 text-xs mt-1 font-semibold">
                              💳 {expense.account}
                            </p>
                          )}

                          <p className="text-white/40 text-sm mt-1">
                            {expense.frequency === 'Fijo'
                              ? `Día ${expense.date}`
                              : expense.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <h2 className={`text-2xl font-black ${expense.paid ? 'text-emerald-300' : 'text-red-300'}`}>
                          RD${money(expense.amount)}
                        </h2>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setExpenses((prev) =>
                                prev.map((item) =>
                                  item.id === expense.id
                                    ? { ...item, paid: !item.paid }
                                    : item
                                )
                              )
                            }
                            className={`px-3 py-2 rounded-xl text-xs font-bold ${expense.paid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`}
                          >
                            {expense.paid ? 'Pagado' : 'Marcar'}
                          </button>

                          <button
                            onClick={() => {
                              setEditingExpenseId(expense.id)
                              setExpenseName(expense.name)
                              setExpenseAmount(String(expense.amount || ''))
                              setExpenseFrequency(expense.frequency)
                              setExpenseOwner(expense.owner)
                              setExpenseDate(expense.date)
                              setExpenseCategory(expense.category)
                              setExpenseAccount(expense.account || '')
                              setExpensePaid(expense.paid)
                              setShowExpenseModal(true)
                            }}
                            className="w-9 h-9 rounded-[14px] bg-cyan-500/10 text-sm"
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() =>
                              setExpenses((prev) =>
                                prev.filter((item) => item.id !== expense.id)
                              )
                            }
                            className="w-9 h-9 rounded-[14px] bg-red-500/10 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showExpenseModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                <div className="w-full max-w-2xl rounded-[32px] bg-[#0B1120] border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-4xl font-black">
                      Agregar gasto / pago
                    </h2>

                    <button
                      onClick={() => setShowExpenseModal(false)}
                      className="w-12 h-12 rounded-2xl bg-white/5"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        value={expenseName}
                        onChange={(e) => setExpenseName(e.target.value)}
                        placeholder="Netflix, alquiler..."
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                      />

                      <input
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        placeholder="Monto"
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={expenseFrequency}
                        onChange={(e) => setExpenseFrequency(e.target.value)}
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                      >
                        <option className="bg-[#0B1120]">Variable</option>
                        <option className="bg-[#0B1120]">Fijo</option>
                      </select>

                      <select
                        value={expenseOwner}
                        onChange={(e) => setExpenseOwner(e.target.value)}
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                      >
                        <option className="bg-[#0B1120]">Yo</option>
                        <option className="bg-[#0B1120]">Pareja</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {expenseFrequency === 'Fijo' ? (
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          placeholder="Día del mes"
                          className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                        />
                      ) : (
                        <input
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                        />
                      )}

                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                      >
                        <option className="bg-[#0B1120]">🍔 Comida</option>
                        <option className="bg-[#0B1120]">🚗 Transporte</option>
                        <option className="bg-[#0B1120]">🏠 Casa</option>
                        <option className="bg-[#0B1120]">💳 Préstamo</option>
                        <option className="bg-[#0B1120]">🎉 Ocio</option>
                        <option className="bg-[#0B1120]">📦 Otro</option>
                      </select>
                    </div>

                    <select
                      value={expenseAccount}
                      onChange={(e) => setExpenseAccount(e.target.value)}
                      className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                    >
                      <option value="" className="bg-[#0B1120]">
                        Seleccionar cuenta o tarjeta
                      </option>

                      {accounts
                        .filter((acc) => acc.owner === expenseOwner)
                        .map((acc) => (
                          <option
                            key={acc.id}
                            value={`${acc.bank} - ${acc.type}`}
                            className="bg-[#0B1120]"
                          >
                            {acc.bank} - {acc.type}
                          </option>
                        ))}
                    </select>

                    <label className="flex items-center gap-3 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={expensePaid}
                        onChange={(e) => setExpensePaid(e.target.checked)}
                      />
                      Ya fue pagado
                    </label>

                    <button
                      onClick={addExpense}
                      className="w-full rounded-[20px] bg-gradient-to-r from-cyan-400 to-blue-500 py-4 text-black font-black text-lg"
                    >
                      Guardar gasto
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'Ahorros' && (
          <>
            <div className="mt-6 rounded-[32px] bg-gradient-to-br from-[#10182d] to-[#0b1120] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black tracking-tight">
                  Metas de ahorro
                </h2>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setEditingGoalId(null)
                      setGoalName('')
                      setGoalTarget('')
                      setGoalSaved('')
                      setGoalMonthly('')
                      setGoalDate('')
                      setGoalLocation('Efectivo')
                      setShowGoalModal(true)
                    }}
                    className="px-5 py-3 rounded-[18px] bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-black text-base hover:scale-[1.02] transition-all"
                  >
                    + Nueva meta
                  </button>

                  <div className="px-5 py-3 rounded-[18px] bg-cyan-500/10 text-cyan-300 font-black text-base">
                    {goals.length} meta(s)
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const progress = goal.target
                    ? Math.min((goal.saved / goal.target) * 100, 100)
                    : 0

                  const remaining = Number(goal.target || 0) - Number(goal.saved || 0)

                  const today = new Date()
                  const targetDate = goal.date ? new Date(goal.date) : null

                  let suggested = 0

                  if (targetDate && remaining > 0) {
                    const monthsRemaining = Math.max(
                      1,
                      (targetDate.getFullYear() - today.getFullYear()) * 12 +
                        (targetDate.getMonth() - today.getMonth())
                    )

                    suggested = Math.ceil(remaining / monthsRemaining)
                  }

                  return (
                    <div
                      key={goal.id}
                      className="rounded-[22px] bg-gradient-to-br from-[#0f172d] to-[#0b1020] border border-white/10 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl mt-1">{goal.icon || '🎯'}</div>

                          <div>
                            <h3 className="text-xl font-black leading-tight max-w-[190px]">
                              {goal.name}
                            </h3>

                            <p className="text-white/40 text-sm mt-1">
                              Meta: RD${money(goal.target)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-4">
                          <div className="text-cyan-300 text-xl font-black">
                            {Math.round(progress)}%
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setEditingGoalId(goal.id)
                                setGoalName(goal.name)
                                setGoalTarget(String(goal.target || ''))
                                setGoalSaved(String(goal.saved || ''))
                                setGoalMonthly(String(goal.monthly || ''))
                                setGoalDate(goal.date || '')
                                setGoalIcon(goal.icon || '🎯')
                                setGoalLocation(goal.location || 'Efectivo')
                                setShowGoalModal(true)
                              }}
                              className="w-9 h-9 rounded-[14px] bg-cyan-500/10 text-sm"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() =>
                                setGoals((prev) =>
                                  prev.filter((item) => item.id !== goal.id)
                                )
                              }
                              className="w-9 h-9 rounded-[14px] bg-red-500/10 text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mt-6">
                        <div
                          className="h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-white/40 text-xs uppercase tracking-wider">
                            Ahorrado
                          </p>

                          <h4 className="text-base font-black text-emerald-300 mt-1">
                            RD${money(goal.saved)}
                          </h4>
                        </div>

                        <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-white/40 text-xs uppercase tracking-wider">
                            Restante
                          </p>

                          <h4 className="text-base font-black text-yellow-300 mt-1">
                            RD${money(remaining)}
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="rounded-[16px] bg-cyan-500/10 p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-cyan-300 text-xs uppercase tracking-wider">
                            Meta mensual
                          </p>

                          <h4 className="text-sm font-black text-cyan-100 mt-2 leading-snug">
                            RD${money(goal.monthly)}
                          </h4>
                        </div>

                        <div className="rounded-[16px] bg-white/[0.04] p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-white/40 text-xs uppercase tracking-wider">
                            Fecha objetivo
                          </p>

                          <h4 className="text-sm font-black mt-2 leading-snug">
                            {goal.date || 'Sin fecha'}
                          </h4>
                        </div>

                        <div className="rounded-[16px] bg-violet-500/10 p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-violet-300 text-xs uppercase tracking-wider">
                            Ubicación
                          </p>

                          <h4 className="text-sm font-black text-violet-100 mt-2 leading-snug break-words">
                            {goal.location || 'Efectivo'}
                          </h4>
                        </div>

                        <div className="rounded-[16px] bg-emerald-500/10 p-3 min-h-[82px] flex flex-col justify-between">
                          <p className="text-emerald-300 text-xs uppercase tracking-wider">
                            Ahorro sugerido
                          </p>

                          <h4 className="text-sm font-black text-emerald-100 mt-2 leading-snug">
                            RD${money(suggested)}
                          </h4>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {showGoalModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                <div className="w-full max-w-2xl rounded-[32px] bg-[#0B1120] border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-4xl font-black">
                      {editingGoalId ? 'Editar meta' : 'Nueva meta'}
                    </h2>

                    <button
                      onClick={() => setShowGoalModal(false)}
                      className="w-12 h-12 rounded-2xl bg-white/5"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {['🎯', '🏠', '✈️', '🚗', '💻', '💰', '📚', '❤️'].map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setGoalIcon(icon)}
                        className={`h-16 rounded-[18px] border text-3xl transition-all ${goalIcon === icon ? 'bg-cyan-500 border-cyan-300 scale-105' : 'bg-white/[0.04] border-white/5 hover:bg-cyan-500/30'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <input
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      placeholder="Nombre de la meta"
                      className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                    />

                    <input
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="Monto meta"
                      className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        value={goalSaved}
                        onChange={(e) => setGoalSaved(e.target.value)}
                        placeholder="Ahorro acumulado"
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                      />

                      <input
                        value={goalMonthly}
                        onChange={(e) => setGoalMonthly(e.target.value)}
                        placeholder="Meta mensual"
                        className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                      />
                    </div>

                    <select
                      value={goalLocation}
                      onChange={(e) => setGoalLocation(e.target.value)}
                      className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4 text-white"
                    >
                      <option className="bg-[#0B1120]">Efectivo</option>
                      {accounts.map((account) => (
                        <option
                          key={account.id}
                          value={`${account.bank} - ${account.type}`}
                          className="bg-[#0B1120]"
                        >
                          {account.bank} - {account.type}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="w-full rounded-[20px] bg-white/[0.04] border border-white/10 px-5 py-4"
                    />

                    <button
                      onClick={addGoal}
                      className="w-full rounded-[20px] bg-gradient-to-r from-cyan-400 to-cyan-500 py-4 text-black font-black text-lg"
                    >
                      {editingGoalId ? 'Guardar cambios' : 'Guardar meta'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
