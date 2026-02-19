import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Plus, Calendar, DollarSign, CheckCircle, Clock, Edit, Trash2, AlertTriangle } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import { getSettlements, addSettlement, deleteBill, updateSettlement, deleteSettlement } from '../../services/firestore';
import { onSnapshot as onQuerySnapshot } from 'firebase/firestore';
import EditBillModal from './EditBillModal';
import EditSettlementModal from './EditSettlementModal';

export default function BillingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Settlement Edit State
    const [editingSettlement, setEditingSettlement] = useState(null);

    // Form state
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [actionLoading, setActionLoading] = useState(false);

    const handleDeleteBill = async () => {
        setActionLoading(true);
        try {
            await deleteBill(id);
            navigate('/billing');
        } catch (error) {
            console.error("Failed to delete bill:", error);
            alert("Failed to delete bill");
            setActionLoading(false);
        }
    };

    useEffect(() => {
        const billUnsub = onSnapshot(doc(db, 'bills', id), (doc) => {
            if (doc.exists()) {
                setBill({ id: doc.id, ...doc.data() });
            } else {
                navigate('/billing');
            }
            setLoading(false);
        });

        const settlementsQuery = getSettlements(id);
        const settlementsUnsub = onQuerySnapshot(settlementsQuery, (snapshot) => {
            setSettlements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            billUnsub();
            settlementsUnsub();
        };
    }, [id, navigate]);

    const handleAddSettlement = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (Number(amount) > ((bill.totalAmount || 0) - (bill.settledAmount || 0))) {
                alert("Amount cannot exceed remaining balance");
                return;
            }
            await addSettlement(id, amount, date);
            setIsSettlementModalOpen(false);
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateSettlement = async (settlementId, oldAmount, newAmount, newDate) => {
        // Basic validation: check if new amount exceeds (remaining + oldAmount)
        const currentRemaining = (bill.totalAmount || 0) - (bill.settledAmount || 0);
        const maxAllowed = currentRemaining + Number(oldAmount);

        if (Number(newAmount) > maxAllowed) {
            alert(`Amount cannot exceed ${maxAllowed}`);
            return;
        }

        await updateSettlement(id, settlementId, oldAmount, newAmount, newDate);
        setEditingSettlement(null);
    };

    const handleDeleteSettlement = async (settlementId, amount) => {
        if (window.confirm("Are you sure you want to delete this settlement?")) {
            await deleteSettlement(id, settlementId, amount);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading bill details...</div>;
    if (!bill) return null;

    const remainingBalance = (bill.totalAmount || 0) - (bill.settledAmount || 0);
    const isPaid = remainingBalance <= 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/billing')} className="p-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Bill #{bill.billNumber}</h1>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500 mt-1">
                                <span className="font-medium text-gray-900 text-lg">{bill.shopName}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="font-medium text-gray-700">{bill.projectName}</span>
                                <span className="hidden sm:inline">•</span>
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(bill.date).toLocaleDateString()}</span>
                                <Badge variant={isPaid ? 'green' : 'yellow'}>
                                    {isPaid ? 'Paid' : 'Pending'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-blue-100 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Bill Amount</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">₹{Number(bill.totalAmount).toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-green-100 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Settled</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">₹{Number(bill.settledAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-red-100 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Remaining Balance</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">₹{remainingBalance.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-100 p-2 rounded-lg">
                            <Clock className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Settlement History</h2>
                    {!isPaid && (
                        <Button size="sm" onClick={() => setIsSettlementModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" /> Add Settlement
                        </Button>
                    )}
                </div>

                <Card className="p-0 overflow-hidden">
                    <Table headers={['Date', 'Amount', 'Actions']}>
                        {settlements.map((settlement) => (
                            <tr key={settlement.id}>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(settlement.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-green-600">
                                    ₹{Number(settlement.amount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="flex space-x-2">
                                        <button onClick={() => setEditingSettlement(settlement)} className="text-blue-600 hover:text-blue-800">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDeleteSettlement(settlement.id, settlement.amount)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {settlements.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No settlements recorded yet.
                                </td>
                            </tr>
                        )}
                    </Table>
                </Card>
            </div>

            <Modal
                isOpen={isSettlementModalOpen}
                onClose={() => setIsSettlementModalOpen(false)}
                title="Add Settlement"
            >
                <form onSubmit={handleAddSettlement} className="space-y-4">
                    <Input
                        id="settlement-amount"
                        label="Amount (₹)"
                        type="number"
                        required
                        min="0"
                        max={remainingBalance}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        error={Number(amount) > remainingBalance ? "Amount cannot exceed remaining balance" : ""}
                    />
                    <Input
                        id="settlement-date"
                        label="Date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="secondary" type="button" onClick={() => setIsSettlementModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={actionLoading}
                            disabled={Number(amount) > remainingBalance}
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Settlement Modal */}
            <EditSettlementModal
                isOpen={!!editingSettlement}
                onClose={() => setEditingSettlement(null)}
                settlement={editingSettlement}
                onSave={handleUpdateSettlement}
                maxAmount={(bill.totalAmount || 0) - (bill.settledAmount || 0)}
            />

            {/* Edit Bill Modal */}
            <EditBillModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                bill={bill}
                onBillUpdated={() => {
                    // onSnapshot will handle UI update
                }}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Bill"
            >
                <div className="space-y-4">
                    <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0" />
                        <p className="text-sm">
                            Are you sure you want to delete this bill? This action cannot be undone.
                            Note: Associated settlements will remain but be orphaned.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteBill} isLoading={actionLoading}>
                            Delete Bill
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
