# CaterFlow Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           CATERFLOW SAAS DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│  subscription_plans │◄────────│      tenants        │────────►│   tenant_settings   │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ PK: id              │    1:M  │ PK: id              │    1:M  │ PK: id              │
│ name                │         │ tenant_id (unique)  │         │ FK: tenant_id       │
│ price_monthly       │         │ business_name       │         │ setting_key         │
│ max_events          │         │ FK: subscription_   │         │ setting_value       │
│ max_staff           │         │     plan_id         │         └─────────────────────┘
│ features (JSON)     │         │ subscription_status │
└─────────────────────┘         │ is_trial            │
                                │ trial_ends_at       │
                                └─────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
           ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
           │      users      │  │    customers    │  │    invoices     │
           ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
           │ PK: id          │  │ PK: id          │  │ PK: id          │
           │ FK: tenant_id   │  │ FK: tenant_id   │  │ FK: tenant_id   │
           │ email           │  │ first_name      │  │ FK: customer_id │
           │ password_hash   │  │ last_name       │  │ FK: event_id    │
           │ role (enum)     │  │ phone           │  │ invoice_number  │
           │ is_active       │  │ customer_type   │  │ total_amount    │
           └─────────────────┘  │ total_events    │  │ status          │
                    │           │ total_revenue   │  │ amount_due      │
                    │           └─────────────────┘  └─────────────────┘
                    │                   │                    │
        ┌───────────┴───────────┐       │                    │
        │                       │       │                    │
        ▼                       ▼       ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  refresh_tokens │  │   staff_details │  │ invoice_items   │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ PK: id          │  │ PK: id          │  │ PK: id          │
│ FK: user_id     │  │ FK: user_id     │  │ FK: invoice_id  │
│ token           │  │ FK: tenant_id   │  │ description     │
│ expires_at      │  │ employee_code   │  │ quantity        │
└─────────────────┘  │ designation     │  │ unit_price      │
                     │ department      │  └─────────────────┘
                     │ joining_date    │
                     │ salary          │
                     │ skills (JSON)   │
                     └─────────────────┘
                              │
                              │
                              ▼
                     ┌─────────────────┐
                     │staff_assignments│
                     ├─────────────────┤
                     │ PK: id          │
                     │ FK: staff_id    │
                     │ FK: event_id    │
                     │ FK: tenant_id   │
                     │ role_at_event   │
                     │ status          │
                     └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EVENTS MODULE                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│       events        │◄────────│   event_menu_items  │────────►│    menu_items       │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ PK: id              │    1:M  │ PK: id              │    M:1  │ PK: id              │
│ FK: tenant_id       │         │ FK: event_id        │         │ FK: tenant_id       │
│ FK: customer_id     │         │ FK: menu_item_id    │         │ FK: category_id     │
│ event_name          │         │ quantity            │         │ name                │
│ event_type          │         │ custom_price        │         │ price_per_plate     │
│ event_date          │         └─────────────────────┘         │ ingredients         │
│ guest_count         │                                         │ dietary_info (JSON) │
│ total_amount        │         ┌─────────────────────┐         └─────────────────────┘
│ status              │         │   event_timeline    │                  │
│ payment_status      │         ├─────────────────────┤                  │
│ FK: menu_package_id │         │ PK: id              │                  │
│ FK: assigned_mgr_id │         │ FK: event_id        │                  ▼
└─────────────────────┘         │ timeline_type       │        ┌─────────────────────┐
         │                      │ title               │        │   menu_categories   │
         │                      │ scheduled_time      │        ├─────────────────────┤
         │                      │ FK: assigned_staff  │        │ PK: id              │
         │                      └─────────────────────┘        │ FK: tenant_id       │
         │                                                     │ name                │
         │                                                     └─────────────────────┘
         │
         │                      ┌─────────────────────┐
         │                      │   menu_packages     │
         └─────────────────────►├─────────────────────┤
                                │ PK: id              │
                                │ FK: tenant_id       │
                                │ name                │
                                │ package_type        │
                                │ base_price          │
                                └─────────────────────┘
                                         │
                                         │
                                         ▼
                                ┌─────────────────────┐
                                │  menu_package_items │
                                ├─────────────────────┤
                                │ PK: id              │
                                │ FK: package_id      │
                                │ FK: menu_item_id    │
                                │ quantity            │
                                └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  INVENTORY MODULE                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│      suppliers      │◄────────│   inventory_items   │◄────────│inventory_categories │
├─────────────────────┤         ├─────────────────────┤         ├─────────────────────┤
│ PK: id              │    1:M  │ PK: id              │    M:1  │ PK: id              │
│ FK: tenant_id       │         │ FK: tenant_id       │         │ FK: tenant_id       │
│ name                │         │ FK: category_id     │         │ name                │
│ contact_person      │         │ FK: supplier_id     │         └─────────────────────┘
│ phone               │         │ name                │
│ email               │         │ unit                │
│ categories (JSON)   │         │ quantity            │
└─────────────────────┘         │ min_threshold       │
                                │ cost_per_unit       │
                                │ storage_location    │
                                └─────────────────────┘
                                         │
                                         │
                                         ▼
                                ┌─────────────────────┐
                                │inventory_transactions│
                                ├─────────────────────┤
                                │ PK: id              │
                                │ FK: tenant_id       │
                                │ FK: inventory_item  │
                                │ transaction_type    │
                                │ quantity            │
                                │ unit_cost           │
                                │ reference_type      │
                                │ performed_by        │
                                └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PAYMENTS MODULE                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│      invoices       │◄────────│      payments       │────────►│      customers      │
