import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { updateBill } from '../../services/firestore';

export default function EditBillModal({ isOpen, onClose, bill, onBillUpdated }) {
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        billNumber: '',
        projectId: '',
        projectName: '',
        shopName: '',
        totalAmount: '',
        date: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            const q = query(collection(db, 'projects'), orderBy('name'));
            const snapshot = await getDocs(q);
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        };
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    useEffect(() => {
        if (bill) {
            setFormData({
                billNumber: bill.billNumber || '',
                projectId: bill.projectId || '',
                projectName: bill.projectName || '',
                shopName: bill.shopName || '',
                totalAmount: bill.totalAmount || '',
                date: bill.date || ''
            });
        }
    }, [bill, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleProjectChange = (e) => {
        const projectId = e.target.value;
        const project = projects.find(p => p.id === projectId);
        setFormData({
            ...formData,
            projectId,
            projectName: project ? project.name : ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await updateBill(bill.id, {
                billNumber: formData.billNumber,
                projectId: formData.projectId || null,
                projectName: formData.projectName || 'General',
                shopName: formData.shopName,
                totalAmount: Number(formData.totalAmount),
                date: formData.date
            });
            onBillUpdated();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to update bill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Bill">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="billNumber"
                    label="Bill Number"
                    type="text"
                    required
                    value={formData.billNumber}
                    onChange={handleChange}
                />

                <Input
                    id="shopName"
                    label="Shop Name"
                    type="text"
                    required
                    placeholder="Enter shop or vendor name"
                    value={formData.shopName}
                    onChange={handleChange}
                />

                <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                        Project (Optional)
                    </label>
                    <select
                        id="projectId"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={formData.projectId}
                        onChange={handleProjectChange}
                    >
                        <option value="">Select a project...</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <Input
                    id="totalAmount"
                    label="Total Bill Amount (₹)"
                    type="number"
                    required
                    min="0"
                    value={formData.totalAmount}
                    onChange={handleChange}
                />

                <Input
                    id="date"
                    label="Date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="secondary" onClick={onClose} type="button">
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
