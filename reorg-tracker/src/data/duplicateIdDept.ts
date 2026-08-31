import type { Employee } from '../org/types'

/** Otherwise-valid department with a repeated employee_id ("MGR_A"). */
export const duplicateIdDept: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'MGR_A', name: 'Rahul Sen', role: 'Programme manager', monthly_salary: 90000, manager_id: 'HOD' },
  { employee_id: 'MGR_A', name: 'Devika Iyer', role: 'Laboratory manager', monthly_salary: 85000, manager_id: 'HOD' },
]
