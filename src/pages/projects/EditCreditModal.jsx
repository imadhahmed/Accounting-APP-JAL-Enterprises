import { useState, useEffect } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

export default function EditCreditModal({ isOpen, onClose, credit, onSave }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (credit) {
            setAmount(credit.amount);
            setDate(credit.date);
        }
    }, [credit, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(credit.id, credit.amount, amount, date);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Credit">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="edit-credit-amount"
                    label="Amount (₹)"
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <Input
                    id="edit-credit-date"
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
