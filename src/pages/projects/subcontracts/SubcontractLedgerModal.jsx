import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import Modal from '../../../components/UI/Modal';
import Button from '../../../components/UI/Button';
import Badge from '../../../components/UI/Badge';
import Input from '../../../components/UI/Input';
import Table from '../../../components/UI/Table';
import {
    addSubcontractPayment,
    updateSubcontractPayment,
    deleteSubcontractPayment
} from '../../../services/firestore';
import {
    Plus,
    Printer,
    Edit,
    Trash2,
    DollarSign,
    CheckCircle,
    Calendar,
    Phone,
    User,
    FileText,
    ArrowDownRight,
    RefreshCw
} from 'lucide-react';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'];

export default function SubcontractLedgerModal({
    isOpen,
    onClose,
    projectId,
    projectName,
    subcontract
}) {
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(true);

    // Add Payment Form States
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [referenceNo, setReferenceNo] = useState('');
    const [notes, setNotes] = useState('');
    const [syncWithExpenses, setSyncWithExpenses] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    // Edit Payment States
    const [editingPayment, setEditingPayment] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editMethod, setEditMethod] = useState('Cash');
    const [editReferenceNo, setEditReferenceNo] = useState('');
    const [editNotes, setEditNotes] = useState('');

    useEffect(() => {
        if (!subcontract || !projectId || !isOpen) return;

        const paymentsQuery = query(
            collection(db, 'projects', projectId, 'subcontracts', subcontract.id, 'payments'),
            orderBy('date', 'desc')
        );

        const unsub = onSnapshot(paymentsQuery, (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setPayments(list);
            setLoadingPayments(false);
        });

        return () => unsub();
    }, [subcontract, projectId, isOpen]);

    if (!subcontract) return null;

    const contractAmount = Number(subcontract.contractAmount || 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balanceDue = contractAmount - totalPaid;
    const progressPercent = contractAmount > 0
        ? Math.min(100, Math.round((totalPaid / contractAmount) * 100))
        : 0;

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setError('');

        if (!amount || Number(amount) <= 0) {
            setError('Please enter a valid payment amount.');
            return;
        }

        setActionLoading(true);
        try {
            await addSubcontractPayment(
                projectId,
                subcontract.id,
                {
                    amount: Number(amount),
                    date,
                    paymentMethod,
                    referenceNo: referenceNo.trim(),
                    notes: notes.trim()
                },
                subcontract.contractorName,
                syncWithExpenses
            );

            // Reset payment form
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod('Cash');
            setReferenceNo('');
            setNotes('');
            setIsAddPaymentOpen(false);
        } catch (err) {
            console.error('Failed to add subcontract payment:', err);
            setError('Failed to record payment. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartEditPayment = (payment) => {
        setEditingPayment(payment);
        setEditAmount(payment.amount);
        setEditDate(payment.date);
        setEditMethod(payment.paymentMethod || 'Cash');
        setEditReferenceNo(payment.referenceNo || '');
        setEditNotes(payment.notes || '');
    };

    const handleSaveEditPayment = async (e) => {
        e.preventDefault();
        if (!editAmount || Number(editAmount) <= 0) return;

        setActionLoading(true);
        try {
            await updateSubcontractPayment(
                projectId,
                subcontract.id,
                editingPayment.id,
                editingPayment.amount,
                {
                    amount: Number(editAmount),
                    date: editDate,
                    paymentMethod: editMethod,
                    referenceNo: editReferenceNo.trim(),
                    notes: editNotes.trim(),
                    syncedExpenseId: editingPayment.syncedExpenseId
                },
                subcontract.contractorName
            );
            setEditingPayment(null);
        } catch (err) {
            console.error('Failed to update payment:', err);
            alert('Failed to update payment.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePayment = async (payment) => {
        if (!window.confirm(`Are you sure you want to delete this payment of LKR ${Number(payment.amount).toLocaleString()}?`)) {
            return;
        }

        try {
            await deleteSubcontractPayment(
                projectId,
                subcontract.id,
                payment.id,
                payment.amount,
                payment.syncedExpenseId
            );
        } catch (err) {
            console.error('Failed to delete payment:', err);
            alert('Failed to delete payment.');
        }
    };

    const handlePrintStatement = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the statement.');
            return;
        }

        const paymentRows = payments.map((p, index) => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(p.date).toLocaleDateString()}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${p.notes || '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${p.paymentMethod || 'Cash'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${p.referenceNo || '-'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">LKR ${Number(p.amount).toLocaleString()}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Subcontract Account Statement - ${subcontract.contractorName}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #111; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                    .header p { margin: 4px 0 0; color: #555; font-size: 13px; }
                    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 14px; }
                    .meta-card { background: #f9f9f9; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
                    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; text-align: center; }
                    .summary-box { padding: 12px; border-radius: 6px; border: 1px solid #ddd; }
                    .summary-box.total { background: #f0f7ff; border-color: #bee3f8; }
                    .summary-box.paid { background: #f0fff4; border-color: #c6f6d5; }
                    .summary-box.balance { background: #fffaf0; border-color: #feebc8; }
                    .summary-label { font-size: 12px; color: #555; text-transform: uppercase; font-weight: bold; }
                    .summary-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
                    th { background: #f1f5f9; padding: 10px 8px; border: 1px solid #ddd; text-align: left; }
                    .signatures { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 40px; }
                    .sig-line { border-top: 1px dashed #333; width: 180px; text-align: center; padding-top: 8px; font-size: 13px; font-weight: 500; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>JAL ENTERPRISES</h1>
                    <p>Subcontractor Account Statement & Payment Ledger</p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                </div>

                <div class="meta-grid">
                    <div class="meta-card">
                        <strong>Project:</strong> ${projectName || 'Project'}<br/>
                        <strong>Trade / Scope:</strong> ${subcontract.trade || 'General'}<br/>
                        <strong>Status:</strong> ${subcontract.status ? subcontract.status.toUpperCase() : 'ACTIVE'}
                    </div>
                    <div class="meta-card">
                        <strong>Subcontractor:</strong> ${subcontract.contractorName}<br/>
                        <strong>Contact:</strong> ${subcontract.contactPerson || '-'}<br/>
                        <strong>Phone:</strong> ${subcontract.phone || '-'}
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-box total">
                        <div class="summary-label">Total Contract Value</div>
                        <div class="summary-val">LKR ${contractAmount.toLocaleString()}</div>
                    </div>
                    <div class="summary-box paid">
                        <div class="summary-label">Total Amount Paid</div>
                        <div class="summary-val" style="color: #276749;">LKR ${totalPaid.toLocaleString()}</div>
                    </div>
                    <div class="summary-box balance">
                        <div class="summary-label">Outstanding Balance</div>
                        <div class="summary-val" style="color: #c53030;">LKR ${balanceDue.toLocaleString()}</div>
                    </div>
                </div>

                <h3 style="margin-bottom: 8px;">Payment Transaction Ledger (${payments.length} Payments)</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center; width: 40px;">#</th>
                            <th style="width: 100px;">Date</th>
                            <th>Milestone / Description</th>
                            <th style="width: 110px;">Method</th>
                            <th style="width: 110px;">Reference #</th>
                            <th style="text-align: right; width: 130px;">Amount (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.length > 0 ? paymentRows : `
                            <tr>
                                <td colspan="6" style="padding: 16px; text-align: center; color: #888;">No payments recorded yet.</td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <div class="signatures">
                    <div class="sig-line">Prepared By</div>
                    <div class="sig-line">Authorized Signatory</div>
                    <div class="sig-line">Subcontractor Signature</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Subcontract Account: ${subcontract.contractorName}`}
            maxWidth="sm:max-w-4xl"
        >
            <div className="space-y-6">
                {/* Header Information Bar */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-bold text-gray-900">{subcontract.contractorName}</h2>
                            <Badge variant={subcontract.status === 'completed' ? 'green' : subcontract.status === 'on_hold' ? 'yellow' : 'blue'}>
                                {subcontract.trade || 'Trade'}
                            </Badge>
                            <Badge variant={balanceDue <= 0 ? 'green' : totalPaid > 0 ? 'yellow' : 'gray'}>
                                {balanceDue <= 0 ? 'Fully Settled' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                            {subcontract.contactPerson && (
                                <span className="flex items-center">
                                    <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    {subcontract.contactPerson}
                                </span>
                            )}
                            {subcontract.phone && (
                                <span className="flex items-center">
                                    <Phone className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    {subcontract.phone}
                                </span>
                            )}
                            {subcontract.startDate && (
                                <span className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    Started: {new Date(subcontract.startDate).toLocaleDateString()}
                                </span>
                            )}
                            {subcontract.dueDate && (
                                <span className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                    Due: {new Date(subcontract.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        {subcontract.description && (
                            <p className="text-xs text-gray-500 italic mt-1">
                                Scope: {subcontract.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="secondary" size="sm" onClick={handlePrintStatement}>
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print Statement
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                setIsAddPaymentOpen(!isAddPaymentOpen);
                                setError('');
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            {isAddPaymentOpen ? 'Close Form' : 'Record Payment'}
                        </Button>
                    </div>
                </div>

                {/* Account Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            Agreed Contract Value
                        </p>
                        <p className="text-2xl font-bold text-blue-950 mt-1">
                            LKR {contractAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Fixed Subcontract Price
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                            Total Paid To Date
                        </p>
                        <p className="text-2xl font-bold text-green-950 mt-1">
                            LKR {totalPaid.toLocaleString()}
                        </p>
                        <div className="mt-2">
                            <div className="flex justify-between text-xs font-medium text-green-800 mb-1">
                                <span>{progressPercent}% Settled</span>
                                <span>{payments.length} Payments</span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className={`border rounded-xl p-4 ${balanceDue <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${balanceDue <= 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                            Outstanding Balance
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${balanceDue <= 0 ? 'text-emerald-950' : 'text-amber-950'}`}>
                            LKR {balanceDue.toLocaleString()}
                        </p>
                        <p className="text-xs mt-1 text-gray-600">
                            {balanceDue <= 0 ? '✓ Contract fully settled' : 'Payable upon milestones'}
                        </p>
                    </div>
                </div>

                {/* Add Payment Collapsible Panel */}
                {isAddPaymentOpen && (
                    <div className="bg-primary-50/50 border border-primary-200 rounded-xl p-5 transition-all">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-md font-semibold text-gray-900 flex items-center">
                                <DollarSign className="h-4 w-4 text-primary-600 mr-1.5" />
                                Record Subcontractor Payment
                            </h3>
                            <span className="text-xs text-gray-500">
                                Remaining Due: <strong>LKR {balanceDue.toLocaleString()}</strong>
                            </span>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddPayment} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input
                                    id="pay-amount"
                                    label="Amount (LKR) *"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 50000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />

                                <Input
                                    id="pay-date"
                                    label="Payment Date *"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />

                                <div>
                                    <label htmlFor="pay-method" className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        id="pay-method"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                                    >
                                        {PAYMENT_METHODS.map((method) => (
                                            <option key={method} value={method}>
                                                {method}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    id="pay-ref"
                                    label="Reference / Cheque / Receipt #"
                                    placeholder="e.g. CHQ-9912 or Bank Ref"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                />

                                <Input
                                    id="pay-notes"
                                    label="Milestone / Work Description"
                                    placeholder="e.g. Advance payment / 50% Slab completed"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <input
                                    id="sync-expenses"
                                    type="checkbox"
                                    checked={syncWithExpenses}
                                    onChange={(e) => setSyncWithExpenses(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="sync-expenses" className="text-xs font-medium text-gray-700 cursor-pointer">
                                    Automatically record this payment as a <strong>Project Expense</strong> (Updates project total expenses & available balance)
                                </label>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => setIsAddPaymentOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button size="sm" type="submit" isLoading={actionLoading}>
                                    Save Payment
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Edit Payment Inline Panel */}
                {editingPayment && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-5">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-md font-semibold text-amber-900 flex items-center">
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit Payment Record
                            </h3>
                            <button
                                onClick={() => setEditingPayment(null)}
                                className="text-xs text-gray-500 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                        <form onSubmit={handleSaveEditPayment} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input
                                    id="edit-pay-amount"
                                    label="Amount (LKR) *"
                                    type="number"
                                    min="0"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    required
                                />
                                <Input
                                    id="edit-pay-date"
                                    label="Date *"
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    required
                                />
                                <div>
                                    <label htmlFor="edit-pay-method" className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        id="edit-pay-method"
                                        value={editMethod}
                                        onChange={(e) => setEditMethod(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                                    >
                                        {PAYMENT_METHODS.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    id="edit-pay-ref"
                                    label="Reference #"
                                    value={editReferenceNo}
                                    onChange={(e) => setEditReferenceNo(e.target.value)}
                                />
                                <Input
                                    id="edit-pay-notes"
                                    label="Milestone / Description"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => setEditingPayment(null)}
                                >
                                    Cancel
                                </Button>
                                <Button size="sm" type="submit" isLoading={actionLoading}>
                                    Update Payment
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Payment History / Ledger Table */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-md font-semibold text-gray-900 flex items-center">
                            <FileText className="h-4 w-4 text-gray-600 mr-2" />
                            Subcontract Payment Ledger ({payments.length})
                        </h3>
                        <span className="text-xs text-gray-500">
                            Amounts in LKR
                        </span>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Milestone / Description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                        Method & Ref
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                        Amount Paid
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                        Project Sync
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loadingPayments ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500">
                                            Loading payment history...
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                                            <p className="font-medium text-gray-700">No payments recorded yet</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Click "Record Payment" to log an advance or milestone payment.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                                                {new Date(p.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-gray-900 font-medium">
                                                {p.notes || <span className="text-gray-400 italic">No description</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600">
                                                <div className="font-medium text-gray-800">{p.paymentMethod || 'Cash'}</div>
                                                {p.referenceNo && (
                                                    <div className="text-gray-400 font-mono text-[11px]">Ref: {p.referenceNo}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-right font-bold text-green-600 whitespace-nowrap">
                                                LKR {Number(p.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-xs">
                                                {p.syncedExpenseId ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
                                                        Synced
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-[11px]">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-right whitespace-nowrap">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleStartEditPayment(p)}
                                                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                                        title="Edit payment"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(p)}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded"
                                                        title="Delete payment"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {payments.length > 0 && (
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">
                                            Total Paid
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-green-700">
                                            LKR {totalPaid.toLocaleString()}
                                        </td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