├─────────────────────┤    1:M  ├─────────────────────┤    M:1  ├─────────────────────┤
│ PK: id              │         │ PK: id              │         │ PK: id              │
│ FK: tenant_id       │         │ FK: tenant_id       │         │ FK: tenant_id       │
│ FK: customer_id     │         │ FK: invoice_id      │         │ ...                 │
│ FK: event_id        │         │ FK: customer_id     │         └─────────────────────┘
│ invoice_number      │         │ FK: event_id        │
│ total_amount        │         │ amount              │
│ amount_due          │         │ payment_method      │
│ status              │         │ payment_date        │
└─────────────────────┘         │ status              │
                                │ received_by         │
                                │ gateway_transaction │
                                └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SUBSCRIPTION BILLING                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│      tenants        │◄────────│ subscription_invoices
├─────────────────────┤    1:M  ├─────────────────────┤
│ PK: id              │         │ PK: id              │
│ ...                 │         │ FK: tenant_id       │
└─────────────────────┘         │ FK: plan_id         │
                                │ invoice_number      │
                                │ billing_period      │
                                │ amount              │
                                │ status              │
                                └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUDIT LOGGING                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│    activity_logs    │
├─────────────────────┤
│ PK: id              │
│ FK: tenant_id       │
│ FK: user_id         │
│ action              │
│ entity_type         │
│ entity_id           │
│ old_values (JSON)   │
│ new_values (JSON)   │
│ ip_address          │
│ created_at          │
└─────────────────────┘
```

## Table Relationships Summary

### Core Tables (No Dependencies)
- `subscription_plans` - Master data for subscription tiers

### Tenant-Based Tables (FK: tenant_id)
| Table | Description | Key Relationships |
|-------|-------------|-----------------|
| `tenants` | Main business entity | FK → subscription_plans |
| `users` | All users (tenant + super_admin) | FK → tenants (nullable for super_admin) |
| `customers` | Customer database | FK → tenants |
| `menu_categories` | Menu organization | FK → tenants |
| `menu_items` | Individual food items | FK → tenants, menu_categories |
| `menu_packages` | Bundled menu offerings | FK → tenants |
| `events` | Catering events | FK → tenants, customers, users, menu_packages |
| `suppliers` | Inventory suppliers | FK → tenants |
| `inventory_categories` | Inventory organization | FK → tenants |
| `inventory_items` | Stock items | FK → tenants, inventory_categories, suppliers |
| `invoices` | Billing documents | FK → tenants, events, customers |
| `payments` | Payment records | FK → tenants, invoices, customers, events |
| `subscription_invoices` | SaaS billing | FK → tenants, subscription_plans |
| `staff_details` | Extended staff info | FK → tenants, users |
| `staff_assignments` | Event staffing | FK → tenants, events, users |

### Junction/Link Tables
| Table | Purpose | Relationships |
|-------|---------|---------------|
| `tenant_settings` | Key-value settings | FK → tenants |
| `refresh_tokens` | JWT refresh tokens | FK → users |
| `menu_package_items` | Package contents | FK → menu_packages, menu_items |
| `event_menu_items` | Custom event menus | FK → events, menu_items |
| `event_timeline` | Event schedule | FK → events, users |
| `inventory_transactions` | Stock movements | FK → tenants, inventory_items, users |
| `invoice_items` | Invoice line items | FK → invoices |
| `activity_logs` | Audit trail | FK → tenants, users |

## Multi-Tenant Design

All tenant-scoped tables include:
- `tenant_id` INT NOT NULL (with foreign key constraint)
- Composite unique indexes where needed (e.g., `(tenant_id, email)`)
- Automatic CASCADE DELETE on tenant removal

## Indexes for Performance

See schema.sql for complete index definitions covering:
- Tenant isolation lookups (`idx_*_tenant`)
- Foreign key relationships
- Date range queries (events, invoices)
- Status filters
- Full-text search support

## Data Types

- **Currency**: DECIMAL(10,2) for prices, DECIMAL(12,2) for totals
- **Quantities**: DECIMAL(10,3) for inventory (supports fractional units)
- **JSON Fields**: Used for flexible data (features, dietary_info, skills, etc.)
- **Enums**: Used for status fields and fixed value lists
- **Timestamps**: All tables include created_at/updated_at

## Security Considerations

1. **Tenant Isolation**: Every query MUST include `tenant_id` filter
2. **Role-based Access**: `users.role` controls feature access
3. **Audit Trail**: `activity_logs` tracks all changes
4. **Soft Deletes**: Use `is_active` flags instead of hard deletes
5. **Password Security**: Passwords hashed with bcrypt in `users.password_hash`
