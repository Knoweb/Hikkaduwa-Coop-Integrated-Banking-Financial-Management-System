import React, { useState, useEffect } from 'react';
import { 
  Users, PiggyBank, ShieldCheck, Scale, 
  TrendingUp, Activity, FileText, AlertCircle, ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import * as PawningService from '../services/pawning.service';
import * as LoanService from '../services/loan.service';
import * as AuthService from '../services/auth.service';

interface BranchOverviewViewProps {
  branchId: number;
  members: any[];
  accounts: any[];
  loans: any[];
  fixedDeposits: any[];
  setTab: (tab: string) => void;
  t: (key: string) => string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const BranchOverviewView: React.FC<BranchOverviewViewProps> = ({
  branchId, members, accounts, loans, fixedDeposits, setTab, t
}) => {
  const [pawningTickets, setPawningTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userRole = AuthService.getCurrentUser()?.role || '';

  useEffect(() => {
    const fetchPawning = async () => {
      try {
        const tickets = await PawningService.getTicketsByBranch(branchId);
        setPawningTickets(tickets || []);
      } catch (err) {
        console.error('Failed to fetch pawning tickets', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPawning();
  }, [branchId]);

  // Calculations
  const activeMembers = members.filter(m => m.isMember !== false).length;
  const nonMembers = members.length - activeMembers;

  const totalSavings = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalFDs = fixedDeposits.reduce((sum, fd) => sum + Number(fd.principalAmount || fd.depositAmount || 0), 0);
  const totalDeposits = totalSavings + totalFDs;

  const totalLoansOutstanding = loans.filter(l => l.status === 'ACTIVE' || l.status === 'COMPLETED').reduce((sum, l) => {
    return sum + Number(l.outstandingBalance || l.amount || l.requestedAmount || 0);
  }, 0);

  const managerPending = loans.filter(l => l.currentStage === 'STAGE_1_MANAGER_APPROVAL' && l.status === 'PENDING').length;
  const committeePending = loans.filter(l => l.currentStage === 'STAGE_2_LOAN_COMMITTEE_APPROVAL' && l.status === 'PENDING').length;
  const disbursementPending = loans.filter(l => (l.currentStage === 'STAGE_3_APPROVED' || l.status === 'APPROVED') && l.status !== 'ACTIVE' && l.status !== 'COMPLETED' && l.status !== 'REJECTED' && l.currentStage !== 'DISBURSED').length;
  const pendingLoans = managerPending + committeePending + disbursementPending;
  
  const totalPawningAdvances = pawningTickets.filter(p => p.status === 'ACTIVE').reduce((sum, p) => sum + Number(p.advanceAmount || p.advance_amount || 0), 0);
  const pendingPawning = pawningTickets.filter(p => p.status === 'PENDING').length;

  // Chart Data
  const loanTypes = loans.reduce((acc: any, l) => {
    if (l.status !== 'ACTIVE' && l.status !== 'COMPLETED') return acc;
    const type = l.loanType?.name || l.loanTypeStr || 'Normal Loan';
    const translatedType = t(type);
    if (!acc[translatedType]) acc[translatedType] = 0;
    acc[translatedType] += Number(l.outstandingBalance || l.amount || l.requestedAmount || 0);
    return acc;
  }, {});

  const loanPieData = Object.keys(loanTypes).map(key => ({
    name: key,
    value: loanTypes[key]
  }));

  const comparisonData = [
    {
      name: t('Deposits vs Advances'),
      [t('Savings')]: totalSavings,
      [t('Fixed Deposits')]: totalFDs,
      [t('Loans')]: totalLoansOutstanding,
      [t('Pawning')]: totalPawningAdvances
    }
  ];

  const formatCurrency = (val: number) => `Rs. ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Pending Actions Alert */}
      {(pendingLoans > 0 || pendingPawning > 0) && (userRole === 'BRANCH_MANAGER' || userRole === 'ORGANIZATION_ADMIN' || userRole === 'PLATFORM_ADMIN') && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-start justify-between shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-500 mt-0.5" size={20} />
            <div>
              <h4 className="text-orange-800 font-bold text-sm">{t(`ක්‍රියාමාර්ග ගැනීමට ඇත (Action Required)`)}</h4>
              <div className="text-orange-700 text-xs mt-1.5 space-y-1 font-medium">
                {managerPending > 0 && (
                  <p>• {t(`ශාඛා කළමනාකරුගේ අනුමැතිය සඳහා ණය අයදුම්පත්`)} <span className="font-bold text-orange-900">{managerPending}</span> {t(`ක් ඇත. (Branch Manager Approval)`)}</p>
                )}
                {committeePending > 0 && (
                  <p>• {t(`ණය කමිටුවේ අනුමැතිය සඳහා ණය අයදුම්පත්`)} <span className="font-bold text-orange-900">{committeePending}</span> {t(`ක් ඇත. (Loan Committee Approval)`)}</p>
                )}
                {disbursementPending > 0 && (
                  <p>• {t(`මුදල් නිදහස් කිරීමට (කැෂියර්/මුදල් අයකැමි) ණය අයදුම්පත්`)} <span className="font-bold text-orange-900">{disbursementPending}</span> {t(`ක් ඇත. (Disbursement / Payout)`)}</p>
                )}
                {pendingPawning > 0 && (
                  <p>• {t(`අනුමැතිය සඳහා පොරොත්තු වන රන් උකස් පත්`)} <span className="font-bold text-orange-900">{pendingPawning}</span> {t(`ක් ඇත. (Pawning Approval)`)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setTab('members')}>
          <div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">{t(`මුළු සාමාජිකයින් (Total Members)`)}</p>
            <h3 className="text-2xl font-black text-slate-800">{activeMembers}</h3>
            <p className="text-xs text-slate-400 mt-1">+{nonMembers} {t(`සාමාජික නොවන (Non-members)`)}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setTab('savings')}>
          <div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">{t(`ඉතුරුම් (Savings)`)}</p>
            <h3 className="text-xl font-black text-slate-800">{formatCurrency(totalSavings)}</h3>
            <p className="text-xs text-slate-400 mt-1">{accounts.length} {t(`ගිණුම් (Accounts)`)}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <PiggyBank size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setTab('fds')}>
          <div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 group-hover:text-teal-600 transition-colors">{t(`ස්ථාවර තැන්පතු (Fixed Deposits)`)}</p>
            <h3 className="text-xl font-black text-slate-800">{formatCurrency(totalFDs)}</h3>
            <p className="text-xs text-slate-400 mt-1">{fixedDeposits.length} {t(`තැන්පතු (FDs)`)}</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setTab('loans')}>
          <div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">{t(`ගෙවීමට ඇති ණය (Outstanding Loans)`)}</p>
            <h3 className="text-xl font-black text-slate-800">{formatCurrency(totalLoansOutstanding)}</h3>
            <p className="text-xs text-slate-400 mt-1">{loans.filter(l => l.status === 'ACTIVE' || l.status === 'COMPLETED').length} {t(`සක්‍රීය ණය (Active Loans)`)}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setTab('pawning')}>
          <div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1 group-hover:text-purple-600 transition-colors">{t(`උකස් අත්තිකාරම් (Pawning Advances)`)}</p>
            <h3 className="text-xl font-black text-slate-800">{formatCurrency(totalPawningAdvances)}</h3>
            <p className="text-xs text-slate-400 mt-1">{pawningTickets.filter(p => p.status === 'ACTIVE').length} {t(`සක්‍රීය උකස් (Active Tickets)`)}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Scale size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Loan Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" /> {t(`Loan Portfolio Distribution`)}
          </h3>
          {loanPieData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {loanPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              {t(`No active loans available for distribution.`)}
            </div>
          )}
        </div>

        {/* Deposits vs Loans */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> {t(`Liquidity Overview`)}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `Rs. ${(value / 1000000).toFixed(1)}M`} axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey={t('Savings')} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey={t('Fixed Deposits')} fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey={t('Loans')} fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey={t('Pawning')} fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BranchOverviewView;
