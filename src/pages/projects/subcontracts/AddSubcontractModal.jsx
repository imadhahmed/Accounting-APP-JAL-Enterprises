import { useState } from 'react';
import Modal from '../../../components/UI/Modal';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import { addSubcontract } from '../../../services/firestore';

const POPULAR_TRADES = [
    'Masonry & Brickwork',
    'Electrical Work',
    'Plumbing & Sanitary',
    'Carpentry & Woodwork',
    'Painting & Plastering',
    'Roofing & Ceiling',
    'Tile & Flooring',
    'Steel & Ironwork',
    'Aluminum & Glazing',
    'Demolition & Earthwork',
    'HVAC / Air Conditioning',
    'Landscaping',
    'Other'
];

export default function AddSubcontractModal({ isOpen, onClose, projectId }) {
    const [contractorName, setContractorName] = useState('');
    const [trade, setTrade] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [contractAmount, setContractAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('active');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setContractorName('');
        setTrade('');
        setContactPerson('');
        setPhone('');
        setContractAmount('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setDueDate('');
        setStatus('active');
        setDescription('');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!contractorName.trim()) {
            setError('Please enter subcontractor or company name.');
            return;
        }

        if (!contractAmount || Number(contractAmount) <= 0) {
            setError('Please enter a valid contract amount.');
            return;
        }

        setLoading(true);
        try {
            await addSubcontract(projectId, {
                contractorName: contractorName.trim(),
                trade: trade.trim() || 'General Subcontract',
                contactPerson: contactPerson.trim(),
                phone: phone.trim(),
                contractAmount: Number(contractAmount),
                startDate,
                dueDate: dueDate || null,
                status,
                description: description.trim()
            });
            handleClose();
        } catch (err) {
            console.error('Failed to add subcontract:', err);
            setError('Failed to create subcontract. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add New Subcontract"
            maxWidth="sm:max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                        id="contractor-name"
                        label="Subcontractor / Firm Name *"
                        placeholder="e.g., Kandy Electricals"
                        value={contractorName}
                        onChange={(e) => setContractorName(e.target.value)}
                        required
                    />

                    <div>
                        <label htmlFor="trade-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Trade / Scope Category
                        </label>
                        <input
                            id="trade-select"
                            list="trade-options"
                            placeholder="Select or type trade (e.g. Electrical)"
                            value={trade}
                            onChange={(e) => setTrade(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm"
                        />
                        <datalist id="trade-options">
                            {POPULAR_TRADES.map((t) => (
                                <option key={t} value={t} />
                            ))}
                        </datalist>
                    </div>

                    <Input
                        id="contact-person"
                        label="Contact Person"
                        placeholder="e.g., Mr. Perera"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                    />

                    <Input
                        id="phone"
                        label="Phone Number"
                        type="tel"
                        placeholder="e.g., 077 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <Input
                        id="contract-amount"
                        label="Agreed Contract Value (LKR) *"
                        type="number"
                        min="0"
                        placeholder="e.g., 250000"
                        value={contractAmount}
                        onChange={(e) => setContractAmount(e.target.value)}
                        required
                    />

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Contract Status
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm bg-white"
                        >
                            <option value="active">Active / In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                        </select>
                    </div>

                    <Input
                        id="start-date"
                        label="Start Date *"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />

                    <Input
                        id="due-date"
                        label="Expected Due Date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Scope of Work & Notes
                    </label>
                    <textarea
                        id="description"
                        rows="3"
                        placeholder="Describe the agreed scope, milestones, or conditions..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base sm:text-sm"
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" type="button" onClick={handleClose} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading} className="w-full sm:w-auto">
                        Create Subcontract
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
