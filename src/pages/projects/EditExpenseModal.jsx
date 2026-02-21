import { useState, useEffect } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

export default function EditExpenseModal({ isOpen, onClose, expense, onSave }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (expense) {
            setAmount(expense.amount);
            setDate(expense.date);
            setDescription(expense.description || '');
        }
    }, [expense, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(expense.id, expense.amount, amount, date, description);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Expense">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="edit-expense-amount"
                    label="Amount (LKR)"
                    type="number"
                    required
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <Input
                    id="edit-expense-desc"
                    label="Description"
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                    id="edit-expense-date"
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
