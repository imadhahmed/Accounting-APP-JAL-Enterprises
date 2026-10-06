import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import AddProjectModal from './AddProjectModal';

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjects(projectsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your ongoing and completed projects</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-5 w-5 mr-2" />
                    New Project
                </Button>
            </div>

            <div className="relative w-full sm:max-w-md">
                <Input
                    leftIcon={Search}
                    placeholder="Search projects by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading projects...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredProjects.map((project) => (
                        <Link key={project.id} to={`/projects/${project.id}`} className="block group touch-manipulation">
                            <Card className="h-full hover:shadow-md transition-all active:scale-[0.99] border-l-4 border-l-primary-500 p-4 sm:p-5">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Started: {new Date(project.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge variant={project.totalCredited >= project.value ? 'green' : 'blue'}>
                                        {project.totalCredited >= project.value ? 'Done' : 'Active'}
                                    </Badge>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Value:</span>
                                        <span className="font-medium">LKR {Number(project.value).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Credited:</span>
                                        <span className="font-medium text-green-600">LKR {Number(project.totalCredited || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Expenses:</span>
                                        <span className="font-medium text-red-600">LKR {Number(project.totalExpenses || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2 flex justify-between text-sm font-semibold">
                                        <span>Balance:</span>
                                        <span className={(project.totalCredited - project.totalExpenses) < 0 ? 'text-red-600' : 'text-gray-900'}>
                                            LKR {((project.totalCredited || 0) - (project.totalExpenses || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No projects found matching your search.
                        </div>
                    )}
                </div>
            )}

            <AddProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectAdded={() => {
                    // Success toast or logic if needed, snapshot handles update
                }}
            />
        </div>
    );
}
