export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Inventory Management</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Track stock levels, suppliers, and inventory transactions
        </p>
      </div>

      <div className="card">
        <div className="p-6">
          <div className="text-center py-12 text-secondary-500">
            <p>Inventory management interface coming soon.</p>
            <p className="text-sm mt-2">This page will include:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Inventory items and stock tracking</li>
              <li>• Low stock alerts</li>
              <li>• Purchase orders and suppliers</li>
              <li>• Stock transaction history</li>
              <li>• Auto-deduction based on menu usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
