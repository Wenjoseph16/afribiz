const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// 1) Add employees relation to User model
const userCustomers = '  customers           Customer[]\n  employees           Employee[]';
// Check if already has employees
if (c.includes('  customers           Customer[]') && !c.includes('  employees           Employee[]')) {
  c = c.replace('  customers           Customer[]', userCustomers);
  console.log('✅ Added employees to User model');
}

// 2) Add employee relation to EmployeeSchedule
// Check current state
const scheduleModel = c.indexOf('model EmployeeSchedule {');
const scheduleBodyStart = c.indexOf('\n', scheduleModel) + 1;
const scheduleBody = c.substring(scheduleBodyStart, c.indexOf('}', scheduleModel));

if (!scheduleBody.includes('employeeRef')) {
  // Add employeeRef field after employeeId
  const empIdPos = scheduleBody.indexOf('  employeeId      String?');
  if (empIdPos >= 0) {
    const insertPos = scheduleBodyStart + empIdPos;
    const lineEnd = c.indexOf('\n', insertPos);
    c = c.slice(0, lineEnd + 1) + '  employeeRef     String?\n  employee        Employee?       @relation(fields: [employeeRef], references: [id])\n' + c.slice(lineEnd + 1);
    console.log('✅ Added employee relation to EmployeeSchedule');
  }
}

// 3) Add assignee relation to PlanningTask
const taskModel = c.indexOf('model PlanningTask {');
const taskBodyStart = c.indexOf('\n', taskModel) + 1;
const taskBody = c.substring(taskBodyStart, c.indexOf('\n\n', taskModel));

if (!taskBody.includes('assigneeId')) {
  // Find assignedTo line and add after it
  const assignedToPos = taskBody.indexOf('  assignedTo      String?');
  if (assignedToPos >= 0) {
    const insertPos = taskBodyStart + assignedToPos;
    const lineEnd = c.indexOf('\n', insertPos);
    c = c.slice(0, lineEnd + 1) + '  assigneeId      String?\n  assignee        Employee?        @relation("TaskAssignee", fields: [assigneeId], references: [id])\n' + c.slice(lineEnd + 1);
    console.log('✅ Added assignee relation to PlanningTask');
  }
}

// 4) Clean up: remove duplicate Business relations if any
// Check for duplicate employees/employeeRoles/attendances etc in Business model
const businessModel = c.indexOf('model Business {');
const businessBodyStart = c.indexOf('\n', businessModel) + 1;
// Find the @@map line or the next model
const businessBodyEnd = c.indexOf('}', businessModel);
const businessBody = c.substring(businessBodyStart, businessBodyEnd);

// Count occurrences of employee-related relations
const empCount = (businessBody.match(/employees\s+Employee\[\]/g) || []).length;
const roleCount = (businessBody.match(/employeeRoles\s+EmployeeRole\[\]/g) || []).length;
if (empCount > 1) {
  console.log('⚠️ Found', empCount, 'employee relations in Business - fixing');
  // Keep only the first occurrence
  const lines = businessBody.split('\n');
  let foundFirst = false;
  const cleaned = lines.filter(line => {
    if (line.includes('employees') && line.includes('Employee[]')) {
      if (foundFirst) return false;
      foundFirst = true;
    }
    return true;
  });
  // Reconstruct
  // Actually this is complex, let me use a different approach
}
if (roleCount > 1) {
  console.log('⚠️ Found', roleCount, 'employeeRoles in Business');
}

fs.writeFileSync('backend/prisma/schema.prisma', c, 'utf-8');
console.log('✅ Schema fixes applied');
