export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Generate detailed reports and export data
        </p>
      </div>

      <div className="card">
        <div className="p-6">
          <div className="text-center py-12 text-secondary-500">
            <p>Reports interface coming soon.</p>
            <p className="text-sm mt-2">This page will include:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Revenue reports with date filters</li>
              <li>• Event summary reports</li>
              <li>• Inventory usage reports</li>
              <li>• Staff workload reports</li>
              <li>• Customer history reports</li>
              <li>• Export to CSV and PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
