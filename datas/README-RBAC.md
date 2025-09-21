# Role-Based Access Control (RBAC) Implementation

## 🎯 Overview
Implemented comprehensive RBAC system with 4 distinct roles, each with specific permissions and UI access levels.

## 👥 Roles & Permissions

### 1. **Admin** (Full System Access)
- **Database Access**: All tables with full CRUD
- **UI Access**: Complete dashboard with all modules
- **Permissions**: 
  - Create/Edit/Delete Manufacturing Orders
  - Create/Edit/Delete Work Orders
  - View/Manage Work Centers
  - Full Stock Ledger access
  - Generate all reports
  - User management capabilities

### 2. **Manager** (Production Management)
- **Database Access**: MO, WO, BOM, Work Centers, Stock (Read/Write)
- **UI Access**: Production-focused dashboard
- **Permissions**:
  - Create/Edit Manufacturing Orders
  - Create/Edit Work Orders
  - View Work Center utilization
  - Monitor stock levels
  - Generate production reports

### 3. **Operator** (Shop Floor Execution)
- **Database Access**: Only assigned Work Orders (Update status)
- **UI Access**: Simplified task-focused interface
- **Permissions**:
  - View only assigned Work Orders
  - Update WO status (Start/Pause/Complete)
  - Add comments and issues
  - No access to MO creation or deletion

### 4. **Inventory** (Stock Management)
- **Database Access**: Stock Ledger (Full), MO/BOM (Read-only)
- **UI Access**: Inventory-focused dashboard
- **Permissions**:
  - Full Stock Ledger management
  - View Manufacturing Orders for planning
  - View BOM for material requirements
  - No work order execution access

## 🗄️ Database Schema Updates

### Roles Table
```sql
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Users Table
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(role_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

## 🔐 Backend Security Implementation

### JWT Token Enhancement
- Tokens now include `roleId` and `role` name
- Role validation on every API request
- Automatic token refresh with role verification

### API Endpoint Protection
```javascript
// Example: Manufacturing Orders
app.get('/api/manufacturing-orders', 
  authenticateToken, 
  checkPermission(['admin', 'manager', 'inventory']), 
  async (req, res) => { ... }
);

// Example: Work Order Updates
app.put('/api/work-orders/:id', 
  authenticateToken, 
  checkPermission(['admin', 'manager', 'operator']), 
  async (req, res) => { ... }
);
```

### Role-Based Data Filtering
- **Operators**: Only see their assigned work orders
- **Inventory**: Stock-focused data filtering
- **Managers**: Production-wide visibility
- **Admins**: Complete system access

## 🎨 Frontend Access Control

### Dynamic Navigation
```javascript
const getAccessibleTabs = () => {
  const tabs = { overview: '🏠 Overview' }
  
  if (userRole === 'admin') {
    // Full access to all modules
  } else if (userRole === 'manager') {
    // Production management modules
  } else if (userRole === 'operator') {
    // Only work orders and profile
  } else if (userRole === 'inventory') {
    // Stock and planning modules
  }
  
  return tabs
}
```

### Conditional UI Elements
- **Create/Edit buttons**: Hidden for read-only roles
- **Action buttons**: Role-specific availability
- **Form fields**: Disabled based on permissions
- **Data visibility**: Filtered by role context

### Role-Based Components
```javascript
// RoleBasedComponent wrapper
<RoleBasedComponent allowedRoles={['admin', 'manager']}>
  <CreateOrderButton />
</RoleBasedComponent>

// useRoleCheck hook
const { canCreate, canEdit, canDelete } = useRoleCheck();
```

## 🔄 Authentication Flow

### 1. **Login Process**
```
User Login → Validate Credentials → Get Role from DB → Generate JWT with Role → Return Token + User Info
```

### 2. **API Request Flow**
```
API Request → Extract JWT → Validate Token → Check Role Permissions → Execute/Deny Request
```

### 3. **Frontend Rendering**
```
Component Load → Check User Role → Render Appropriate UI → Hide/Show Elements Based on Permissions
```

## 🛡️ Security Features

### Backend Security
- **JWT with Role Claims**: Secure token-based authentication
- **Permission Middleware**: Automatic role checking on all endpoints
- **Data Isolation**: Users only see data they're authorized to access
- **Audit Trail Ready**: All actions linked to authenticated users

### Frontend Security
- **Route Protection**: Role-based navigation restrictions
- **Component-Level Security**: Conditional rendering based on permissions
- **API Error Handling**: Graceful handling of 403 Forbidden responses
- **Token Management**: Automatic logout on token expiry

## 📊 Role-Specific Dashboards

### Admin Dashboard
- **Full KPIs**: System-wide metrics and analytics
- **User Management**: Create/edit user accounts and roles
- **System Reports**: Complete production and performance reports
- **All Modules**: Access to every system component

### Manager Dashboard
- **Production KPIs**: Order progress, bottlenecks, efficiency
- **Resource Management**: Work center utilization and assignments
- **Planning Tools**: BOM management and capacity planning
- **Team Oversight**: Operator assignments and performance

### Operator Dashboard
- **Task List**: Personal work order queue
- **Status Updates**: Quick action buttons for WO progress
- **Time Tracking**: Start/pause/complete with timestamps
- **Issue Reporting**: Comment system for problems and delays

### Inventory Dashboard
- **Stock Levels**: Real-time inventory balances
- **Material Planning**: BOM-based requirement calculations
- **Shortage Alerts**: Low stock warnings and predictions
- **Transaction History**: Complete stock movement tracking

## 🚀 Benefits Achieved

### Security Benefits
✅ **Zero Trust Architecture**: Every request validated  
✅ **Principle of Least Privilege**: Users see only what they need  
✅ **Data Segregation**: Role-based data access control  
✅ **Audit Compliance**: Complete action traceability  

### User Experience Benefits
✅ **Simplified Interfaces**: Role-specific UI reduces complexity  
✅ **Faster Navigation**: Relevant modules only  
✅ **Reduced Errors**: Limited access prevents accidental changes  
✅ **Focused Workflows**: Task-oriented dashboards  

### System Benefits
✅ **Scalable Architecture**: Easy to add new roles  
✅ **Maintainable Code**: Clean separation of concerns  
✅ **Performance Optimized**: Filtered queries reduce load  
✅ **Future-Ready**: Extensible permission system  

## 🔮 Future Enhancements

### Advanced RBAC Features
- **Fine-Grained Permissions**: Module-level action controls
- **Dynamic Role Assignment**: Temporary elevated permissions
- **Multi-Role Support**: Users with multiple role contexts
- **Time-Based Access**: Shift-based role activation

### Integration Ready
- **SSO Integration**: LDAP/Active Directory support
- **API Key Management**: Service-to-service authentication
- **Mobile App Support**: Role-based mobile interfaces
- **Third-Party Integration**: ERP system role mapping

---

**RBAC Status: ✅ COMPLETE**  
**Security Level**: Enterprise-Grade  
**Roles Implemented**: 4 (Admin, Manager, Operator, Inventory)  
**Protection Level**: API + Frontend + Database