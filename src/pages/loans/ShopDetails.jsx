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
import SettlementsModal from './SettlementsModal';
import { deleteBill, deleteCommonPay, COMMON_PAYS_COLLECTION } from '../../services/firestore';
import AddCommonPayModal from './AddCommonPayModal';

export default function ShopDetails() {
    const { shopName } = useParams();
    const decodedShopName = decodeURIComponent(shopName);
    const navigate = useNavigate();

    const [bills, setBills] = useState([]);
    const [commonPays, setCommonPays] = useState([]);
    const [loadingBills, setLoadingBills] = useState(true);
    const [loadingCommonPays, setLoadingCommonPays] = useState(true);

    const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
    const [isAddCommonPayModalOpen, setIsAddCommonPayModalOpen] = useState(false);
    const [editBillData, setEditBillData] = useState(null);
    const [settlementBillId, setSettlementBillId] = useState(null); // The ID of the bill we're adding a settlement for
    const [viewSettlementsBillId, setViewSettlementsBillId] = useState(null); // The ID of the bill we're viewing settlements for

    useEffect(() => {
        const q = query(
            collection(db, 'bills'),
            where('shopName', '==', decodedShopName)
        );

        const unsubscribeBills = onSnapshot(q, (snapshot) => {
            const fetchedBills = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Firebase queries with inequality or ordering on multiple fields can require indexes.
            // Sorting in client to avoid index requirement for now.
            fetchedBills.sort((a, b) => new Date(b.date) - new Date(a.date));
            setBills(fetchedBills);
            setLoadingBills(false);
        });

        const commonPaysQuery = query(
            collection(db, COMMON_PAYS_COLLECTION),
            where('shopName', '==', decodedShopName)
        );

        const unsubscribeCommonPays = onSnapshot(commonPaysQuery, (snapshot) => {
            const fetchedCommonPays = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            fetchedCommonPays.sort((a, b) => new Date(b.date) - new Date(a.date));
            setCommonPays(fetchedCommonPays);
            setLoadingCommonPays(false);
        });

        return () => {
            unsubscribeBills();
            unsubscribeCommonPays();
        };
    }, [decodedShopName]);

    if (loadingBills || loadingCommonPays) return <div className="p-8 text-center">Loading shop details...</div>;

    // Calculate Shop Totals
    const totalBilled = bills.reduce((sum, bill) => sum + Number(bill.totalAmount || 0), 0);
    const totalSettled = bills.reduce((sum, bill) => sum + Number(bill.settledAmount || 0), 0);
    const totalCommonPay = commonPays.reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
    const remainingBalance = totalBilled - (totalSettled + totalCommonPay);
    const isPaid = remainingBalance <= 0;

    const handleDeleteCommonPay = async (payId) => {
        if (window.confirm("Are you sure you want to delete this common payment?")) {
            try {
                await deleteCommonPay(payId);
            } catch (error) {
                console.error("Error deleting common pay:", error);
                alert("Failed to delete common pay.");
            }
        }
    };

    const handleDeleteBill = async (billId) => {
        if (window.confirm("Are you sure you want to delete this bill? This will also delete all associated settlements.")) {
            try {
                await deleteBill(billId);
            } catch (error) {
                console.error("Error deleting bill:", error);
                alert("Failed to delete bill.");
            }
        }
    };

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
                        <div className="flex space-x-2">
                            <Button variant="secondary" onClick={() => setIsAddCommonPayModalOpen(true)}>
                                <Plus className="h-5 w-5 mr-2" />
                                Add Common Pay
                            </Button>
                            <Button onClick={() => setIsAddLoanModalOpen(true)}>
                                <Plus className="h-5 w-5 mr-2" />
                                Add Record
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                <Card className="bg-white border-indigo-100 border-l-4 border-l-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Common Pay</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">LKR {totalCommonPay.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <DollarSign className="h-6 w-6 text-indigo-600" />
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
                                        <div className="flex items-center space-x-2">
                                            {!billPaid ? (
                                                <Button size="sm" variant="secondary" onClick={() => setSettlementBillId(bill.id)}>
                                                    Pay
                                                </Button>
                                            ) : (
                                                <Badge variant="green">Clear</Badge>
                                            )}
                                            <button
                                                onClick={() => setViewSettlementsBillId(bill.id)}
                                                className="text-purple-600 hover:text-purple-900 bg-purple-50 p-1.5 rounded transition-colors"
                                                title="View Settlements"
                                            >
                                                <Clock className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditBillData(bill)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded transition-colors"
                                                title="Edit Bill"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBill(bill.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded transition-colors"
                                                title="Delete Bill"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
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

            {commonPays.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Common Payments</h2>
                    <Card className="p-0 overflow-hidden">
                        <Table headers={['Date', 'Amount', 'Description', 'Action']}>
                            {commonPays.map((pay) => (
                                <tr key={pay.id}>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(pay.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                        LKR {Number(pay.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {pay.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <button
                                            onClick={() => handleDeleteCommonPay(pay.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded transition-colors"
                                            title="Delete Common Pay"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </Card>
                </div>
            )}

            {/* Modals for Adding Loans and Settlements */}
            <AddLoanModal
                isOpen={isAddLoanModalOpen || !!editBillData}
                onClose={() => {
                    setIsAddLoanModalOpen(false);
                    setEditBillData(null);
                }}
                defaultShopName={decodedShopName}
                editData={editBillData}
            />
            {settlementBillId && (
                <AddSettlementModal
                    isOpen={!!settlementBillId}
                    onClose={() => setSettlementBillId(null)}
                    billId={settlementBillId}
                    bill={bills.find(b => b.id === settlementBillId)}
                />
            )}
            {viewSettlementsBillId && (
                <SettlementsModal
                    isOpen={!!viewSettlementsBillId}
                    onClose={() => setViewSettlementsBillId(null)}
                    billId={viewSettlementsBillId}
                    bill={bills.find(b => b.id === viewSettlementsBillId)}
                />
            )}
            <AddCommonPayModal
                isOpen={isAddCommonPayModalOpen}
                onClose={() => setIsAddCommonPayModalOpen(false)}
                shopName={decodedShopName}
            />
        </div>
    );
}
