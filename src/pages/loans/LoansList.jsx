import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Store, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import AddLoanModal from './AddLoanModal';
import { COMMON_PAYS_COLLECTION } from '../../services/firestore';

export default function LoansList() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        const billsQuery = query(collection(db, 'bills'), orderBy('date', 'desc'));
        const commonPaysQuery = query(collection(db, COMMON_PAYS_COLLECTION), orderBy('date', 'desc'));

        let billsData = [];
        let commonPaysData = [];

        const processData = () => {
            const grouped = {};

            // Process bills
            billsData.forEach(bill => {
                const shopName = bill.shopName || 'Unknown Shop';
                if (!grouped[shopName]) {
                    grouped[shopName] = {
                        shopName,
                        totalBilled: 0,
                        totalSettled: 0,
                        totalCommonPay: 0,
                        totalBalance: 0,
                        billCount: 0,
                    };
                }
                const settled = Number(bill.settledAmount || 0);
                const total = Number(bill.totalAmount || 0);
                grouped[shopName].totalBilled += total;
                grouped[shopName].totalSettled += settled;
                grouped[shopName].billCount += 1;
            });

            // Process common pays
            commonPaysData.forEach(pay => {
                const shopName = pay.shopName || 'Unknown Shop';
                if (!grouped[shopName]) {
                    grouped[shopName] = {
                        shopName,
                        totalBilled: 0,
                        totalSettled: 0,
                        totalCommonPay: 0,
                        totalBalance: 0,
                        billCount: 0,
                    };
                }
                grouped[shopName].totalCommonPay += Number(pay.amount || 0);
            });

            // Calculate balance
            Object.values(grouped).forEach(shop => {
                shop.totalBalance = shop.totalBilled - (shop.totalSettled + shop.totalCommonPay);
            });

            // Convert to array and sort alphabetically by shopName
            const shopsArray = Object.values(grouped).sort((a, b) =>
                a.shopName.localeCompare(b.shopName)
            );

            setShops(shopsArray);
            setLoading(false);
        };

        const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
            billsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            processData();
        });

        const unsubscribeCommonPays = onSnapshot(commonPaysQuery, (snapshot) => {
            commonPaysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            processData();
        });

        return () => {
            unsubscribeBills();
            unsubscribeCommonPays();
        };
    }, []);

    const filteredShops = shops.filter(shop =>
        shop.shopName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Loans & Settlements</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage shop balances and settlements</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Record
                </Button>
            </div>

            <div className="relative max-w-md">
                <Input
                    leftIcon={Search}
                    placeholder="Search by Shop Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10">Loading shops...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredShops.map((shop) => {
                        const isPaid = shop.totalBalance <= 0;
                        return (
                            <Link key={shop.shopName} to={`/loans/shop/${encodeURIComponent(shop.shopName)}`} className="block group">
                                <Card className="h-full hover:shadow-md transition-shadow border-t-4 border-t-purple-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                                <Store className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg truncate max-w-[150px]" title={shop.shopName}>{shop.shopName}</h3>
                                                <p className="text-xs text-gray-500">{shop.billCount} {shop.billCount === 1 ? 'Record' : 'Records'}</p>
                                            </div>
                                        </div>
                                        <Badge variant={isPaid ? 'green' : 'red'}>
                                            {isPaid ? 'Settled' : 'Unpaid'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 border-t pt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Billed:</span>
                                            <span className="font-medium text-gray-700">LKR {shop.totalBilled.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Settled:</span>
                                            <span className="font-medium text-green-600">LKR {shop.totalSettled.toLocaleString()}</span>
                                        </div>
                                        {shop.totalCommonPay > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Total Common Pay:</span>
                                                <span className="font-medium text-blue-600">LKR {shop.totalCommonPay.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
                                            <span>Balance to Settle:</span>
                                            <span className="text-red-500 text-base">LKR {shop.totalBalance.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                    {filteredShops.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No shops found.
                        </div>
                    )}
                </div>
            )}

            <AddLoanModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
