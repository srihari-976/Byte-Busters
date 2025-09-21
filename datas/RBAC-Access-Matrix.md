# Role-Based Access Control Matrix

## 🎯 **4 Manufacturing Roles & Access Permissions**

### **1. 👨‍💼 Manufacturing Manager**
**Role**: Oversee production orders and workflows
**Dashboard Access**: Full production management view

| Module | Access Level | Permissions |
|--------|-------------|-------------|
| **Manufacturing Orders** | ✅ Full CRUD | Create, Edit, Delete, Assign, Track status |
| **Work Orders** | ✅ Full CRUD | Create, Edit, Assign operators, Monitor progress |
| **BOM Manager** | ✅ Full Access | View, Edit components, Cost calculations |
| **Work Centers** | ✅ Full Access | Monitor utilization, Assign resources |
| **Stock Ledger** | ✅ View Only | Monitor inventory levels for planning |
| **Analytics** | ✅ Full Access | Production KPIs, Efficiency metrics, Trends |
| **Reports** | ✅ Generate All | Production reports, Resource utilization |
| **Profile** | ✅ Full Access | Personal settings, Team management |

---

### **2. ⚙️ Operator / Shop-floor Worker**
**Role**: Execute assigned work orders and update status
**Dashboard Access**: Task-focused interface with assigned work only

| Module | Access Level | Permissions |
|--------|-------------|-------------|
| **Manufacturing Orders** | ❌ No Access | Cannot view or modify |
| **Work Orders** | ✅ Limited | View ONLY assigned WOs, Update status (Start/Pause/Complete) |
| **BOM Manager** | ❌ No Access | Cannot view components |
| **Work Centers** | ❌ No Access | Cannot view resource data |
| **Stock Ledger** | ❌ No Access | Cannot view inventory |
| **Analytics** | ✅ Personal Only | Own task performance, Completion rates |
| **Reports** | ❌ No Access | Cannot generate reports |
| **Profile** | ✅ Limited | Personal settings only |

**Filtered Data**: Only sees work orders assigned to their user ID

---

### **3. 📦 Inventory Manager**
**Role**: Track stock movement, raw material usage, and ledger balance
**Dashboard Access**: Inventory-focused with planning capabilities

| Module | Access Level | Permissions |
|--------|-------------|-------------|
| **Manufacturing Orders** | ✅ View Only | Monitor for material planning, Cannot create/edit |
| **Work Orders** | ❌ No Access | Cannot view work execution |
| **BOM Manager** | ✅ View Only | Check material requirements, Cannot edit |
| **Work Centers** | ❌ No Access | Cannot view resource utilization |
| **Stock Ledger** | ✅ Full CRUD | Add/Remove stock, Track movements, Adjust balances |
| **Analytics** | ✅ Stock Focus | Inventory trends, Shortage alerts, Usage patterns |
| **Reports** | ✅ Inventory Only | Stock reports, Material usage, Shortage forecasts |
| **Profile** | ✅ Full Access | Personal settings, Inventory preferences |

---

### **4. 🔧 Business Owner / Admin**
**Role**: Monitor overall production KPIs, generate reports, ensure traceability
**Dashboard Access**: Complete system overview with all metrics

| Module | Access Level | Permissions |
|--------|-------------|-------------|
| **Manufacturing Orders** | ✅ Full CRUD | Complete control, System-wide visibility |
| **Work Orders** | ✅ Full CRUD | Monitor all operations, Assign resources |
| **BOM Manager** | ✅ Full CRUD | Modify components, Cost management |
| **Work Centers** | ✅ Full CRUD | Resource planning, Capacity management |
| **Stock Ledger** | ✅ Full CRUD | Complete inventory control |
| **Analytics** | ✅ Full Access | System KPIs, All metrics, Predictive insights |
| **Reports** | ✅ Generate All | All reports, Export capabilities, Audit trails |
| **Profile** | ✅ Full Access | System settings, User management |
| **Audit Logs** | ✅ Full Access | View all user actions, System traceability |

---

## 🔐 **Security Implementation**

### **API Endpoint Protection**
```javascript
// Manufacturing Orders - Manager/Admin only
app.get('/api/manufacturing-orders', authenticateToken, checkPermission(['admin', 'manager']))

// Work Orders - Filtered by role
app.get('/api/work-orders', authenticateToken, filterByRole) // Operators see only assigned

// Stock Ledger - Inventory/Admin/Manager
app.get('/api/stock-ledger', authenticateToken, checkPermission(['admin', 'manager', 'inventory']))

// Audit Logs - Admin only
app.get('/api/audit-logs', authenticateToken, checkPermission(['admin']))
```

### **Frontend UI Filtering**
```javascript
// Dynamic navigation based on role
const getAccessibleTabs = () => {
  if (userRole === 'admin') return allModules;
  if (userRole === 'manager') return productionModules;
  if (userRole === 'operator') return taskModules;
  if (userRole === 'inventory') return stockModules;
}

// Conditional action buttons
{canCreate && <CreateButton />}
{canEdit && <EditButton />}
{canDelete && <DeleteButton />}
```

## 📊 **Dashboard Views by Role**

### **Manager Dashboard**
- Production overview with all MOs
- Work center utilization
- Team performance metrics
- Resource allocation charts

### **Operator Dashboard**
- Personal task list
- Work order status updates
- Performance tracking
- Simple interface focus

### **Inventory Dashboard**
- Stock level monitoring
- Material requirement planning
- Shortage alerts
- Usage trend analysis

### **Admin Dashboard**
- System-wide KPIs
- All user activities
- Complete audit trails
- Business intelligence metrics

---

**Implementation Status**: ✅ **Complete RBAC System**  
**Security Level**: Enterprise-grade with data isolation  
**User Experience**: Role-optimized interfaces for maximum efficiency