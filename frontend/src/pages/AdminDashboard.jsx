import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Search, 
  TrendingUp, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('organizations'); // 'organizations' or 'users'
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [orgsRes, usersRes, impactRes] = await Promise.all([
        api.get('/admin/organizations'),
        api.get('/admin/users'),
        api.get('/analytics/impact'),
      ]);

      if (orgsRes.data?.success) setOrganizations(orgsRes.data.organizations);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
      if (impactRes.data?.success) setStats(impactRes.data.data);
    } catch (err) {
      console.warn('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyOrg = async (orgId, status) => {
    try {
      setActionLoading(orgId);
      const res = await api.patch(`/admin/organizations/${orgId}/verify`, {
        status,
        note: `Status updated by Admin ${user?.name} on ${new Date().toLocaleDateString()}`,
      });

      if (res.data?.success) {
        toast.success(`Organization ${status.toLowerCase()} successfully`);
        setOrganizations((prev) =>
          prev.map((org) =>
            org._id === orgId ? { ...org, verificationStatus: status } : org
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update organization status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoading(userId);
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter organizations by search
  const filteredOrgs = organizations.filter(
    (o) =>
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.address?.city?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 app-page-frame">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 app-page-heading">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            PLATFORM ADMINISTRATION
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Manage the network
          </h1>
          <p className="text-slate-500 text-sm">
            Review organisation requests, manage accounts and keep the network running smoothly.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-center"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Meals Rescued</span>
            <h4 className="text-2xl font-bold text-emerald-600 font-mono">
              {stats.totalMealsRescued?.toLocaleString()}
            </h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Food Diverted</span>
            <h4 className="text-2xl font-bold text-teal-600 font-mono">
              {stats.totalKgSaved?.toLocaleString()} kg
            </h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Registered Facilities</span>
            <h4 className="text-2xl font-bold text-slate-800 font-mono">
              {organizations.length}
            </h4>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">Active Accounts</span>
            <h4 className="text-2xl font-bold text-slate-800 font-mono">
              {users.length}
            </h4>
          </div>
        </div>
      )}

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'organizations'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organizations ({organizations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts ({users.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

      </div>

      {/* Organizations View */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Loading organizations...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No organizations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrgs.map((org) => {
                    const isPending = org.verificationStatus === 'PENDING';
                    const isApproved = org.verificationStatus === 'APPROVED';

                    return (
                      <tr key={org._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 text-sm">{org.name}</p>
                          <p className="text-slate-400">{org.email || org.owner?.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {org.type === 'FOOD_PROVIDER' ? '🍱 Donor' : '🤝 NGO Shelter'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {org.address?.city || 'Lucknow'}, {org.address?.state || 'UP'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {org.verificationStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {!isApproved && (
                            <button
                              onClick={() => handleVerifyOrg(org._id, 'APPROVED')}
                              disabled={actionLoading === org._id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {isApproved && (
                            <button
                              onClick={() => handleVerifyOrg(org._id, 'REJECTED')}
                              disabled={actionLoading === org._id}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users View */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-xs">Loading user registry...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No user accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Email Verified</th>
                    <th className="py-3 px-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isEmailVerified ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-slate-400">Unverified</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={actionLoading === u._id}
                          className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="donor">donor</option>
                          <option value="ngo">ngo</option>
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
