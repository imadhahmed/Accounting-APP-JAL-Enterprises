import { useState } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { addCommonPay } from '../../services/firestore';

export default function AddCommonPayModal({ isOpen, onClose, shopName }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!shopName) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addCommonPay(shopName, amount, date, description);
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to add common payment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add Common Pay for ${shopName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                    <p className="text-gray-600 mb-2">
                        Common pay applies to the shop's overall balance rather than a specific bill.
                        It will reduce the total remaining balance for this shop.
                    </p>
                </div>

                <Input
                    id="common-pay-amount"
                    label="Amount (LKR)"
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <Input
                    id="common-pay-date"
                    label="Date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <Input
                    id="common-pay-description"
                    label="Description (Optional)"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Advance Payment"
                />

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={loading}
                        disabled={Number(amount) <= 0}
                    >
                        Add Common Pay
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
