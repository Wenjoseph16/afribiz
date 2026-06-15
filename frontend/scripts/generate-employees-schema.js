const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// ===== 1. Add new enums before first model =====
const firstModel = c.indexOf('\nmodel ');
const enumBlock = `

// ==================== EMPLOYEE ENUMS ====================
enum EmployeeStatus {
  ACTIVE
  SUSPENDED
  ON_LEAVE
  INACTIVE
}

enum EmployeePermission {
  VIEW_ORDERS
  MODIFY_STOCK
  MANAGE_BOOKINGS
  ACCESS_FINANCES
  MANAGE_EMPLOYEES
  REPLY_CLIENTS
  VIEW_SCHEDULE
  MANAGE_TASKS
  VIEW_STATS
}

enum AttendanceMethod {
  MANUAL
  QR_CODE
  PIN
  GPS
}

enum EmployeeDocumentType {
  CONTRACT
  ID_CARD
  CV
  CERTIFICATE
  LICENSE
  PERMIT
  OTHER
}

enum LeaveType {
  VACATION
  SICK
  PERSONAL
  MATERNITY
  PATERNITY
  OTHER
}

enum PerformanceRating {
  EXCELLENT
  GOOD
  AVERAGE
  BELOW_AVERAGE
  POOR
}

`;

c = c.slice(0, firstModel) + enumBlock + c.slice(firstModel + 1);

// ===== 2. Add Employee model before model EmployeeSchedule =====
const empSchedulePos = c.indexOf('\nmodel EmployeeSchedule {');
const employeeModel = `

// ==================== EMPLOYEE MANAGEMENT (Module 11) ====================
model Employee {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // Identity
  firstName           String
  lastName            String
  photo               String?
  phone               String
  whatsapp            String?
  email               String?
  gender              String?         // MALE, FEMALE, OTHER
  address             String?
  city                String?
  country             String?

  // Work
  position            String          // Manager, Cashier, Delivery, etc.
  department          String?
  employeeRoleId      String?
  employeeRole        EmployeeRole?   @relation(fields: [employeeRoleId], references: [id])
  hireDate            DateTime?
  salary              Decimal?        @db.Decimal(12, 2)
  salaryCurrency      String          @default("FCFA")

  // Access
  pinCode             String?         // For PIN-based attendance
  isRegistered        Boolean         @default(false)  // Has a User account linked?
  userId              String?         // Optional link to User
  user                User?           @relation(fields: [userId], references: [id])

  // Status
  status              EmployeeStatus  @default(ACTIVE)
  isActive            Boolean         @default(true)

  // Relations
  schedules           EmployeeSchedule[]
  attendances         Attendance[]
  documents           EmployeeDocument[]
  performances        EmployeePerformance[]
  activities          EmployeeActivity[]
  assignedTasks       PlanningTask[]  @relation("TaskAssignee")

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([businessId])
  @@index([status])
  @@index([department])
  @@index([userId])
}

model EmployeeRole {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)

  name                String          // Manager, Cashier, Delivery, Receptionist, etc.
  description         String?
  permissions         EmployeePermission[]
  isDefault           Boolean         @default(false)

  employees           Employee[]

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([businessId])
}

model Attendance {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Clock in/out
  clockIn             DateTime
  clockOut            DateTime?
  method              AttendanceMethod @default(MANUAL)

  // GPS (optional)
  clockInLat          Float?
  clockInLng          Float?
  clockOutLat         Float?
  clockOutLng         Float?

  // Break
  breakStart          DateTime?
  breakEnd            DateTime?
  totalBreakMinutes   Int?            @default(0)

  // Summary
  totalMinutes        Int?
  isLate              Boolean         @default(false)
  lateMinutes         Int?            @default(0)
  isOvertime          Boolean         @default(false)
  overtimeMinutes     Int?            @default(0)

  // Status
  notes               String?
  isAbsent            Boolean         @default(false)
  absenceReason       String?

  createdAt           DateTime        @default(now())

  @@index([businessId])
  @@index([employeeId])
  @@index([clockIn])
}

model EmployeeDocument {
  id                  String                  @id @default(uuid())
  businessId          String
  business            Business                @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee                @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  type                EmployeeDocumentType
  title               String
  description         String?
  fileUrl             String
  fileSize            Int?
  mimeType            String?

  // Expiry
  expiresAt           DateTime?
  isExpired           Boolean                 @default(false)
  expiryNotified      Boolean                 @default(false)

  // Verification
  verifiedAt          DateTime?
  verifiedBy          String?

  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  @@index([businessId])
  @@index([employeeId])
  @@index([expiresAt])
}

model EmployeePerformance {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Period
  periodStart         DateTime
  periodEnd           DateTime

  // Metrics
  punctuality         Int?            @default(0)       // 0-100
  tasksCompleted      Int?            @default(0)
  tasksAssigned       Int?            @default(0)
  salesGenerated      Decimal?        @db.Decimal(12, 2)
  clientSatisfaction  Int?            @default(0)       // 0-100
  efficiency          Int?            @default(0)       // 0-100

  // Ratings
  rating              PerformanceRating?
  overallScore        Int?            @default(0)       // 0-100

  // Review
  reviewNotes         String?
  reviewedBy          String?

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([businessId])
  @@index([employeeId])
  @@index([periodStart, periodEnd])
}

model EmployeeActivity {
  id                  String          @id @default(uuid())
  businessId          String
  business            Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  employeeId          String
  employee            Employee        @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  action              String          // LOGIN, LOGOUT, CREATE_ORDER, PROCESS_PAYMENT, etc.
  module              String?         // orders, payments, reservations, etc.
  description         String?
  metadata            Json?
  ipAddress           String?

  createdAt           DateTime        @default(now())

  @@index([businessId])
  @@index([employeeId])
  @@index([createdAt])
  @@index([action])
}

`;

c = c.slice(0, empSchedulePos) + employeeModel + c.slice(empSchedulePos);

// ===== 3. Add relation from EmployeeSchedule to Employee =====
c = c.replace(
  '  employeeId      String?         // User ID if registered\n',
  '  employeeId      String?         // User ID if registered\n  employeeRef     String?\n  employee        Employee?       @relation(fields: [employeeRef], references: [id])\n'
);

// ===== 4. Add relations to Business model =====
c = c.replace(
  '  planningTasks     PlanningTask[]\n  employeeSchedules EmployeeSchedule[]',
  '  planningTasks     PlanningTask[]\n  employees         Employee[]\n  employeeRoles     EmployeeRole[]\n  attendances       Attendance[]\n  employeeDocuments EmployeeDocument[]\n  employeePerformances EmployeePerformance[]\n  employeeActivities EmployeeActivity[]\n  employeeSchedules EmployeeSchedule[]'
);

// ===== 5. Add link from PlanningTask to Employee =====
c = c.replace(
  '  // Relations\n  order             Order?           @relation(fields: [orderId], references: [id])\n  booking           Booking?         @relation(fields: [bookingId], references: [id])',
  '  // Relations\n  order             Order?           @relation(fields: [orderId], references: [id])\n  booking           Booking?         @relation(fields: [bookingId], references: [id])\n  assigneeId        String?\n  assignee          Employee?        @relation("TaskAssignee", fields: [assigneeId], references: [id])'
);

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Employee Prisma schema updated successfully');
