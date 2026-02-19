import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import AddProjectModal from '../projects/AddProjectModal';
import { DollarSign, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import Badge from '../../components/UI/Badge';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        totalProjectValue: 0,
        totalCredited: 0,
        totalExpenses: 0,
        availableBalance: 0,
        projectsCount: 0
    });
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Listen to real-time updates for projects
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalValue = 0;
            let totalCredited = 0;
            let totalExpenses = 0;
            const projectsData = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                projectsData.push({ id: doc.id, ...data });

                totalValue += Number(data.value || 0);
                totalCredited += Number(data.totalCredited || 0);
                totalExpenses += Number(data.totalExpenses || 0);
            });

            setStats({
                totalProjectValue: totalValue,
                totalCredited: totalCredited,
                totalExpenses: totalExpenses,
                availableBalance: totalCredited - totalExpenses,
                projectsCount: projectsData.length
            });

            setProjects(projectsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const statCards = [
        {
            name: 'Total Project Value',
            value: `₹${stats.totalProjectValue.toLocaleString()}`,
            icon: Briefcase,
            color: 'bg-blue-500'
        },
        {
            name: 'Total Credited',
            value: `₹${stats.totalCredited.toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-green-500'
        },
        {
            name: 'Total Expenses',
            value: `₹${stats.totalExpenses.toLocaleString()}`,
            icon: TrendingDown,
            color: 'bg-red-500'
        },
        {
            name: 'Available Balance',
            value: `₹${stats.availableBalance.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-purple-500',
            textColor: stats.availableBalance < 0 ? 'text-red-600' : 'text-green-600'
        },
    ];

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Overview of your financial performance
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Briefcase className="h-5 w-5 mr-2" />
                    New Project
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item) => (
                    <Card key={item.name} className="flex items-center">
                        <div className={`flex-shrink-0 p-3 rounded-md ${item.color}`}>
                            <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                <dd className={`text-lg font-semibold ${item.textColor || 'text-gray-900'}`}>
                                    {item.value}
                                </dd>
                            </dl>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-8">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Projects</h2>
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credited</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projects.slice(0, 5).map((project) => (
                                    <tr key={project.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">₹{Number(project.value).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-green-600">₹{(project.totalCredited || 0).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-red-600">₹{(project.totalExpenses || 0).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={project.totalCredited >= project.value ? 'green' : 'blue'}>
                                                {project.totalCredited >= project.value ? 'Completed' : 'In Progress'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {projects.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No projects found. Start by creating one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <AddProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectAdded={() => { }}
            />
        </div>
    );
}
