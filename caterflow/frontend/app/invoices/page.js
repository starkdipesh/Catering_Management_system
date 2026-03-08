export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Invoices & Payments</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Manage invoices and track payments
        </p>
      </div>

      <div className="card">
        <div className="p-6">
          <div className="text-center py-12 text-secondary-500">
            <p>Invoicing interface coming soon.</p>
            <p className="text-sm mt-2">This page will include:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Generate invoices from events</li>
              <li>• PDF invoice download</li>
              <li>• Payment tracking</li>
              <li>• Partial payment support</li>
              <li>• Overdue invoice alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
