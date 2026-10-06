import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import Badge from '../../../components/UI/Badge';
import Input from '../../../components/UI/Input';
import AddSubcontractModal from './AddSubcontractModal';
import EditSubcontractModal from './EditSubcontractModal';
import SubcontractLedgerModal from './SubcontractLedgerModal';
import { deleteSubcontract } from '../../../services/firestore';
import {
    Plus,
    Search,
    BookOpen,
    Edit,
    Trash2,
    Calendar,
    Phone,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    Building2,
    DollarSign,
    Briefcase
} from 'lucide-react';

export default function SubcontractsSection({ projectId, projectName }) {
    const [subcontracts, setSubcontracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSubcontract, setEditingSubcontract] = useState(null);
    const [activeLedgerSubcontract, setActiveLedgerSubcontract] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        const subcontractsQuery = query(
            collection(db, 'projects', projectId, 'subcontracts'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(subcontractsQuery, (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setSubcontracts(items);
            setLoading(false);

            // If a ledger is currently open, keep its data fresh
            setActiveLedgerSubcontract((prev) => {
                if (!prev) return null;
                const updated = items.find((item) => item.id === prev.id);
                return updated || null;
            });
        });

        return () => unsub();
    }, [projectId]);

    const handleDelete = async (subcontract) => {
        const confirmMsg = `Are you sure you want to delete subcontract for "${subcontract.contractorName}"?\n\nThis will also remove its payment ledger history and linked expenses.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteSubcontract(projectId, subcontract.id);
        } catch (err) {
            console.error('Failed to delete subcontract:', err);
            alert('Failed to delete subcontract.');
        }
    };

    // Filtered items
    const filteredSubcontracts = subcontracts.filter((item) => {
        const matchesSearch =
            (item.contractorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.trade || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.phone || '').includes(searchQuery);

        const matchesStatus =
            statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Subcontract accounting statistics
    const totalContractValue = subcontracts.reduce((sum, s) => sum + Number(s.contractAmount || 0), 0);
    const totalPaid = subcontracts.reduce((sum, s) => sum + Number(s.totalPaid || 0), 0);
    const totalOutstanding = totalContractValue - totalPaid;
    const activeCount = subcontracts.filter((s) => s.status === 'active').length;

    return (
        <div className="space-y-6">
            {/* Top Stat Cards for Subcontracts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                Total Subcontracts
                            </p>
                            <p className="text-2xl font-bold text-indigo-950 mt-1">
                                LKR {totalContractValue.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                            <Briefcase className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                        {subcontracts.length} Subcontract{subcontracts.length === 1 ? '' : 's'} committed
                    </p>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                Total Settled / Paid
                            </p>
                            <p className="text-2xl font-bold text-emerald-950 mt-1">
                                LKR {totalPaid.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2">
                        {totalContractValue > 0 ? Math.round((totalPaid / totalContractValue) * 100) : 0}% of contracts paid
                    </p>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                Outstanding Payable
                            </p>
                            <p className="text-2xl font-bold text-amber-950 mt-1">
                                LKR {totalOutstanding.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                        Remaining balance across trades
                    </p>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                Active Subcontractors
                            </p>
                            <p className="text-2xl font-bold text-purple-950 mt-1">
                                {activeCount} <span className="text-sm font-normal text-purple-700">/ {subcontracts.length}</span>
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                            <Building2 className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                        Ongoing on-site subcontractors
                    </p>
                </Card>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search contractor, trade..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
                        />
                    </div>

                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg text-xs">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'all'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            All ({subcontracts.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'active'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Active ({subcontracts.filter((s) => s.status === 'active').length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('completed')}
                            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${statusFilter === 'completed'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Completed ({subcontracts.filter((s) => s.status === 'completed').length})
                        </button>
                    </div>
                </div>

                <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto shadow-sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Subcontract
                </Button>
            </div>

            {/* Subcontracts Table */}
            <Card className="p-0 overflow-hidden shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Subcontractor & Trade
                                </th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Timeline
                                </th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Contract Value
                                </th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Paid Amount
                                </th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Balance Due
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Account Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading subcontracts...
                                    </td>
                                </tr>
                            ) : filteredSubcontracts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                                        <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="font-semibold text-gray-700">No subcontracts found</p>
                                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                            {searchQuery
                                                ? 'No subcontractors matched your search filter.'
                                                : 'Assign subcontractors (electrical, plumbing, masonry, etc.) and track their payments.'}
                                        </p>
                                        {!searchQuery && (
                                            <Button
                                                size="sm"
                                                onClick={() => setIsAddOpen(true)}
                                                className="mt-4"
                                            >
                                                <Plus className="h-4 w-4 mr-1" /> Add First Subcontract
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredSubcontracts.map((sub) => {
                                    const cAmount = Number(sub.contractAmount || 0);
                                    const pAmount = Number(sub.totalPaid || 0);
                                    const bal = cAmount - pAmount;
                                    const pct = cAmount > 0 ? Math.min(100, Math.round((pAmount / cAmount) * 100)) : 0;

                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50/70 transition-colors">
                                            {/* Subcontractor details */}
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-gray-900 flex items-center">
                                                    {sub.contractorName}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <Badge variant="blue" className="text-[11px] py-0 px-2">
                                                        {sub.trade || 'General'}
                                                    </Badge>
                                                    {sub.contactPerson && (
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <User className="h-3 w-3 mr-0.5 text-gray-400" />
                                                            {sub.contactPerson}
                                                        </span>
                                                    )}
                                                    {sub.phone && (
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <Phone className="h-3 w-3 mr-0.5 text-gray-400" />
                                                            {sub.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Timeline */}
                                            <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">
                                                {sub.startDate && (
                                                    <div>
                                                        <span className="text-gray-400">Start: </span>
                                                        {new Date(sub.startDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {sub.dueDate && (
                                                    <div>
                                                        <span className="text-gray-400">Due: </span>
                                                        {new Date(sub.dueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {!sub.startDate && !sub.dueDate && (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Contract Value */}
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                                                LKR {cAmount.toLocaleString()}
                                            </td>

                                            {/* Paid Amount */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="text-sm font-bold text-green-600">
                                                    LKR {pAmount.toLocaleString()}
                                                </div>
                                                <div className="flex items-center justify-end space-x-1 mt-1 text-[11px] text-gray-500">
                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                        <div
                                                            className="bg-green-500 h-1.5 rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{pct}%</span>
                                                </div>
                                            </td>

                                            {/* Balance Due */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className={`text-sm font-bold ${bal <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                    LKR {bal.toLocaleString()}
                                                </div>
                                                <div className="text-[11px] text-gray-400">
                                                    {bal <= 0 ? 'Settled' : 'Pending'}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-5 py-4 text-center whitespace-nowrap">
                                                <Badge
                                                    variant={
                                                        sub.status === 'completed'
                                                            ? 'green'
                                                            : sub.status === 'on_hold'
                                                                ? 'yellow'
                                                                : 'blue'
                                                    }
                                                >
                                                    {sub.status === 'completed'
                                                        ? 'Completed'
                                                        : sub.status === 'on_hold'
                                                            ? 'On Hold'
                                                            : 'Active'}
                                                </Badge>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => setActiveLedgerSubcontract(sub)}
                                                        className="text-xs py-1 px-2.5 shadow-sm"
                                                    >
                                                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                                                        Account Ledger
                                                    </Button>
                                                    <button
                                                        onClick={() => setEditingSubcontract(sub)}
                                                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit details"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub)}
                                                        className="text-gray-500 hover:text-red-600 p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete subcontract"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {filteredSubcontracts.length > 0 && (
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                <tr>
                                    <td colSpan="2" className="px-5 py-3 text-xs font-bold text-gray-700 uppercase">
                                        Total ({filteredSubcontracts.length} Subcontracts)
                                    </td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">
                                        LKR {totalContractValue.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-green-700">
                                        LKR {totalPaid.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-amber-800">
                                        LKR {totalOutstanding.toLocaleString()}
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </Card>

            {/* Add Subcontract Modal */}
            <AddSubcontractModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                projectId={projectId}
            />

            {/* Edit Subcontract Modal */}
            <EditSubcontractModal
                isOpen={!!editingSubcontract}
                onClose={() => setEditingSubcontract(null)}
                projectId={projectId}
                subcontract={editingSubcontract}
            />

            {/* Subcontract Account Ledger Modal */}
            <SubcontractLedgerModal
                isOpen={!!activeLedgerSubcontract}
                onClose={() => setActiveLedgerSubcontract(null)}
                projectId={projectId}
                projectName={projectName}
                subcontract={activeLedgerSubcontract}
            />
        </div>
    );
}
