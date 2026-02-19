import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import AddBillModal from './AddBillModal';

export default function BillingList() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'bills'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const billsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBills(billsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredBills = bills.filter(bill =>
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.shopName && bill.shopName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shop Billing</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage bills and settlements</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Bill
                </Button>
            </div>

            <div className="relative max-w-md">
                <Input
                    leftIcon={Search}
                    placeholder="Search by Bill # or Project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10">Loading bills...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBills.map((bill) => {
                        const isPaid = bill.settledAmount >= bill.totalAmount;
                        return (
                            <Link key={bill.id} to={`/billing/${bill.id}`} className="block group">
                                <Card className="h-full hover:shadow-md transition-shadow border-t-4 border-t-purple-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                                <FileText className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">#{bill.billNumber}</h3>
                                                <p className="text-sm font-medium text-gray-700">{bill.shopName}</p>
                                                <p className="text-xs text-gray-500">{bill.projectName}</p>
                                            </div>
                                        </div>
                                        <Badge variant={isPaid ? 'green' : 'yellow'}>
                                            {isPaid ? 'Paid' : 'Pending'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 border-t pt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total:</span>
                                            <span className="font-medium">₹{Number(bill.totalAmount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Settled:</span>
                                            <span className="font-medium text-green-600">₹{Number(bill.settledAmount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-semibold">
                                            <span>Balance:</span>
                                            <span className="text-red-500">₹{(bill.totalAmount - (bill.settledAmount || 0)).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2 pt-2 text-right">
                                            {new Date(bill.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                    {filteredBills.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No bills found.
                        </div>
                    )}
                </div>
            )}

            <AddBillModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onBillAdded={() => { }}
            />
        </div>
    );
}
