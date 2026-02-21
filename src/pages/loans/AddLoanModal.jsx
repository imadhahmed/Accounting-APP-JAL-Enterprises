import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { addBill, updateBill } from '../../services/firestore';

export default function AddLoanModal({ isOpen, onClose, defaultShopName, editData }) {
    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        billNumber: '',
        projectId: '',
        projectName: '',
        shopName: defaultShopName || '',
        totalAmount: '',
        settledAmount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
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
            if (editData) {
                setFormData({
                    billNumber: editData.billNumber || '',
                    projectId: editData.projectId || '',
                    projectName: editData.projectName || '',
                    shopName: editData.shopName || '',
                    totalAmount: editData.totalAmount || '',
                    settledAmount: editData.settledAmount || '',
                    description: editData.description || '',
                    date: editData.date || new Date().toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    billNumber: '',
                    projectId: '',
                    projectName: '',
                    shopName: defaultShopName || '',
                    totalAmount: '',
                    settledAmount: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, defaultShopName, editData]);

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
            if (editData) {
                await updateBill(editData.id, {
                    billNumber: formData.billNumber,
                    projectId: formData.projectId || null,
                    projectName: formData.projectName || 'General',
                    shopName: formData.shopName,
                    totalAmount: Number(formData.totalAmount),
                    description: formData.description,
                    date: formData.date
                });
            } else {
                await addBill({
                    billNumber: formData.billNumber,
                    projectId: formData.projectId || null,
                    projectName: formData.projectName || 'General',
                    shopName: formData.shopName,
                    totalAmount: Number(formData.totalAmount),
                    settledAmount: Number(formData.settledAmount || 0),
                    description: formData.description,
                    date: formData.date
                });
            }
            onClose();
            setFormData({
                billNumber: '',
                projectId: '',
                projectName: '',
                shopName: defaultShopName || '',
                totalAmount: '',
                settledAmount: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            console.error(err);
            setError(editData ? 'Failed to update loan/bill record' : 'Failed to add loan/bill record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editData ? "Edit Loan/Bill" : "Add New Loan/Bill"}>
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
                    readOnly={!!defaultShopName}
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
                    label="Bill Amount (LKR)"
                    type="number"
                    required
                    min="0"
                    value={formData.totalAmount}
                    onChange={handleChange}
                />

                <Input
                    id="settledAmount"
                    label="Settled Amount (LKR)"
                    type="number"
                    min="0"
                    value={formData.settledAmount}
                    onChange={handleChange}
                    placeholder="Amount paid now (optional)"
                    disabled={!!editData}
                />

                <Input
                    id="description"
                    label="Description (Optional)"
                    type="text"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter bill description"
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
                        {editData ? "Update Record" : "Save Record"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
