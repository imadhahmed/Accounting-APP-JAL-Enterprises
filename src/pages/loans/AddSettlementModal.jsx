import { useState } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { addSettlement } from '../../services/firestore';

export default function AddSettlementModal({ isOpen, onClose, billId, bill }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    if (!bill) return null;

    const remainingBalance = (Number(bill.totalAmount) || 0) - (Number(bill.settledAmount) || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (Number(amount) > remainingBalance) {
            alert("Settlement amount cannot exceed the remaining balance.");
            setLoading(false);
            return;
        }

        try {
            await addSettlement(billId, amount, date);
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to add settlement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Settle Loan/Bill #${bill.billNumber}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Project:</span>
                        <span className="font-medium text-gray-900">{bill.projectName}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-500">Total Billed:</span>
                        <span className="font-medium text-gray-900">LKR {Number(bill.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-medium">
                        <span>Balance to Settle:</span>
                        <span>LKR {remainingBalance.toLocaleString()}</span>
                    </div>
                </div>

                <Input
                    id="settlement-amount"
                    label="Settlement Amount (LKR)"
                    type="number"
                    required
                    min="1"
                    max={remainingBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={Number(amount) > remainingBalance ? "Cannot exceed remaining balance" : ""}
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
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={loading}
                        disabled={Number(amount) > remainingBalance || Number(amount) <= 0}
                    >
                        Save Settlement
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
