import { useState } from 'react';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { addProject } from '../../services/firestore';

export default function AddProjectModal({ isOpen, onClose, onProjectAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        clientPhone: '',
        location: '',
        value: '',
        startDate: '',
        deliveryDate: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await addProject({
                name: formData.name,
                clientName: formData.clientName,
                clientPhone: formData.clientPhone,
                location: formData.location,
                description: formData.description,
                value: Number(formData.value),
                startDate: formData.startDate,
                deliveryDate: formData.deliveryDate,
                totalCredited: 0,
                totalExpenses: 0
            });
            onProjectAdded();
            onClose();
            setFormData({
                name: '',
                clientName: '',
                clientPhone: '',
                location: '',
                value: '',
                startDate: '',
                deliveryDate: '',
                description: ''
            });
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to add project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Project">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="name"
                    label="Project Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        id="clientName"
                        label="Client Name"
                        type="text"
                        value={formData.clientName}
                        onChange={handleChange}
                    />
                    <Input
                        id="clientPhone"
                        label="Client Phone"
                        type="tel"
                        value={formData.clientPhone}
                        onChange={handleChange}
                    />
                </div>

                <Input
                    id="location"
                    label="Location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                />

                <Input
                    id="value"
                    label="Project Value (₹)"
                    type="number"
                    required
                    min="0"
                    value={formData.value}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        id="startDate"
                        label="Starting Date"
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                    />
                    <Input
                        id="deliveryDate"
                        label="Delivery Date"
                        type="date"
                        required
                        value={formData.deliveryDate}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows="3"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="secondary" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Create Project
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
