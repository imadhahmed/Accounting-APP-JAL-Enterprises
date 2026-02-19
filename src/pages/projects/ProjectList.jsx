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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your ongoing and completed projects</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" />
                    New Project
                </Button>
            </div>

            <div className="relative max-w-md">
                <Input
                    leftIcon={Search}
                    placeholder="Search projects by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10">Loading projects...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link key={project.id} to={`/projects/${project.id}`} className="block group">
                            <Card className="h-full hover:shadow-md transition-shadow border-l-4 border-l-primary-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
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
                                        <span className="font-medium">₹{Number(project.value).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Credited:</span>
                                        <span className="font-medium text-green-600">₹{Number(project.totalCredited || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Expenses:</span>
                                        <span className="font-medium text-red-600">₹{Number(project.totalExpenses || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2 flex justify-between text-sm font-semibold">
                                        <span>Balance:</span>
                                        <span className={(project.totalCredited - project.totalExpenses) < 0 ? 'text-red-600' : 'text-gray-900'}>
                                            ₹{((project.totalCredited || 0) - (project.totalExpenses || 0)).toLocaleString()}
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
