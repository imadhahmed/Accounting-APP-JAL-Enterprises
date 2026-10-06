import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { PROJECTS_COLLECTION, BILLS_COLLECTION, COMMON_PAYS_COLLECTION } from '../services/firestore';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Table from '../components/UI/Table';
import Badge from '../components/UI/Badge';
import { Printer, Calendar, FileText, TrendingUp, DollarSign, ChevronDown, ChevronRight, History } from 'lucide-react';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'billing' or 'daily'
    const [projects, setProjects] = useState([]);
    const [bills, setBills] = useState([]);
    const [commonPays, setCommonPays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDate, setExpandedDate] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const projectsQuery = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));
        const billsQuery = query(collection(db, BILLS_COLLECTION), orderBy('date', 'desc'));
        const commonPaysQuery = query(collection(db, COMMON_PAYS_COLLECTION), orderBy('date', 'desc'));

        const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubBills = onSnapshot(billsQuery, (snapshot) => {
            setBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubCommonPays = onSnapshot(commonPaysQuery, (snapshot) => {
            setCommonPays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);

        return () => {
            unsubProjects();
            unsubBills();
            unsubCommonPays();
        };
    }, []);

    const filterByDate = (item, dateField) => {
        if (!startDate && !endDate) return true;
        const itemDate = new Date(dateField);
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-01-01');
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
    };

    const filteredProjects = projects.filter(p => filterByDate(p, p.createdAt));
    const filteredBills = bills.filter(b => filterByDate(b, b.date));
    const filteredCommonPays = commonPays.filter(cp => filterByDate(cp, cp.date));

    // Project Stats
    const projectStats = {
        total: filteredProjects.length,
        totalValue: filteredProjects.reduce((sum, p) => sum + Number(p.totalProjectValue || 0), 0),
        totalExpenses: filteredProjects.reduce((sum, p) => sum + Number(p.totalExpenses || 0), 0),
        netBalance: filteredProjects.reduce((sum, p) => sum + (Number(p.totalProjectValue || 0) - Number(p.totalExpenses || 0)), 0),
        totalCredited: filteredProjects.reduce((sum, p) => sum + Number(p.totalCredited || 0), 0),
    };

    // Bill Stats
    const totalSpecificSettled = filteredBills.reduce((sum, b) => sum + Number(b.settledAmount || 0), 0);
    const totalCommonPay = filteredCommonPays.reduce((sum, cp) => sum + Number(cp.amount || 0), 0);

    const billStats = {
        total: filteredBills.length,
        totalAmount: filteredBills.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
        totalSettled: totalSpecificSettled + totalCommonPay,
        pending: filteredBills.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0) - (totalSpecificSettled + totalCommonPay),
        totalCommonPay: totalCommonPay
    };

    // Daily History Logic
    const getFormattedDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const allHistoryDates = [...new Set([
        ...filteredProjects.map(p => getFormattedDate(p.createdAt)),
        ...filteredBills.map(b => getFormattedDate(b.date)),
        ...filteredCommonPays.map(cp => getFormattedDate(cp.date))
    ])].filter(Boolean).sort((a, b) => new Date(b) - new Date(a));

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 print:p-0 print:space-y-4">
            {/* Header controls - Hidden on print */}
            <div className="flex flex-col gap-3 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1 min-w-[130px] max-w-[180px]"
                    />
                    <span className="text-gray-500 flex-shrink-0">to</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 min-w-[130px] max-w-[180px]"
                    />
                    <Button onClick={handlePrint} variant="secondary" className="flex-shrink-0">
                        <Printer className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Print Report</span>
                        <span className="sm:hidden">Print</span>
                    </Button>
                </div>
            </div>

            {/* Print Header - Visible only on print */}
            <div className="hidden print:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">JAL Construction - Financial Report</h1>
                <p className="text-gray-600">
                    Generated on: {new Date().toLocaleDateString()}
                    {startDate && ` | From: ${new Date(startDate).toLocaleDateString()}`}
                    {endDate && ` | To: ${new Date(endDate).toLocaleDateString()}`}
                </p>
            </div>

            {/* Tabs - Hidden on print */}
            <div className="border-b border-gray-200 print:hidden overflow-x-auto">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'projects'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'billing'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Billing
                    </button>
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${activeTab === 'daily'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <History className="h-4 w-4 mr-2" />
                        Daily History
                    </button>
                </nav>
            </div>

            {/* Project Report Content */}
            {(activeTab === 'projects' || window.matchMedia('print').matches) && (
                <div className={activeTab === 'billing' ? 'print:hidden' : ''}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 print:mb-2">Project Summary</h2>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Total Projects</p>
                            <p className="text-2xl font-bold text-gray-900">{projectStats.total}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-2xl font-bold text-indigo-600">LKR {projectStats.totalValue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">LKR {projectStats.totalExpenses.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Received Amount</p>
                            <p className="text-2xl font-bold text-green-600">LKR {projectStats.totalCredited.toLocaleString()}</p>
                        </div>
                    </div>

                    <Card className="print:shadow-none print:border-none print:p-0 p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table headers={['Project', 'Client', 'Value', 'Received', 'Expense', 'Status']}>
                                {filteredProjects.map(project => (
                                    <tr key={project.id} className="print:break-inside-avoid">
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-900">{project.projectName}</div>
                                            <div className="text-xs text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{project.clientName}</td>
                                        <td className="px-4 py-4 text-sm font-medium">LKR {Number(project.totalProjectValue).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-green-600">LKR {Number(project.totalCredited || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-red-600">LKR {Number(project.totalExpenses || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant={project.status === 'completed' ? 'success' : 'warning'}>
                                                {project.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </Table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Billing Report Content */}
            {(activeTab === 'billing' || window.matchMedia('print').matches) && (
                <div className={`mt-8 ${activeTab === 'projects' ? 'print:hidden' : ''}`}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 print:mb-2 print:mt-8">Billing Summary</h2>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Total Bills</p>
                            <p className="text-2xl font-bold text-gray-900">{billStats.total}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Total Billed</p>
                            <p className="text-2xl font-bold text-gray-900">LKR {billStats.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Total Settled</p>
                            <p className="text-2xl font-bold text-green-600">LKR {billStats.totalSettled.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Common Pays</p>
                            <p className="text-2xl font-bold text-blue-600">LKR {billStats.totalCommonPay.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 print:border-black print:shadow-none">
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-red-600">LKR {billStats.pending.toLocaleString()}</p>
                        </div>
                    </div>

                    <Card className="print:shadow-none print:border-none print:p-0 p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table headers={['Bill #', 'Shop Name', 'Date', 'Project', 'Amount', 'Settled', 'Balance']}>
                                {filteredBills.map(bill => (
                                    <tr key={bill.id} className="print:break-inside-avoid">
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">#{bill.billNumber}</td>
                                        <td className="px-4 py-4 text-sm text-gray-900">{bill.shopName}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{new Date(bill.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{bill.projectName}</td>
                                        <td className="px-4 py-4 text-sm font-medium">LKR {Number(bill.totalAmount).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-green-600">LKR {Number(bill.settledAmount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-red-600">
                                            LKR {(Number(bill.totalAmount) - Number(bill.settledAmount || 0)).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </Table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Daily History Content */}
            {(activeTab === 'daily' || window.matchMedia('print').matches) && (
                <div className={`mt-8 ${activeTab !== 'daily' ? 'print:hidden' : ''}`}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 print:mb-2 print:mt-8">Daily History Tracker</h2>
                    <div className="space-y-4">
                        {allHistoryDates.map(date => {
                            const dateProjects = filteredProjects.filter(p => getFormattedDate(p.createdAt) === date);
                            const dateBills = filteredBills.filter(b => getFormattedDate(b.date) === date);
                            const dateCommonPays = filteredCommonPays.filter(cp => getFormattedDate(cp.date) === date);

                            const isExpanded = expandedDate === date || window.matchMedia('print').matches;

                            return (
                                <Card key={date} className="p-0 overflow-hidden print:shadow-none print:border-black print:mb-4">
                                    <div
                                        className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 cursor-pointer flex justify-between items-start sm:items-center hover:bg-gray-100 print:bg-white print:border-b print:border-black"
                                        onClick={() => setExpandedDate(isExpanded ? null : date)}
                                    >
                                        <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 min-w-0">
                                            <Calendar className="h-5 w-5 text-indigo-600 print:hidden flex-shrink-0 mt-0.5 sm:mt-0" />
                                            <div className="min-w-0">
                                                <h3 className="text-base sm:text-lg font-bold text-gray-900">{new Date(date).toLocaleDateString()}</h3>
                                                <div className="flex flex-wrap gap-1.5 mt-1 print:hidden">
                                                    {dateBills.length > 0 && <Badge variant="info">{dateBills.length} Bills</Badge>}
                                                    {dateCommonPays.length > 0 && <Badge variant="warning">{dateCommonPays.length} Common Pays</Badge>}
                                                    {dateProjects.length > 0 && <Badge variant="success">{dateProjects.length} Projects</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-gray-500 print:hidden flex-shrink-0 ml-2">
                                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-3 sm:p-6 space-y-6 bg-white shrink-0">
                                            {dateBills.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1 flex items-center">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Bills
                                                    </h4>
                                                    <Table headers={['Bill #', 'Shop', 'Project', 'Description', 'Amount', 'Settled']}>
                                                        {dateBills.map(bill => (
                                                            <tr key={`bill-${bill.id}`} className="print:break-inside-avoid">
                                                                <td className="px-6 py-3 text-sm font-medium">#{bill.billNumber}</td>
                                                                <td className="px-6 py-3 text-sm">{bill.shopName}</td>
                                                                <td className="px-6 py-3 text-sm">{bill.projectName}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-500">{bill.description || '-'}</td>
                                                                <td className="px-6 py-3 text-sm font-medium">LKR {Number(bill.totalAmount).toLocaleString()}</td>
                                                                <td className="px-6 py-3 text-sm font-medium text-green-600">LKR {Number(bill.settledAmount || 0).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </Table>
                                                </div>
                                            )}

                                            {dateCommonPays.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1 flex items-center">
                                                        <DollarSign className="h-4 w-4 mr-2" />
                                                        Common Pays
                                                    </h4>
                                                    <Table headers={['Shop', 'Amount', 'Description']}>
                                                        {dateCommonPays.map(cp => (
                                                            <tr key={`cp-${cp.id}`} className="print:break-inside-avoid">
                                                                <td className="px-6 py-3 text-sm font-medium">{cp.shopName}</td>
                                                                <td className="px-6 py-3 text-sm font-medium text-blue-600">LKR {Number(cp.amount).toLocaleString()}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-500">{cp.description || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </Table>
                                                </div>
                                            )}

                                            {dateProjects.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1 flex items-center">
                                                        <TrendingUp className="h-4 w-4 mr-2" />
                                                        Projects Started
                                                    </h4>
                                                    <Table headers={['Project', 'Client', 'Description', 'Value']}>
                                                        {dateProjects.map(project => (
                                                            <tr key={`proj-${project.id}`} className="print:break-inside-avoid">
                                                                <td className="px-6 py-3 text-sm font-medium">{project.projectName}</td>
                                                                <td className="px-6 py-3 text-sm">{project.clientName}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-500">{project.description || '-'}</td>
                                                                <td className="px-6 py-3 text-sm font-medium">LKR {Number(project.totalProjectValue).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}

                        {allHistoryDates.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 print:hidden">
                                <History className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <p className="text-gray-500 text-lg">No history found for the selected date range.</p>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting your date filters above.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
