import type { Employee } from '../org/types'

/**
 * Otherwise-valid department (one root, all managers resolve, no
 * self-references) where MGR_A and MGR_B form a two-node cycle disconnected
 * from the root.
 */
export const cycleDept: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'MGR_A', name: 'Rahul Sen', role: 'Programme manager', monthly_salary: 90000, manager_id: 'MGR_B' },
  { employee_id: 'MGR_B', name: 'Devika Iyer', role: 'Laboratory manager', monthly_salary: 85000, manager_id: 'MGR_A' },
]
