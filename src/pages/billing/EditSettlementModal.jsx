import { useState, useEffect } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

export default function EditSettlementModal({ isOpen, onClose, settlement, onSave, maxAmount }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (settlement) {
            setAmount(settlement.amount);
            setDate(settlement.date);
        }
    }, [settlement, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Calculate max allowed (current balance + old amount)
        // If passed maxAmount is just the balance, we need to add back the current amount being edited
        // to check if the new amount is valid.

        // However, here we just trust the onSave to validate or parent.
        // Let's defer validation to parent or assume maxAmount = remaining + oldAmount

        setLoading(true);
        try {
            await onSave(settlement.id, settlement.amount, amount, date);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Settlement">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="edit-settlement-amount"
                    label="Amount (₹)"
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <Input
                    id="edit-settlement-date"
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
                    <Button type="submit" isLoading={loading}>
                        Save
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
