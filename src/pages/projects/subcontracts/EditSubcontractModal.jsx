import { useState, useEffect } from 'react';
import Modal from '../../../components/UI/Modal';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import { updateSubcontract } from '../../../services/firestore';

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

export default function EditSubcontractModal({ isOpen, onClose, projectId, subcontract }) {
    const [contractorName, setContractorName] = useState('');
    const [trade, setTrade] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [contractAmount, setContractAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('active');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (subcontract) {
            setContractorName(subcontract.contractorName || '');
            setTrade(subcontract.trade || '');
            setContactPerson(subcontract.contactPerson || '');
            setPhone(subcontract.phone || '');
            setContractAmount(subcontract.contractAmount !== undefined ? subcontract.contractAmount : '');
            setStartDate(subcontract.startDate || '');
            setDueDate(subcontract.dueDate || '');
            setStatus(subcontract.status || 'active');
            setDescription(subcontract.description || '');
            setError('');
        }
    }, [subcontract]);

    if (!subcontract) return null;

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
            await updateSubcontract(projectId, subcontract.id, {
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
            onClose();
        } catch (err) {
            console.error('Failed to update subcontract:', err);
            setError('Failed to update subcontract. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Subcontract: ${subcontract.contractorName}`}
            maxWidth="sm:max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        id="edit-contractor-name"
                        label="Subcontractor / Firm Name *"
                        value={contractorName}
                        onChange={(e) => setContractorName(e.target.value)}
                        required
                    />

                    <div>
                        <label htmlFor="edit-trade-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Trade / Scope Category
                        </label>
                        <input
                            id="edit-trade-select"
                            list="edit-trade-options"
                            placeholder="Select or type trade"
                            value={trade}
                            onChange={(e) => setTrade(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <datalist id="edit-trade-options">
                            {POPULAR_TRADES.map((t) => (
                                <option key={t} value={t} />
                            ))}
                        </datalist>
                    </div>

                    <Input
                        id="edit-contact-person"
                        label="Contact Person"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                    />

                    <Input
                        id="edit-phone"
                        label="Phone Number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <Input
                        id="edit-contract-amount"
                        label="Agreed Contract Value (LKR) *"
                        type="number"
                        min="0"
                        value={contractAmount}
                        onChange={(e) => setContractAmount(e.target.value)}
                        required
                    />

                    <div>
                        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                            Contract Status
                        </label>
                        <select
                            id="edit-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                        >
                            <option value="active">Active / In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                        </select>
                    </div>

                    <Input
                        id="edit-start-date"
                        label="Start Date *"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />

                    <Input
                        id="edit-due-date"
                        label="Expected Due Date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Scope of Work & Notes
                    </label>
                    <textarea
                        id="edit-description"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
