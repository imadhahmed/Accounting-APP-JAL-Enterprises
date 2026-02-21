import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/UI/Modal';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Input from '../../components/UI/Input';
import { updateSettlement, deleteSettlement } from '../../services/firestore';
import { Edit2, Trash2, X, Check } from 'lucide-react';

export default function SettlementsModal({ isOpen, onClose, billId, bill }) {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ amount: '', date: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !billId) return;

        const q = query(
            collection(db, 'settlements'),
            where('billId', '==', billId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
            setSettlements(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, billId]);

    const handleEditClick = (settlement) => {
        setEditingId(settlement.id);
        setEditData({ amount: settlement.amount, date: settlement.date });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (settlementId, oldAmount) => {
        if (!editData.amount || Number(editData.amount) <= 0) return;
        setIsSaving(true);
        try {
            await updateSettlement(billId, settlementId, oldAmount, editData.amount, editData.date);
            setEditingId(null);
        } catch (error) {
            console.error("Error updating settlement:", error);
            alert("Failed to update settlement.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = async (settlementId, amount) => {
        if (window.confirm("Are you sure you want to delete this settlement?")) {
            try {
                await deleteSettlement(billId, settlementId, amount);
            } catch (error) {
                console.error("Error deleting settlement:", error);
                alert("Failed to delete settlement.");
            }
        }
    };

    if (!bill) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Settlements for Bill #${bill.billNumber}`}>
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Total Billed:</span>
                        <span className="font-medium text-gray-900">LKR {Number(bill.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Current Balance:</span>
                        <span className="font-medium text-red-600">
                            LKR {(Number(bill.totalAmount || 0) - Number(bill.settledAmount || 0)).toLocaleString()}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading settlements...</div>
                ) : settlements.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No settlements found for this bill.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {settlements.map((settlement) => (
                                    <tr key={settlement.id}>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {editingId === settlement.id ? (
                                                <Input
                                                    type="date"
                                                    value={editData.date}
                                                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                                    className="w-full text-sm py-1"
                                                />
                                            ) : (
                                                new Date(settlement.date).toLocaleDateString()
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {editingId === settlement.id ? (
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={editData.amount}
                                                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                    className="w-full text-sm py-1"
                                                />
                                            ) : (
                                                `LKR ${Number(settlement.amount).toLocaleString()}`
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                                            {editingId === settlement.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveEdit(settlement.id, settlement.amount)}
                                                        disabled={isSaving}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded transition-colors disabled:opacity-50"
                                                        title="Save"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        disabled={isSaving}
                                                        className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1 rounded transition-colors disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditClick(settlement)}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(settlement.id, settlement.amount)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
}
