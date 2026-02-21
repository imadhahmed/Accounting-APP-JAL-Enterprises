import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Plus, DollarSign, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Table from '../../components/UI/Table';
import AddLoanModal from './AddLoanModal';
import AddSettlementModal from './AddSettlementModal';
// Note: We might need to import update/delete services if needed later.

export default function ShopDetails() {
    const { shopName } = useParams();
    const decodedShopName = decodeURIComponent(shopName);
    const navigate = useNavigate();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
    const [settlementBillId, setSettlementBillId] = useState(null); // The ID of the bill we're adding a settlement for

    useEffect(() => {
        const q = query(
            collection(db, 'bills'),
            where('shopName', '==', decodedShopName)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedBills = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Firebase queries with inequality or ordering on multiple fields can require indexes.
            // Sorting in client to avoid index requirement for now.
            fetchedBills.sort((a, b) => new Date(b.date) - new Date(a.date));
            setBills(fetchedBills);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [decodedShopName]);

    if (loading) return <div className="p-8 text-center">Loading shop details...</div>;

    // Calculate Shop Totals
    const totalBilled = bills.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0);
    const totalSettled = bills.reduce((sum, bill) => sum + Number(bill.settledAmount || 0), 0);
    const remainingBalance = totalBilled - totalSettled;
    const isPaid = remainingBalance <= 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/loans')} className="p-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{decodedShopName}</h1>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                <span>{bills.length} Records</span>
                                <span>•</span>
                                <Badge variant={isPaid ? 'green' : 'red'}>
                                    {isPaid ? 'All Settled' : 'Has Outstanding'}
                                </Badge>
                            </div>
                        </div>
                        <Button onClick={() => setIsAddLoanModalOpen(true)}>
                            <Plus className="h-5 w-5 mr-2" />
                            Add Record
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-blue-100 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Billed</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">LKR {totalBilled.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-green-100 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Settled</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">LKR {totalSettled.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-red-100 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Remaining Balance</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">LKR {remainingBalance.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-100 p-2 rounded-lg">
                            <Clock className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Loan & Settlement Records</h2>
                <Card className="p-0 overflow-hidden">
                    <Table headers={['Date', 'Bill Number', 'Project', 'Description', 'Bill Amount', 'Settled', 'Balance', 'Action']}>
                        {bills.map((bill) => {
                            const billTotal = Number(bill.totalAmount || 0);
                            const billSettled = Number(bill.settledAmount || 0);
                            const billBalance = billTotal - billSettled;
                            const billPaid = billBalance <= 0;

                            return (
                                <tr key={bill.id}>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(bill.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        #{bill.billNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {bill.projectName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {bill.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        LKR {billTotal.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                                        LKR {billSettled.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-red-600">
                                        LKR {billBalance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {!billPaid ? (
                                            <Button size="sm" variant="secondary" onClick={() => setSettlementBillId(bill.id)}>
                                                Pay
                                            </Button>
                                        ) : (
                                            <Badge variant="green">Clear</Badge>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {bills.length === 0 && (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No records found for this shop.
                                </td>
                            </tr>
                        )}
                    </Table>
                </Card>
            </div>

            {/* Modals for Adding Loans and Settlements */}
            <AddLoanModal
                isOpen={isAddLoanModalOpen}
                onClose={() => setIsAddLoanModalOpen(false)}
                defaultShopName={decodedShopName}
            />
            {settlementBillId && (
                <AddSettlementModal
                    isOpen={!!settlementBillId}
                    onClose={() => setSettlementBillId(null)}
                    billId={settlementBillId}
                    bill={bills.find(b => b.id === settlementBillId)}
                />
            )}
        </div>
    );
}
