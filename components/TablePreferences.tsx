'use client';

import { NodeService } from '@/utils/node-service';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface IPerferences {
  id: string;
  created_at: string;
  user: string;
  min_score: number;
  category: number;
}

const TablePreferences = () => {
  const [preferences, setPreferences] = useState<IPerferences[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initiatePreferences();
  }, []);

  const initiatePreferences = async () => {
    NodeService.getAllPreferences().then((res) => {
      setPreferences(res);
      setLoading(false);
    });
  };

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                {/* <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                >
                  Name
                </th> */}
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Created at
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Minimum Score
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Category
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading &&
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    {/* <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0 w-1/4">
                      <div className="rounded-full bg-slate-200 h-4 w-full"></div>
                    </td> */}
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="rounded-full bg-slate-200 h-4 w-full"></div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="rounded-full bg-slate-200 h-4 w-full"></div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="rounded-full bg-slate-200 h-4 w-full"></div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="rounded-full bg-slate-200 h-4 w-full"></div>
                    </td>
                  </tr>
                ))}
              {preferences.map((perference) => (
                <tr key={perference.id}>
                  {/* <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0 w-1/4">
                    {perference.name}
                  </td> */}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(perference.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {perference.min_score}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {perference.category}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <Link
                      href={`/tgd/preferences/edit/${perference.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit<span className="sr-only">, ...</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TablePreferences;
