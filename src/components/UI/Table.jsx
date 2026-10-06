export default function Table({ headers, children }) {
    return (
        <div className="w-full overflow-x-auto touch-scroll">
            <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    scope="col"
                                    className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
