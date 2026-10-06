import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown, Edit, Trash2, AlertTriangle, Briefcase } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Table from '../../components/UI/Table';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import { addCredit, addExpense, deleteProject, updateCredit, deleteCredit, updateExpense, deleteExpense } from '../../services/firestore';
import EditProjectModal from './EditProjectModal';
import EditCreditModal from './EditCreditModal';
import EditExpenseModal from './EditExpenseModal';
import SubcontractsSection from './subcontracts/SubcontractsSection';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [activeTab, setActiveTab] = useState('finances'); // 'finances' or 'subcontracts'
    const [subcontractCount, setSubcontractCount] = useState(0);

    // Modal states
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Transaction Edit States
    const [editingCredit, setEditingCredit] = useState(null);
    const [editingExpense, setEditingExpense] = useState(null);

    // Form states
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const handleDeleteProject = async () => {
        setActionLoading(true);
        try {
            await deleteProject(id);
            navigate('/projects');
        } catch (error) {
            console.error("Failed to delete project:", error);
            alert("Failed to delete project");
            setActionLoading(false);
        }
    };

    useEffect(() => {
        const projectUnsub = onSnapshot(doc(db, 'projects', id), (doc) => {
            if (doc.exists()) {
                setProject({ id: doc.id, ...doc.data() });
            } else {
                navigate('/projects');
            }
            setLoading(false);
        });

        const creditsQuery = query(collection(db, 'projects', id, 'credits'), orderBy('date', 'desc'));
        const creditsUnsub = onSnapshot(creditsQuery, (snapshot) => {
            setCredits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const expensesQuery = query(collection(db, 'projects', id, 'expenses'), orderBy('date', 'desc'));
        const expensesUnsub = onSnapshot(expensesQuery, (snapshot) => {
            setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const subcontractsQuery = query(collection(db, 'projects', id, 'subcontracts'));
        const subcontractsUnsub = onSnapshot(subcontractsQuery, (snapshot) => {
            setSubcontractCount(snapshot.size);
        });

        return () => {
            projectUnsub();
            creditsUnsub();
            expensesUnsub();
            subcontractsUnsub();
        };
    }, [id, navigate]);

    const handleAddCredit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await addCredit(id, amount, date, description);
            setIsCreditModalOpen(false);
            setAmount('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await addExpense(id, amount, date, description);
            setIsExpenseModalOpen(false);
            setAmount('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    // Transaction Handlers
    const handleUpdateCredit = async (creditId, oldAmount, newAmount, newDate, newDescription) => {
        await updateCredit(id, creditId, oldAmount, newAmount, newDate, newDescription);
        setEditingCredit(null);
    };

    const handleDeleteCredit = async (creditId, amount) => {
        if (window.confirm("Are you sure you want to delete this credit?")) {
            await deleteCredit(id, creditId, amount);
        }
    };

    const handleUpdateExpense = async (expenseId, oldAmount, newAmount, newDate, newDesc) => {
        await updateExpense(id, expenseId, oldAmount, newAmount, newDate, newDesc);
        setEditingExpense(null);
    };

    const handleDeleteExpense = async (expenseId, amount) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            await deleteExpense(id, expenseId, amount);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading project details...</div>;
    if (!project) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/projects')} className="p-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {new Date(project.deliveryDate).toLocaleDateString()}</span>
                                <Badge variant={project.totalCredited >= project.value ? 'green' : 'blue'}>
                                    {project.totalCredited >= project.value ? 'Completed' : 'In Progress'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Client Name:</span>
                            <span className="ml-2 text-sm text-gray-900">{project.clientName || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">Phone:</span>
                            <span className="ml-2 text-sm text-gray-900">{project.clientPhone || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">Location:</span>
                            <span className="ml-2 text-sm text-gray-900">{project.location || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500 block mb-1">Description:</span>
                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                                {project.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-blue-50 border-blue-100">
                        <p className="text-sm font-medium text-blue-600">Project Value</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">LKR {Number(project.value).toLocaleString()}</p>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <p className="text-sm font-medium text-green-600">Total Credited</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">LKR {(project.totalCredited || 0).toLocaleString()}</p>
                    </Card>
                    <Card className="bg-red-50 border-red-100">
                        <p className="text-sm font-medium text-red-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-900 mt-1">LKR {(project.totalExpenses || 0).toLocaleString()}</p>
                    </Card>
                    <Card className="bg-purple-50 border-purple-100">
                        <p className="text-sm font-medium text-purple-600">Available Balance</p>
                        <p className={`text-2xl font-bold mt-1 ${(project.totalCredited - project.totalExpenses) < 0 ? 'text-red-900' : 'text-purple-900'}`}>
                            LKR {((project.totalCredited || 0) - (project.totalExpenses || 0)).toLocaleString()}
                        </p>
                    </Card>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('finances')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                            activeTab === 'finances'
                                ? 'border-primary-600 text-primary-600 font-semibold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Direct Finances & Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('subcontracts')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                            activeTab === 'subcontracts'
                                ? 'border-primary-600 text-primary-600 font-semibold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Subcontracts & Accounts
                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
                            activeTab === 'subcontracts' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {subcontractCount}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Tab 1: Direct Finances */}
            {activeTab === 'finances' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Credits Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                                Credited History
                            </h2>
                            <Button size="sm" onClick={() => setIsCreditModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" /> Add Credit
                            </Button>
                        </div>
                        <Card className="p-0 overflow-hidden">
                            <Table headers={['Date', 'Description', 'Amount', 'Actions']}>
                                {credits.map((credit) => (
                                    <tr key={credit.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(credit.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {credit.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-green-600">
                                            LKR {Number(credit.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button onClick={() => setEditingCredit(credit)} className="text-blue-600 hover:text-blue-800">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteCredit(credit.id, credit.amount)} className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {credits.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No credits recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </Table>
                        </Card>
                    </div>

                    {/* Expenses Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                                Expense History
                            </h2>
                            <Button size="sm" onClick={() => setIsExpenseModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" /> Add Expense
                            </Button>
                        </div>
                        <Card className="p-0 overflow-hidden">
                            <Table headers={['Date', 'Description', 'Amount', 'Actions']}>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-600">
                                            LKR {Number(expense.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button onClick={() => setEditingExpense(expense)} className="text-blue-600 hover:text-blue-800">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteExpense(expense.id, expense.amount)} className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No expenses recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </Table>
                        </Card>
                    </div>
                </div>
            )}

            {/* Tab 2: Subcontracts & Accounts */}
            {activeTab === 'subcontracts' && (
                <SubcontractsSection projectId={id} projectName={project.name} />
            )}

            {/* Add Credit Modal */}
            <Modal
                isOpen={isCreditModalOpen}
                onClose={() => setIsCreditModalOpen(false)}
                title="Add Credit"
            >
                <form onSubmit={handleAddCredit} className="space-y-4">
                    <Input
                        id="credit-amount"
                        label="Amount (LKR)"
                        type="number"
                        required
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Input
                        id="credit-desc"
                        label="Description"
                        type="text"
                        placeholder="e.g., Payment received"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Input
                        id="credit-date"
                        label="Date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="secondary" type="button" onClick={() => setIsCreditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={actionLoading}>
                            Save
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Expense Modal */}
            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Add Expense"
            >
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <Input
                        id="expense-amount"
                        label="Amount (LKR)"
                        type="number"
                        required
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Input
                        id="expense-desc"
                        label="Description"
                        type="text"
                        required
                        placeholder="e.g., Materials, Labor"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Input
                        id="expense-date"
                        label="Date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="secondary" type="button" onClick={() => setIsExpenseModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={actionLoading}>
                            Save
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Project Modal */}
            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={project}
                onProjectUpdated={() => {
                    // Snapshot listener will update UI
                }}
            />

            {/* Edit Credit Modal */}
            <EditCreditModal
                isOpen={!!editingCredit}
                onClose={() => setEditingCredit(null)}
                credit={editingCredit}
                onSave={handleUpdateCredit}
            />

            {/* Edit Expense Modal */}
            <EditExpenseModal
                isOpen={!!editingExpense}
                onClose={() => setEditingExpense(null)}
                expense={editingExpense}
                onSave={handleUpdateExpense}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Project"
            >
                <div className="space-y-4">
                    <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0" />
                        <p className="text-sm">
                            Are you sure you want to delete this project? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteProject} isLoading={actionLoading}>
                            Delete Project
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
