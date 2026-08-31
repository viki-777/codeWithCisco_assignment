import type { Employee } from '../org/types'

/** Otherwise-valid department where MGR_A's manager_id is its own employee_id. */
export const selfManagerDept: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'MGR_A', name: 'Rahul Sen', role: 'Programme manager', monthly_salary: 90000, manager_id: 'MGR_A' },
]
