import api from '@/lib/api';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type ApiResult = {
    status: number | string;
    data: unknown;
};

export default function ApiTest() {
    const [result, setResult] = useState<ApiResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/permissions')
            .then((response) => {
                setResult({
                    status: response.status,
                    data: response.data,
                });
            })
            .catch((error) => {
                console.error('API Error:', error);

                setResult({
                    status: error.response?.status ?? 'Network Error',
                    data: error.response?.data ?? error.message,
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Head title="Permission API Test" />

            <div className="min-h-screen p-8">
                <h1 className="mb-4 text-2xl font-bold">Permission API Test</h1>

                {loading ? <p>Connecting...</p> : <pre className="rounded-lg bg-gray-100 p-4 text-sm">{JSON.stringify(result, null, 4)}</pre>}
            </div>
        </>
    );
}
