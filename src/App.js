import React, { useEffect, useState, useMemo } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  AlertTriangle,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  Sprout,
  Sparkles,
  Lightbulb,
  LogOut,
  ChevronRight,
  Clock,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  Pie,
  Cell,
  Legend,
  PieChart as ChartContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const categoryStyles = {
  民宿訂房: 'bg-blue-600 text-white',
  農產品銷售: 'bg-emerald-600 text-white',
  人力支出: 'bg-orange-500 text-white',
  水電費: 'bg-cyan-700 text-white',
  農業支出: 'bg-slate-700 text-white',
  一般收入: 'bg-indigo-600 text-white',
  其他支出: 'bg-slate-400 text-white',
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, forceUpdate] = useState(0);
  const [newEntry, setNewEntry] = useState({
    title: '',
    amount: '',
    type: 'income',
    category: '一般收入',
  });

  const radarData = [
    { subject: '獲利能力', A: 85, fullMark: 100 },
    { subject: '成本控制', A: 65, fullMark: 100 },
    { subject: '營運效率', A: 90, fullMark: 100 },
    { subject: '銷售多樣化', A: 70, fullMark: 100 },
    { subject: '執行力', A: 80, fullMark: 100 },
  ];

  const [aiAnalysis, setAiAnalysis] = useState({
    summary: '經營者你好，目前的獲利能力高於同業 15%，但成本控制仍有進步空間。建議針對電力與肥料支出進行優化。',
    advice: [
      {
        title: '支出優化策略',
        content: '目前的農業支出佔比較高，建議檢查是否有節流空間。',
        icon: <ArrowDownRight className="text-red-500" />,
        priority: '緊急',
        color: 'bg-red-50',
      },
      {
        title: '營收擴展建議',
        content: '民宿訂房收入為主要來源，建議可搭配農產品 DIY 活動提升客單價。',
        icon: <Sparkles className="text-blue-500" />,
        priority: '中等',
        color: 'bg-blue-50',
      },
      {
        title: '能源節省計劃',
        content: '電費支出呈現上升趨勢，建議檢查溫室設備的能源效率。',
        icon: <Lightbulb className="text-emerald-500" />,
        priority: '長期',
        color: 'bg-emerald-50',
      },
    ],
  });

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLastUpdated(new Date());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, profit: income - expense };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const cats = {};
    transactions.forEach((t) => {
      cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
    });
    return Object.keys(cats).map((name) => ({ name, value: cats[name] }));
  }, [transactions]);

  const getRelativeTime = (date) => {
    if (!date) return '尚未更新';
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return '剛剛';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
    return `${Math.floor(diff / 3600)} 小時前`;
  };

  const runFullAIAnalysis = () => {
    setLoadingAI(true);

    setTimeout(() => {
      setAiAnalysis({
        summary: '根據目前收支資料，民宿訂房是主要收入來源，農業支出與水電費則是主要成本。建議優先控管固定支出，並增加農產品體驗活動，提高整體營收。',
        advice: [
          {
            title: '控制固定成本',
            content: '水電費與農業支出偏高，可評估節能設備與採購成本控管。',
            icon: <AlertTriangle className="text-red-500" />,
            priority: '緊急',
            color: 'bg-red-50',
          },
          {
            title: '提高客單價',
            content: '可將民宿住宿與草莓採摘、農產品 DIY 體驗整合成套裝方案。',
            icon: <Sparkles className="text-blue-500" />,
            priority: '中等',
            color: 'bg-blue-50',
          },
          {
            title: '建立月報表制度',
            content: '建議每月固定查看收入、支出與淨利變化，作為經營決策依據。',
            icon: <Lightbulb className="text-emerald-500" />,
            priority: '長期',
            color: 'bg-emerald-50',
          },
        ],
      });
      setLoadingAI(false);
    }, 800);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "transactions", editTarget.id), {
      title: editTarget.title,
      amount: Number(editTarget.amount),
      type: editTarget.type,
      category: editTarget.category,
      date: editTarget.date,
    });
    setEditTarget(null);
  };

  const handleDelete = (transaction) => {
    setDeleteTarget(transaction);
  };

  const confirmDelete = async () => {
    await deleteDoc(doc(db, "transactions", deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "transactions"), {
      title: newEntry.title,
      amount: Number(newEntry.amount),
      type: newEntry.type,
      category: newEntry.category,
      date: new Date().toISOString().split('T')[0],
    });

    setShowModal(false);
    setNewEntry({ title: '', amount: '', type: 'income', category: '一般收入' });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      <aside className="w-72 bg-[#111827] flex flex-col shadow-2xl relative z-30">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-[#10B981] p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20">
            <Sprout size={24} />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">清風農場</h1>
            <p className="text-[10px] text-[#10B981] font-bold tracking-wider">AI 財務管家</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { id: 'dashboard', label: '營運概覽', icon: <LayoutDashboard size={20} /> },
            { id: 'ledger', label: '收支流水帳', icon: <PlusCircle size={20} /> },
            { id: 'ai', label: 'AI 決策顧問', icon: <BrainCircuit size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-6 mb-4">
          <div className="bg-[#1F2937] rounded-2xl p-5 border border-white/5">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-3">System Status</p>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              展示模式運作正常
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="bg-slate-900/50 rounded-2xl p-4 text-white">
            <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase">目前帳號</p>
            <h4 className="font-bold text-sm mb-3">清風草莓農場</h4>
            <button className="flex items-center gap-2 text-slate-400 text-xs hover:text-white transition-colors">
              <LogOut size={14} /> 登出
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white px-10 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              {activeTab === 'ledger' ? '財務流水帳' : activeTab === 'ai' ? 'AI 智慧決策' : '營運概覽'}
              <span className="h-4 w-[1px] bg-slate-200 mx-2"></span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock size={12} /> 數據最後更新於 {getRelativeTime(lastUpdated)}
              </span>
            </h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all font-bold text-sm"
          >
            <PlusCircle size={18} /> 新增交易
          </button>
        </header>

        <div className="p-10 space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold mb-2">當月總收入</p>
                  <p className="text-3xl font-black text-slate-900">NT$ {stats.income.toLocaleString()}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold mb-2">當月總支出</p>
                  <p className="text-3xl font-black text-slate-900">NT$ {stats.expense.toLocaleString()}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500">
                  <p className="text-slate-400 text-xs font-bold mb-2">預估淨利</p>
                  <p className="text-3xl font-black text-emerald-600">NT$ {stats.profit.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold mb-8 flex items-center gap-2 text-slate-500 uppercase tracking-widest">
                  <PieChart size={16} /> 收支類別佔比分析
                </h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartContainer>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="middle" align="right" layout="vertical" />
                    </ChartContainer>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">日期</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">交易詳情</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">分類標籤</th>
                    <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">金額 (TWD)</th>
                    <th className="px-10 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-10 py-8 text-xs text-slate-400 font-medium font-mono">{t.date}</td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                            {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>
                          <span className="font-bold text-slate-700 text-sm">{t.title}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${categoryStyles[t.category] || 'bg-slate-100 text-slate-500'}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-10 py-8 text-right font-black text-base font-mono ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {t.type === 'income' ? `+ ${Number(t.amount).toLocaleString()}` : Number(t.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-8 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => setEditTarget({ ...t })}
                            className="text-slate-400 hover:text-white hover:bg-slate-500 p-2 rounded-xl transition-all"
                            title="編輯此筆紀錄"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="text-red-400 hover:text-white hover:bg-red-500 p-2 rounded-xl transition-all"
                            title="刪除此筆紀錄"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 self-start flex items-center gap-2">
                  <BrainCircuit size={18} className="text-emerald-500" /> AI 經營五維分析
                </h3>

                <div className="w-full h-[320px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#F1F5F9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="農場指標" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 w-full mb-4">
                  <p className="text-sm text-emerald-800 leading-relaxed font-medium">{aiAnalysis.summary}</p>
                </div>

                <button
                  disabled={loadingAI}
                  onClick={runFullAIAnalysis}
                  className="w-full py-4 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl"
                >
                  {loadingAI ? 'AI 深度分析中...' : <><Sparkles size={14} /> 更新 AI 診斷報告</>}
                </button>
              </div>

              <div className="lg:col-span-7 space-y-4">
                {aiAnalysis.advice.map((adv, i) => (
                  <div key={i} className="bg-white p-7 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-md transition-all group">
                    <div className={`${adv.color} p-5 rounded-2xl group-hover:rotate-6 transition-transform text-slate-700`}>{adv.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 text-base">{adv.title}</h4>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${adv.priority === '緊急' ? 'bg-red-100 text-red-600' : adv.priority === '中等' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {adv.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{adv.content}</p>
                      <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        標記為已執行 <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-8 text-slate-900 text-center">紀錄新交易</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setNewEntry({ ...newEntry, type: 'income' })} className={`py-4 rounded-2xl font-bold text-xs transition-all border-2 ${newEntry.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  收入項目
                </button>
                <button type="button" onClick={() => setNewEntry({ ...newEntry, type: 'expense' })} className={`py-4 rounded-2xl font-bold text-xs transition-all border-2 ${newEntry.type === 'expense' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  支出項目
                </button>
              </div>
              <input required type="text" className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="交易項目名稱" value={newEntry.title} onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="金額" value={newEntry.amount} onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })} />
                <select className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-500" value={newEntry.category} onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}>
                  {Object.keys(categoryStyles).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold text-sm">取消</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20">儲存帳目</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 text-slate-900 text-center">編輯交易紀錄</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setEditTarget({ ...editTarget, type: 'income' })} className={`py-4 rounded-2xl font-bold text-xs transition-all border-2 ${editTarget.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  收入項目
                </button>
                <button type="button" onClick={() => setEditTarget({ ...editTarget, type: 'expense' })} className={`py-4 rounded-2xl font-bold text-xs transition-all border-2 ${editTarget.type === 'expense' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  支出項目
                </button>
              </div>
              <input required type="text" className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="交易項目名稱" value={editTarget.title} onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="金額" value={editTarget.amount} onChange={(e) => setEditTarget({ ...editTarget, amount: e.target.value })} />
                <select className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none font-bold text-sm text-slate-500" value={editTarget.category} onChange={(e) => setEditTarget({ ...editTarget, category: e.target.value })}>
                  {Object.keys(categoryStyles).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-4 text-slate-400 font-bold text-sm">取消</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20">儲存變更</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="bg-red-50 p-4 rounded-2xl">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">確認刪除</h3>
              <p className="text-sm text-slate-500">
                確定要刪除「<span className="font-bold text-slate-700">{deleteTarget.title}</span>」這筆紀錄嗎？此動作無法復原。
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
